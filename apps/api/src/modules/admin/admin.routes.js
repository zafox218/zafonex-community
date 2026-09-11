import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../lib/errors.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('ADMIN'));

adminRouter.get('/stats', asyncHandler(async (_req, res) => {
  const [users, products, services, courses, orders, revenue, gateway] = await Promise.all([
    prisma.user.count(),
    prisma.product.count({ where: { status: 'PUBLISHED' } }),
    prisma.service.count({ where: { status: 'PUBLISHED' } }),
    prisma.course.count({ where: { status: 'PUBLISHED' } }),
    prisma.order.count(),
    prisma.ledgerAccount.findFirst({ where: { userId: null, type: 'PLATFORM_REVENUE' } }),
    prisma.ledgerAccount.findFirst({ where: { userId: null, type: 'PLATFORM_GATEWAY' } }),
  ]);

  res.json({
    users, products, services, courses, orders,
    revenueUsdt: revenue?.balance?.toString() ?? '0',
    gatewayUsdt: gateway?.balance?.toString() ?? '0',
  });
}));

adminRouter.get('/deposits', asyncHandler(async (_req, res) => {
  const deposits = await prisma.deposit.findMany({
    where: { status: { in: ['AWAITING', 'CONFIRMING'] } },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { username: true, email: true } } },
  });
  res.json({ deposits });
}));

adminRouter.get('/withdrawals', asyncHandler(async (_req, res) => {
  const withdrawals = await prisma.withdrawal.findMany({
    where: { status: { in: ['REQUESTED', 'APPROVED'] } },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { username: true, email: true } } },
  });
  res.json({ withdrawals });
}));

adminRouter.post('/withdrawals/:id/sent', asyncHandler(async (req, res) => {
  const withdrawal = await prisma.withdrawal.update({
    where: { id: req.params.id },
    data: { status: 'SENT', txHash: req.body.txHash, processedAt: new Date() },
  });
  res.json({ withdrawal });
}));

/// Integrity check: every transaction must have balanced entries.
adminRouter.get('/ledger/audit', asyncHandler(async (_req, res) => {
  const transactions = await prisma.ledgerTransaction.findMany({ include: { entries: true }, take: 500, orderBy: { createdAt: 'desc' } });
  const unbalanced = transactions.filter((t) => {
    const net = t.entries.reduce((s, e) => s + (e.direction === 'CREDIT' ? Number(e.amount) : -Number(e.amount)), 0);
    return Math.abs(net) > 1e-9;
  });
  res.json({ checked: transactions.length, unbalanced: unbalanced.map((t) => t.reference), healthy: unbalanced.length === 0 });
}));

adminRouter.patch('/users/:id', asyncHandler(async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      ...(req.body.role ? { role: req.body.role } : {}),
      ...(typeof req.body.isBanned === 'boolean' ? { isBanned: req.body.isBanned } : {}),
      ...(typeof req.body.isVerified === 'boolean' ? { isVerified: req.body.isVerified } : {}),
    },
  });
  res.json({ user: { id: user.id, username: user.username, role: user.role, isBanned: user.isBanned } });
}));
