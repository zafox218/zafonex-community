import argon2 from 'argon2';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler, unauthorized, conflict, badRequest } from '../../lib/errors.js';
import { signAccessToken, signRefreshToken, verifyRefresh, hashToken } from '../../lib/jwt.js';
import { getAccount } from '../../lib/ledger.js';
import { env } from '../../config/env.js';

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(24).regex(/^[a-z0-9_]+$/i, 'Letters, numbers and underscore only'),
  password: z.string().min(10, 'Use at least 10 characters'),
  displayName: z.string().min(2).max(60).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const ARGON_OPTS = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 };

const publicUser = (u) => ({
  id: u.id, email: u.email, username: u.username, role: u.role,
  displayName: u.displayName, avatarUrl: u.avatarUrl, isVerified: u.isVerified,
});

async function issueSession(user, req) {
  const refresh = signRefreshToken(user);
  const decoded = verifyRefresh(refresh);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refresh),
      userAgent: req.headers['user-agent']?.slice(0, 200),
      ip: req.ip,
      expiresAt: new Date(decoded.exp * 1000),
    },
  });
  return { accessToken: signAccessToken(user), refreshToken: refresh };
}

export const register = asyncHandler(async (req, res) => {
  const { email, username, password, displayName } = req.body;

  const clash = await prisma.user.findFirst({
    where: { OR: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] },
  });
  if (clash) throw conflict('That email or username is already registered');

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      passwordHash: await argon2.hash(password, ARGON_OPTS),
      displayName: displayName ?? username,
    },
  });

  // Every user gets their three wallet accounts up front.
  await Promise.all([
    getAccount(null, user.id, 'USER_AVAILABLE'),
    getAccount(null, user.id, 'USER_PENDING'),
    getAccount(null, user.id, 'USER_ESCROW'),
  ]);

  const tokens = await issueSession(user, req);
  res.status(201).json({ user: publicUser(user), ...tokens });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  // Constant-ish work whether or not the account exists.
  const valid = user ? await argon2.verify(user.passwordHash, password).catch(() => false) : false;
  if (!user || !valid) throw unauthorized('Email or password is incorrect');
  if (user.isBanned) throw unauthorized('This account is suspended');

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const tokens = await issueSession(user, req);
  res.json({ user: publicUser(user), ...tokens });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.body?.refreshToken || req.cookies?.refresh_token;
  if (!token) throw badRequest('refreshToken is required');

  let payload;
  try { payload = verifyRefresh(token); } catch { throw unauthorized('Refresh token is invalid'); }

  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) throw unauthorized('Session revoked');

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.isBanned) throw unauthorized('Account unavailable');

  // Rotation: the old refresh token dies the moment it is used.
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
  const tokens = await issueSession(user, req);
  res.json({ user: publicUser(user), ...tokens });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.body?.refreshToken || req.cookies?.refresh_token;
  if (token) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  res.json({ ok: true });
});

export const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json({ user: publicUser(user), currency: env.CURRENCY });
});
