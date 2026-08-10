/**
 * JWT (docelowo OIDC — wystawca zewnętrzny, LWT/JWKS):
 * tu na czas MVP token anonimowy podpisujemy HS256 (sekret z env), a middleware
 * weryfikuje podpis + exp. Token NIE jest przechowywany wprost — tylko sha256.
 */
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';
export const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export function signToken(userId: string, role: string): string {
  return jwt.sign({ sub: userId, role }, SECRET, { expiresIn: '90d', issuer: 'rodzic-od-startu' });
}

export function verifyToken(token: string): { sub: string; role: string } | null {
  try {
    const p = jwt.verify(token, SECRET, { issuer: 'rodzic-od-startu' }) as jwt.JwtPayload;
    return p.sub ? { sub: p.sub, role: String(p.role) } : null;
  } catch { return null; }
}
