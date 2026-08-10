/**
 * Apple/Google Sign-In verification.
 *
 * The API always verifies the provider signature and claims on the server. The
 * unsigned development token path is available only when explicitly enabled
 * and must never be enabled in production.
 */
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { config } from './config';

const googleJwks = jwksClient({
  jwksUri: 'https://www.googleapis.com/oauth2/v3/certs',
  cache: true,
  cacheMaxAge: 60 * 60 * 1000,
});
const appleJwks = jwksClient({
  jwksUri: 'https://appleid.apple.com/auth/keys',
  cache: true,
  cacheMaxAge: 60 * 60 * 1000,
});

export type Provider = 'google' | 'apple';
export interface SocialIdentity {
  sub: string;
  email?: string;
}

function getSigningKey(client: jwksClient.JwksClient, kid: string): Promise<string> {
  return new Promise((resolve, reject) => {
    client.getSigningKey(kid, (error, key) => {
      if (error || !key) return reject(error ?? new Error('NO_SIGNING_KEY'));
      resolve(key.getPublicKey());
    });
  });
}

function verifyDevelopmentToken(idToken: string): SocialIdentity {
  const payload = jwt.decode(idToken) as jwt.JwtPayload | null;
  if (payload?.dev === true && payload.sub?.startsWith('dev-')) {
    return { sub: payload.sub, email: payload.email };
  }
  throw new Error('DEV_TOKEN_INVALID');
}

export async function verifySocial(provider: Provider, idToken: string): Promise<SocialIdentity> {
  if (!idToken || idToken.length > 10000) throw new Error('INVALID_ID_TOKEN');
  if (config.socialDevMode) return verifyDevelopmentToken(idToken);

  const decoded = jwt.decode(idToken, { complete: true });
  const kid = decoded?.header?.kid;
  if (!kid) throw new Error('NO_KID');

  if (provider === 'google') {
    if (config.googleClientIds.length === 0) throw new Error('GOOGLE_CLIENT_IDS_NOT_CONFIGURED');
    const key = await getSigningKey(googleJwks, kid);
    const payload = jwt.verify(idToken, key, {
      algorithms: ['RS256'],
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: config.googleClientIds as [string, ...string[]],
    }) as jwt.JwtPayload;
    if (!payload.sub) throw new Error('NO_SUB');
    return { sub: `google:${payload.sub}`, email: payload.email };
  }

  if (!config.appleClientId) throw new Error('APPLE_CLIENT_ID_NOT_CONFIGURED');
  const key = await getSigningKey(appleJwks, kid);
  const payload = jwt.verify(idToken, key, {
    algorithms: ['RS256'],
    issuer: 'https://appleid.apple.com',
    audience: config.appleClientId,
  }) as jwt.JwtPayload;
  if (!payload.sub) throw new Error('NO_SUB');
  return { sub: `apple:${payload.sub}`, email: payload.email };
}
