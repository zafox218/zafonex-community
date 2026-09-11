import rateLimit from 'express-rate-limit';

const base = { standardHeaders: true, legacyHeaders: false };

export const globalLimiter = rateLimit({
  ...base, windowMs: 60_000, limit: 300,
  message: { error: { message: 'Too many requests — slow down.' } },
});

export const authLimiter = rateLimit({
  ...base, windowMs: 15 * 60_000, limit: 10, skipSuccessfulRequests: true,
  message: { error: { message: 'Too many attempts. Try again in 15 minutes.' } },
});

export const writeLimiter = rateLimit({ ...base, windowMs: 60_000, limit: 40 });
