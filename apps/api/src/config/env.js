import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  PLATFORM_FEE_BPS: z.coerce.number().min(0).max(5000).default(1000),
  WITHDRAWAL_MIN_USDT: z.coerce.number().default(20),
  CURRENCY: z.string().default('USDT'),
  USDT_NETWORK: z.string().default('TRC20'),
  USDT_DEPOSIT_ADDRESS: z.string().default(''),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('\n✘ Invalid environment. Fix apps/api/.env:\n');
  for (const issue of parsed.error.issues) console.error(`  · ${issue.path.join('.')}: ${issue.message}`);
  console.error('');
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
