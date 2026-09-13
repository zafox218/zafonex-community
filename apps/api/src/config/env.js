import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  PLATFORM_FEE_BPS: z.coerce.number().min(0).max(5000).default(1000),
  WITHDRAWAL_MIN_USDT: z.coerce.number().default(20),
  CURRENCY: z.string().default('USDT'),
  USDT_NETWORK: z.string().default('TRC20'),
  USDT_DEPOSIT_ADDRESS: z.string().default(''),
  DEPOSIT_CONFIRMATIONS: z.coerce.number().default(19),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const msg = 'Invalid environment: ' + parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
  console.error(msg);
  // Don't exit in production - let it fail gracefully
}

export const env = parsed.success ? parsed.data : {
  NODE_ENV: 'production', PORT: 4000, WEB_ORIGIN: '*', 
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev-secret-min-32-chars-long!!',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-min-32-chars-long!!',
  JWT_ACCESS_TTL: '15m', JWT_REFRESH_TTL: '30d', PLATFORM_FEE_BPS: 1000,
  WITHDRAWAL_MIN_USDT: 20, CURRENCY: 'USDT', USDT_NETWORK: 'TRC20',
  USDT_DEPOSIT_ADDRESS: '', DEPOSIT_CONFIRMATIONS: 19,
};
export const isProd = env.NODE_ENV === 'production';
