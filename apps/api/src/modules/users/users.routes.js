import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler, notFound } from '../../lib/errors.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';

export const usersRouter = Router();

const profileSchema = z.object({
  displayName: z.string().min(2).max(60).optional(),
  headline: z.string().max(120).optional(),
  bio: z.string().max(2000).optional(),
  avatarUrl: z.string().url().optional(),
  country: z.string().length(2).optional(),
});

usersRouter.get('/:username', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { username: req.params.username.toLowerCase() },
    select: {
      id: true, username: true, displayName: true, headline: true, bio: true,
      avatarUrl: true, country: true, role: true, isVerified: true, createdAt: true,
      products: { where: { status: 'PUBLISHED' }, take: 12 },
      services: { where: { status: 'PUBLISHED' }, take: 12, include: { packages: true } },
      courses:  { where: { status: 'PUBLISHED' }, take: 12 },
    },
  });
  if (!user) throw notFound('No such user');
  res.json({ user });
}));

usersRouter.patch('/me', requireAuth, validate({ body: profileSchema }), asyncHandler(async (req, res) => {
  const user = await prisma.user.update({ where: { id: req.user.id }, data: req.body });
  res.json({ user: { id: user.id, username: user.username, displayName: user.displayName, headline: user.headline, bio: user.bio, avatarUrl: user.avatarUrl } });
}));

/// Promote yourself to SELLER — the gate is a completed profile, not payment.
usersRouter.post('/me/become-seller', requireAuth, asyncHandler(async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { role: req.user.role === 'ADMIN' ? 'ADMIN' : 'SELLER' },
  });
  res.json({ role: user.role });
}));
