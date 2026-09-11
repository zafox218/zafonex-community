import { verifyAccess } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';
import { unauthorized, forbidden, asyncHandler } from '../lib/errors.js';

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.access_token;
  if (!token) throw unauthorized();

  let payload;
  try {
    payload = verifyAccess(token);
  } catch {
    throw unauthorized('Session expired — refresh your token');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, username: true, role: true, isBanned: true, displayName: true, avatarUrl: true },
  });

  if (!user) throw unauthorized('Account no longer exists');
  if (user.isBanned) throw forbidden('This account is suspended');

  req.user = user;
  next();
});

/// Attaches req.user when a token is present, but never rejects.
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return next();
  try {
    const payload = verifyAccess(header.slice(7));
    req.user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, username: true, role: true },
    });
  } catch { /* anonymous */ }
  next();
});
