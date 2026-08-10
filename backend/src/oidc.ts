/**
 * Apple/Google Sign-In — weryfikacja id_token po stronie serwera (OIDC):
 *  - pobieranie kluczy JWKS dostawcy (z cache)
 *  - weryfikacja podpisu RS256, iss, aud i exp
 *  - tryb SOCIAL_DEV_MODE=true: akceptuje testowe tokeny z payload.dev=true (bez podpisu)
 * Zmienne: GOOGLE_CLIENT_IDS (csv aud), APPLE_CLIENT_ID (bundle id), SOCIAL_DEV_MODE.
 */
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const googleJwks = jwksClient({ jwksUri: 'https://www.googleapis.com/oauth2/v3/certs', cache: true, cacheMaxAge: 60 * 60 * 1000 });
const appleJwks = jwksClient({ jwksUri: 'https://appleid.apple.com/auth/keys', cache: true, cacheMaxAge: 60 * 60 * 1000 });

export type Provider = 'google' | 'apple';
export interface SocialIdentity { sub: string; email?: string; }

function getSigningKey(client: jwksClient.JwksClient, kid: string): Promise<string> {
  return new Promise((resolve, reject) => {
    client.getSigningKey(kid, (err, key) => {
      if (err || !key) return reject(err ?? new Error('NO_KEY'));
      resolve(key.getPublicKey());
    });
  });
}

export async function verifySocial(provider: Provider, idToken: string): Promise<SocialIdentity> {
  // Tryb developerski do testów E2E bez kluczy produkcyjnych
  if (process.env.SOCIAL_DEV_MODE === 'true') {
    const payload = jwt.decode(idToken) as jwt.JwtPayload | null;
    if (payload?.dev === true && payload.sub?.startsWith('dev-')) {
      return { sub: payload.sub, email: payload.email };
    }
    throw new Error('DEV_TOKEN_INVALID');
  }

  const decoded = jwt.decode(idToken, { complete: true });
  const kid = decoded?.header?.kid;
  if (!kid) throw new Error('NO_KID');

  if (provider === 'google') {
    const audiences = (process.env.GOOGLE_CLIENT_IDS ?? '').split(',').filter(Boolean);
    const key = await getSigningKey(googleJwks, kid);
    const payload = jwt.verify(idToken, key, {
      algorithms: ['RS256'],
      issuer: ['https://accounts.google.com', 'accounts.google.com'] as [string, string],
      audience: audiences.length ? (audiences as [string, ...string[]]) : undefined,
    }) as jwt.JwtPayload;
    if (!payload.sub) throw new Error('NO_SUB');
    return { sub: `google:${payload.sub}`, email: payload.email };
  }

  // apple
  const key = await getSigningKey(appleJwks, kid);
  const aud = process.env.APPLE_CLIENT_ID;
  const payload = jwt.verify(idToken, key, {
    algorithms: ['RS256'],
    issuer: 'https://appleid.apple.com',
    audience: aud || undefined,
  }) as jwt.JwtPayload;
  if (!payload.sub) throw new Error('NO_SUB');
  return { sub: `apple:${payload.sub}`, email: payload.email };
}
