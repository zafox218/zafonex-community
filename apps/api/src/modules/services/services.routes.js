import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler, notFound, forbidden } from '../../lib/errors.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { slugify } from '../../lib/slug.js';

export const servicesRouter = Router();

const packageSchema = z.object({
  tier: z.enum(['BASIC', 'STANDARD', 'PREMIUM']),
  name: z.string().min(2).max(40),
  description: z.string().min(10).max(400),
  priceUsdt: z.coerce.number().min(5),
  deliveryDays: z.coerce.number().min(1).max(90),
  revisions: z.coerce.number().min(0).max(20).default(1),
  features: z.array(z.string()).max(10).default([]),
});

const serviceSchema = z.object({
  title: z.string().min(10).max(120),
  summary: z.string().min(20).max(240),
  description: z.string().min(40),
  categoryId: z.string().optional(),
  coverUrl: z.string().url().optional(),
  tags: z.array(z.string()).max(8).default([]),
  packages: z.array(packageSchema).min(1).max(3),
});

servicesRouter.get('/', asyncHandler(async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Math.min(Number(req.query.limit ?? 12), 48);
  const q = req.query.q;

  const where = {
    status: 'PUBLISHED',
    ...(q ? { title: { contains: String(q), mode: 'insensitive' } } : {}),
    ...(req.query.category ? { category: { slug: String(req.query.category) } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.service.findMany({
      where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
      include: { packages: { orderBy: { priceUsdt: 'asc' } }, seller: { select: { username: true, displayName: true, avatarUrl: true } } },
    }),
    prisma.service.count({ where }),
  ]);

  res.json({ items, total, page, pages: Math.ceil(total / limit) });
}));

servicesRouter.get('/:slug', asyncHandler(async (req, res) => {
  const service = await prisma.service.findUnique({
    where: { slug: req.params.slug },
    include: {
      packages: { orderBy: { priceUsdt: 'asc' } },
      seller: { select: { username: true, displayName: true, avatarUrl: true, headline: true, country: true } },
      reviews: { take: 10, orderBy: { createdAt: 'desc' }, include: { author: { select: { username: true } } } },
    },
  });
  if (!service) throw notFound('Service not found');
  res.json({ service });
}));

servicesRouter.post('/', requireAuth, requireRole('SELLER', 'ADMIN'),
  validate({ body: serviceSchema }), asyncHandler(async (req, res) => {
    const { packages, ...rest } = req.body;
    const service = await prisma.service.create({
      data: {
        ...rest,
        slug: await slugify(prisma.service, rest.title),
        sellerId: req.user.id,
        packages: { create: packages.map((p) => ({ ...p, priceUsdt: p.priceUsdt.toFixed(6) })) },
      },
      include: { packages: true },
    });
    res.status(201).json({ service });
  }));

servicesRouter.patch('/:id/status', requireAuth, asyncHandler(async (req, res) => {
  const service = await prisma.service.findUnique({ where: { id: req.params.id } });
  if (!service) throw notFound('Service not found');
  if (service.sellerId !== req.user.id && req.user.role !== 'ADMIN') throw forbidden();
  const updated = await prisma.service.update({
    where: { id: service.id },
    data: { status: req.body.status },
  });
  res.json({ service: updated });
}));
