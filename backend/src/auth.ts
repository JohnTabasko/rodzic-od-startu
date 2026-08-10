/**
 * JWT authentication for the anonymous MVP account flow.
 * Production deployments must provide a strong JWT_SECRET through the environment.
 */
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from './config';

export interface AuthPayload {
  sub: string;
  role: string;
}

export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

export function signToken(userId: string, role: string): string {
  return jwt.sign({ sub: userId, role }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: '90d',
    issuer: 'rodzic-od-startu',
  });
}

export function verifyToken(token: string): AuthPayload | null {
  if (!token || token.length > 4096) return null;

  try {
    const payload = jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],
      issuer: 'rodzic-od-startu',
    }) as jwt.JwtPayload;

    return payload.sub ? { sub: payload.sub, role: String(payload.role ?? 'other') } : null;
  } catch {
    return null;
  }
}

export function bearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer\s+([^\s]+)$/i.exec(header.trim());
  return match?.[1] ?? null;
}
