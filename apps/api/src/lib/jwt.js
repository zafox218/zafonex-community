import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../config/env.js';

export const signAccessToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role, username: user.username }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL,
    issuer: 'zafonex',
  });

export const signRefreshToken = (user) =>
  jwt.sign({ sub: user.id, jti: crypto.randomUUID() }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL,
    issuer: 'zafonex',
  });

export const verifyAccess  = (t) => jwt.verify(t, env.JWT_ACCESS_SECRET,  { issuer: 'zafonex' });
export const verifyRefresh = (t) => jwt.verify(t, env.JWT_REFRESH_SECRET, { issuer: 'zafonex' });

/// Refresh tokens are stored hashed — a database leak must not grant sessions.
export const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');
