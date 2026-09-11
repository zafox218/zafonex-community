import { env } from '../config/env.js';

const SCALE = 1_000_000n; // 6 decimals, matching Decimal(18,6)

export const toMicros = (value) => {
  const [whole, frac = ''] = String(value).split('.');
  const padded = (frac + '000000').slice(0, 6);
  const sign = whole.startsWith('-') ? -1n : 1n;
  return sign * (BigInt(whole.replace('-', '')) * SCALE + BigInt(padded));
};

export const fromMicros = (micros) => {
  const neg = micros < 0n;
  const abs = neg ? -micros : micros;
  const s = `${abs / SCALE}.${String(abs % SCALE).padStart(6, '0')}`;
  return neg ? `-${s}` : s;
};

/// Commission split. Fee is taken from the seller's cut, rounded down to 6dp.
export const splitFee = (grossMicros) => {
  const fee = (grossMicros * BigInt(env.PLATFORM_FEE_BPS)) / 10_000n;
  return { fee, net: grossMicros - fee };
};

export const formatUsdt = (value) => `${Number(value).toFixed(2)} ${env.CURRENCY}`;
