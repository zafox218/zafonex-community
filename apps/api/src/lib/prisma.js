import { PrismaClient } from '@prisma/client';
import { isProd } from '../config/env.js';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__zafonexPrisma ??
  new PrismaClient({ log: isProd ? ['error'] : ['warn', 'error'] });

if (!isProd) globalForPrisma.__zafonexPrisma = prisma;
