import { Router } from 'express';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler, notFound, badRequest, forbidden } from '../../lib/errors.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { writeLimiter } from '../../middleware/rateLimit.js';
import { postTransaction, getAccount, platformAccount } from '../../lib/ledger.js';
import { toMicros, splitFee } from '../../lib/money.js';

export const ordersRouter = Router();

const checkoutSchema = z.object({
  items: z.array(z.object({
    kind: z.enum(['PRODUCT', 'SERVICE', 'COURSE']),
    id: z.string(),          // product / service / course id
    packageId: z.string().optional(),  // required for SERVICE
    quantity: z.coerce.number().min(1).max(10).default(1),
  })).min(1).max(20),
  note: z.string().max(1000).optional(),
});

/**
 * Checkout.
 *
 * Money flow, all inside one database transaction:
 *   buyer.available            -DEBIT->
 *   buyer.escrow               <-CREDIT-        (funds locked)
 * Instant items (products, courses) settle in the same call:
 *   buyer.escrow               -DEBIT->
 *   seller.available           <-CREDIT- net
 *   platform.revenue           <-CREDIT- fee
 * Service items stay in escrow until the seller delivers and the buyer accepts.
 */
ordersRouter.post('/checkout', requireAuth, writeLimiter, validate({ body: checkoutSchema }),
  asyncHandler(async (req, res) => {
    const result = await prisma.$transaction(async (tx) => {
      const lines = [];

      for (const item of req.body.items) {
        if (item.kind === 'PRODUCT') {
          const p = await tx.product.findUnique({ where: { id: item.id } });
          if (!p || p.status !== 'PUBLISHED') throw notFound('Product unavailable');
          if (p.sellerId === req.user.id) throw badRequest('You cannot buy your own listing');
          lines.push({ kind: 'PRODUCT', sellerId: p.sellerId, productId: p.id, title: p.title, unit: toMicros(p.priceUsdt), quantity: item.quantity, instant: true });
        }

        if (item.kind === 'COURSE') {
          const c = await tx.course.findUnique({ where: { id: item.id } });
          if (!c || c.status !== 'PUBLISHED') throw notFound('Course unavailable');
          const already = await tx.enrollment.findUnique({ where: { userId_courseId: { userId: req.user.id, courseId: c.id } } });
          if (already) throw badRequest('You are already enrolled in this course');
          lines.push({ kind: 'COURSE', sellerId: c.instructorId, courseId: c.id, title: c.title, unit: toMicros(c.priceUsdt), quantity: 1, instant: true });
        }

        if (item.kind === 'SERVICE') {
          if (!item.packageId) throw badRequest('Choose a package tier for service orders');
          const pkg = await tx.servicePackage.findUnique({ where: { id: item.packageId }, include: { service: true } });
          if (!pkg || pkg.serviceId !== item.id) throw badRequest('That package does not belong to this service');
          if (pkg.service.sellerId === req.user.id) throw badRequest('You cannot buy your own service');
          lines.push({
            kind: 'SERVICE', sellerId: pkg.service.sellerId, serviceId: pkg.serviceId, packageId: pkg.id,
            title: `${pkg.service.title} — ${pkg.name}`, unit: toMicros(pkg.priceUsdt), quantity: 1,
            deliveryDays: pkg.deliveryDays, instant: false,
          });
        }
      }

      const subtotal = lines.reduce((sum, l) => sum + l.unit * BigInt(l.quantity), 0n);
      const { fee } = splitFee(subtotal);

      const buyerAvailable = await getAccount(tx, req.user.id, 'USER_AVAILABLE');
      const buyerEscrow    = await getAccount(tx, req.user.id, 'USER_ESCROW');
      const revenue        = await platformAccount(tx, 'PLATFORM_REVENUE');

      if (toMicros(buyerAvailable.balance) < subtotal) {
        throw badRequest('Not enough USDT in your wallet — top up first');
      }

      const order = await tx.order.create({
        data: {
          reference: `ZX-${nanoid(10).toUpperCase()}`,
          buyerId: req.user.id,
          status: 'PAID',
          subtotalUsdt: (Number(subtotal) / 1e6).toFixed(6),
          feeUsdt: (Number(fee) / 1e6).toFixed(6),
          totalUsdt: (Number(subtotal) / 1e6).toFixed(6),
          note: req.body.note,
          paidAt: new Date(),
          items: {
            create: lines.map((l) => ({
              kind: l.kind, sellerId: l.sellerId, title: l.title,
              productId: l.productId, serviceId: l.serviceId, packageId: l.packageId, courseId: l.courseId,
              unitUsdt: (Number(l.unit) / 1e6).toFixed(6), quantity: l.quantity,
              deliveryDays: l.deliveryDays,
              dueAt: l.deliveryDays ? new Date(Date.now() + l.deliveryDays * 864e5) : null,
            })),
          },
        },
        include: { items: true },
      });

      // 1) Lock the whole basket into escrow.
      await postTransaction(tx, {
        kind: 'purchase', orderId: order.id, memo: `Checkout ${order.reference}`,
        entries: [
          { accountId: buyerAvailable.id, direction: 'DEBIT', amount: subtotal },
          { accountId: buyerEscrow.id, direction: 'CREDIT', amount: subtotal },
        ],
      });

      // 2) Release instantly deliverable lines.
      for (const line of lines.filter((l) => l.instant)) {
        const gross = line.unit * BigInt(line.quantity);
        const split = splitFee(gross);
        const sellerAvailable = await getAccount(tx, line.sellerId, 'USER_AVAILABLE');

        await postTransaction(tx, {
          kind: 'release', orderId: order.id, memo: `Instant delivery — ${line.title}`,
          entries: [
            { accountId: buyerEscrow.id, direction: 'DEBIT', amount: gross },
            { accountId: sellerAvailable.id, direction: 'CREDIT', amount: split.net },
            { accountId: revenue.id, direction: 'CREDIT', amount: split.fee },
          ],
        });

        if (line.courseId) {
          await tx.enrollment.create({ data: { userId: req.user.id, courseId: line.courseId } });
        }
        if (line.productId) {
          await tx.product.update({ where: { id: line.productId }, data: { salesCount: { increment: line.quantity } } });
        }
      }

      const hasService = lines.some((l) => !l.instant);
      return tx.order.update({
        where: { id: order.id },
        data: { status: hasService ? 'IN_PROGRESS' : 'COMPLETED', completedAt: hasService ? null : new Date() },
        include: { items: true },
      });
    });

    res.status(201).json({ order: result });
  }));

