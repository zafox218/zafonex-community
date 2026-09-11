import { logger } from '../lib/logger.js';
import { isProd } from '../config/env.js';
import { AppError } from '../lib/errors.js';

export const notFoundHandler = (req, res) => {
  res.status(404).json({ error: { message: `No route for ${req.method} ${req.originalUrl}`, code: 'NOT_FOUND' } });
};

export const errorHandler = (err, req, res, _next) => {
  // Prisma unique-constraint violations map cleanly onto 409.
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] ?? 'value';
    return res.status(409).json({ error: { message: `That ${field} is already taken`, code: 'CONFLICT' } });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: { message: 'Record not found', code: 'NOT_FOUND' } });
  }

  const status = err instanceof AppError ? err.status : 500;
  if (status >= 500) logger.error({ err, path: req.originalUrl }, 'unhandled error');

  res.status(status).json({
    error: {
      message: status >= 500 && isProd ? 'Something went wrong on our side' : err.message,
      code: err.code ?? 'INTERNAL',
      ...(err.details ? { details: err.details } : {}),
    },
  });
};
