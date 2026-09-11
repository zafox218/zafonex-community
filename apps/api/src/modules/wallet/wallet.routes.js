import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler, badRequest, notFound } from '../../lib/errors.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { getAccount, platformAccount, postTransaction } from '../../lib/ledger.js';
import { toMicros } from '../../lib/money.js';
import { env } from '../../config/env.js';

export const walletRouter = Router();

walletRouter.get('/', requireAuth, asyncHandler(async (req, res) => {
  const accounts = await prisma.ledgerAccount.findMany({ where: { userId: req.user.id } });
  const entries = await prisma.ledgerEntry.findMany({
    where: { account: { userId: req.user.id } },
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: { transaction: true, account: { select: { type: true } } },
  });

  const balances = Object.fromEntries(accounts.map((a) => [a.type, a.balance.toString()]));
  res.json({
    currency: env.CURRENCY,
    network: env.USDT_NETWORK,
    depositAddress: env.USDT_DEPOSIT_ADDRESS,
    minWithdrawal: env.WITHDRAWAL_MIN_USDT,
    balances,
    entries,
  });
}));

const depositSchema = z.object({
  amountUsdt: z.coerce.number().min(1),
  txHash: z.string().min(10).max(120),
  fromAddress: z.string().optional(),
  network: z.string().default(env.USDT_NETWORK),
});

/// Buyer declares an on-chain transfer. Credit happens only after review.
walletRouter.post('/deposits', requireAuth, validate({ body: depositSchema }), asyncHandler(async (req, res) => {
  const deposit = await prisma.deposit.create({
    data: {
      userId: req.user.id,
      amountUsdt: req.body.amountUsdt.toFixed(6),
      txHash: req.body.txHash,
      fromAddress: req.body.fromAddress,
      network: req.body.network,
      status: 'CONFIRMING',
    },
  });
  res.status(201).json({ deposit, message: 'We will credit your wallet once the transfer is confirmed.' });
}));

/// Admin confirms a deposit: gateway -> user available.
walletRouter.post('/deposits/:id/confirm', requireAuth, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const out = await prisma.$transaction(async (tx) => {
    const deposit = await tx.deposit.findUnique({ where: { id: req.params.id } });
    if (!deposit) throw notFound('Deposit not found');
    if (deposit.status === 'CREDITED') throw badRequest('Already credited');

    const amount = toMicros(deposit.amountUsdt);
    const gateway = await platformAccount(tx, 'PLATFORM_GATEWAY');
    const available = await getAccount(tx, deposit.userId, 'USER_AVAILABLE');

    await postTransaction(tx, {
      kind: 'deposit', memo: `USDT deposit ${deposit.txHash}`,
      entries: [
        { accountId: gateway.id, direction: 'DEBIT', amount },
        { accountId: available.id, direction: 'CREDIT', amount },
      ],
    });

    return tx.deposit.update({
      where: { id: deposit.id },
      data: { status: 'CREDITED', reviewedById: req.user.id, reviewedAt: new Date() },
    });
  });

  res.json({ deposit: out });
}));

const withdrawalSchema = z.object({
  amountUsdt: z.coerce.number().min(env.WITHDRAWAL_MIN_USDT),
  toAddress: z.string().min(20).max(120),
  network: z.string().default(env.USDT_NETWORK),
});

/// Seller cashes out. Funds leave the available balance immediately so they
/// cannot be double-spent while the payout is being processed.
walletRouter.post('/withdrawals', requireAuth, validate({ body: withdrawalSchema }), asyncHandler(async (req, res) => {
  const out = await prisma.$transaction(async (tx) => {
    const amount = toMicros(req.body.amountUsdt);
    const available = await getAccount(tx, req.user.id, 'USER_AVAILABLE');
    if (toMicros(available.balance) < amount) throw badRequest('Insufficient available balance');

    const gateway = await platformAccount(tx, 'PLATFORM_GATEWAY');

    const withdrawal = await tx.withdrawal.create({
      data: {
        userId: req.user.id,
        amountUsdt: req.body.amountUsdt.toFixed(6),
        toAddress: req.body.toAddress,
        network: req.body.network,
      },
    });

    await postTransaction(tx, {
      kind: 'withdrawal', memo: `Payout request ${withdrawal.id}`,
      entries: [
        { accountId: available.id, direction: 'DEBIT', amount },
        { accountId: gateway.id, direction: 'CREDIT', amount },
      ],
    });

    return withdrawal;
  });

  res.status(201).json({ withdrawal: out, message: 'Payout queued for review.' });
}));

walletRouter.get('/withdrawals', requireAuth, asyncHandler(async (req, res) => {
  const withdrawals = await prisma.withdrawal.findMany({
    where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 50,
  });
  res.json({ withdrawals });
}));