ordersRouter.get('/', requireAuth, asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { buyerId: req.user.id },
    orderBy: { createdAt: 'desc' },
    include: { items: true },
    take: 50,
  });
  res.json({ orders });
}));

/// Work queue for sellers.
ordersRouter.get('/selling', requireAuth, asyncHandler(async (req, res) => {
  const items = await prisma.orderItem.findMany({
    where: { sellerId: req.user.id },
    orderBy: { id: 'desc' },
    include: { order: { select: { reference: true, status: true, createdAt: true, buyer: { select: { username: true } } } } },
    take: 50,
  });
  res.json({ items });
}));

ordersRouter.post('/items/:itemId/deliver', requireAuth, asyncHandler(async (req, res) => {
  const item = await prisma.orderItem.findUnique({ where: { id: req.params.itemId } });
  if (!item) throw notFound('Order item not found');
  if (item.sellerId !== req.user.id) throw forbidden('This is not your delivery');

  const updated = await prisma.orderItem.update({
    where: { id: item.id },
    data: { deliveredAt: new Date() },
  });
  await prisma.order.update({ where: { id: item.orderId }, data: { status: 'DELIVERED' } });
  res.json({ item: updated });
}));

/// Buyer accepts a delivery — this is the moment escrow releases to the seller.
ordersRouter.post('/items/:itemId/accept', requireAuth, asyncHandler(async (req, res) => {
  const out = await prisma.$transaction(async (tx) => {
    const item = await tx.orderItem.findUnique({ where: { id: req.params.itemId }, include: { order: true } });
    if (!item) throw notFound('Order item not found');
    if (item.order.buyerId !== req.user.id) throw forbidden('This is not your order');
    if (!item.deliveredAt) throw badRequest('Nothing has been delivered yet');

    const gross = toMicros(item.unitUsdt) * BigInt(item.quantity);
    const { fee, net } = splitFee(gross);

    const buyerEscrow = await getAccount(tx, req.user.id, 'USER_ESCROW');
    const sellerAvailable = await getAccount(tx, item.sellerId, 'USER_AVAILABLE');
    const revenue = await platformAccount(tx, 'PLATFORM_REVENUE');

    await postTransaction(tx, {
      kind: 'release', orderId: item.orderId, memo: `Accepted — ${item.title}`,
      entries: [
        { accountId: buyerEscrow.id, direction: 'DEBIT', amount: gross },
        { accountId: sellerAvailable.id, direction: 'CREDIT', amount: net },
        { accountId: revenue.id, direction: 'CREDIT', amount: fee },
      ],
    });

    const pending = await tx.orderItem.count({
      where: { orderId: item.orderId, kind: 'SERVICE', deliveredAt: null },
    });

    return tx.order.update({
      where: { id: item.orderId },
      data: pending === 0 ? { status: 'COMPLETED', completedAt: new Date() } : {},
      include: { items: true },
    });
  });

  res.json({ order: out });
}));
