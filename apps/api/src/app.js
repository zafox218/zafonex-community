const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pinoHttp = require('pino-http');
const { z } = require('zod');

const { env } = require('./config/env');
const { logger } = require('./lib/logger');
const { errorHandler } = require('./middleware/error');
const { globalLimiter } = require('./middleware/rateLimit');
const router = require('./routes');

const app = express();

// Trust proxy for Vercel
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// CORS
app.use(cors({
  origin: env.WEB_ORIGIN,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
app.use(pinoHttp({
  logger,
  autoLogging: { ignore: (req) => req.url === '/health' },
}));

// Global rate limiter
app.use(globalLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1', router);

// Error handler
app.use(errorHandler);

module.exports = app;
