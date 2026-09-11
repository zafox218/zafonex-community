import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler, notFound, forbidden } from '../../lib/errors.js';
import { requireAuth, optionalAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { writeLimiter } from '../../middleware/rateLimit.js';
import { slugify } from '../../lib/slug.js';

export const productsRouter = Router();

const listQuery = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
  sort: z.enum(['new', 'price_asc', 'price_desc', 'rating']).default('new'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(48).default(12),
});

const upsertSchema = z.object({
  title: z.string().min(6).max(120),
  summary: z.string().min(20).max(240),
  description: z.string().min(40),
  priceUsdt: z.coerce.number().min(1).max(100000),
  categoryId: z.string().optional(),
  coverUrl: z.string().url().optional(),
  tags: z.array(z.string()).max(8).default([]),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED']).optional(),
});

const ORDER_BY = {
  new: { createdAt: 'desc' },
  price_asc: { priceUsdt: 'asc' },
  price_desc: { priceUsdt: 'desc' },
  rating: { ratingAvg: 'desc' },
};

productsRouter.get('/', validate({ query: listQuery }), asyncHandler(async (req, res) => {
  const { q, category, min, max, sort, page, limit } = req.query;

  const where = {
    status: 'PUBLISHED',
    ...(q ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { summary: { contains: q, mode: 'insensitive' } }] } : {}),
    ...(category ? { category: { slug: category } } : {}),
    ...(min || max ? { priceUsdt: { ...(min ? { gte: min } : {}), ...(max ? { lte: max } : {}) } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where, orderBy: ORDER_BY[sort], skip: (page - 1) * limit, take: limit,
      include: { seller: { select: { username: true, displayName: true, avatarUrl: true } }, category: true },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({ items, total, page, pages: Math.ceil(total / limit) });
}));

productsRouter.get('/:slug', optionalAuth, asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: {
      seller: { select: { username: true, displayName: true, avatarUrl: true, headline: true } },
      category: true,
      reviews: { take: 10, orderBy: { createdAt: 'desc' }, include: { author: { select: { username: true, avatarUrl: true } } } },
    },
  });
  if (!product) throw notFound('Product not found');
  if (product.status !== 'PUBLISHED' && product.sellerId !== req.user?.id && req.user?.role !== 'ADMIN') {
    throw notFound('Product not found');
  }
  res.json({ product });
}));

productsRouter.post('/', requireAuth, requireRole('SELLER', 'ADMIN'), writeLimiter,
  validate({ body: upsertSchema }), asyncHandler(async (req, res) => {
    const product = await prisma.product.create({
      data: {
        ...req.body,
        priceUsdt: req.body.priceUsdt.toFixed(6),
        slug: await slugify(prisma.product, req.body.title),
        sellerId: req.user.id,
      },
    });
    res.status(201).json({ product });
  }));

productsRouter.patch('/:id', requireAuth, validate({ body: upsertSchema.partial() }), asyncHandler(async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) throw notFound('Product not found');
  if (existing.sellerId !== req.user.id && req.user.role !== 'ADMIN') throw forbidden();

  const data = { ...req.body };
  if (data.priceUsdt) data.priceUsdt = Number(data.priceUsdt).toFixed(6);

  const product = await prisma.product.update({ where: { id: existing.id }, data });
  res.json({ product });
}));

productsRouter.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) throw notFound('Product not found');
  if (existing.sellerId !== req.user.id && req.user.role !== 'ADMIN') throw forbidden();
  await prisma.product.update({ where: { id: existing.id }, data: { status: 'ARCHIVED' } });
  res.json({ ok: true });
}));
