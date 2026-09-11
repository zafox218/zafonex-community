import { prisma } from './prisma.js';
import { fromMicros } from './money.js';
import { AppError } from './errors.js';
import { nanoid } from 'nanoid';

/**
 * Double-entry core.
 *
 * Every movement of value is a transaction made of at least two entries whose
 * debits and credits cancel out. Balances are never edited directly outside of
 * this function, which means the ledger can always be replayed to prove them.
 *
 * Convention used here: CREDIT increases a user balance, DEBIT decreases it.
 */
export async function postTransaction(tx, { kind, memo, orderId, entries }) {
  if (!Array.isArray(entries) || entries.length < 2) {
    throw new AppError(500, 'A ledger transaction needs at least two entries');
  }

  let net = 0n;
  for (const e of entries) net += e.direction === 'CREDIT' ? e.amount : -e.amount;
  if (net !== 0n) throw new AppError(500, `Unbalanced ledger transaction (${fromMicros(net)})`);

  const transaction = await tx.ledgerTransaction.create({
    data: { reference: `LT_${nanoid(16)}`, kind, memo, orderId },
  });

  for (const e of entries) {
    await tx.ledgerEntry.create({
      data: {
        transactionId: transaction.id,
        accountId: e.accountId,
        direction: e.direction,
        amount: fromMicros(e.amount < 0n ? -e.amount : e.amount),
      },
    });

    const delta = e.direction === 'CREDIT' ? e.amount : -e.amount;
    const account = await tx.ledgerAccount.update({
      where: { id: e.accountId },
      data: { balance: { increment: fromMicros(delta) } },
    });

    if (Number(account.balance) < 0 && account.type !== 'PLATFORM_GATEWAY') {
      throw new AppError(400, 'Insufficient balance for this operation');
    }
  }

  return transaction;
}

export async function getAccount(tx, userId, type) {
  const client = tx ?? prisma;
  const existing = await client.ledgerAccount.findFirst({ where: { userId, type, currency: 'USDT' } });
  if (existing) return existing;
  return client.ledgerAccount.create({ data: { userId, type, currency: 'USDT' } });
}

export const platformAccount = (tx, type) => getAccount(tx, null, type);
