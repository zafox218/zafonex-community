import { Router } from 'express';
import { authRouter } from './modules/auth/auth.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { productsRouter } from './modules/products/products.routes.js';
import { servicesRouter } from './modules/services/services.routes.js';
import { coursesRouter } from './modules/courses/courses.routes.js';
import { ordersRouter } from './modules/orders/orders.routes.js';
import { walletRouter } from './modules/wallet/wallet.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { prisma } from './lib/prisma.js';
import { asyncHandler } from './lib/errors.js';

export const router = Router();

router.get('/categories', asyncHandler(async (_req, res) => {
  res.json({ categories: await prisma.category.findMany({ orderBy: { name: 'asc' } }) });
}));

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/products', productsRouter);
router.use('/services', servicesRouter);
router.use('/courses', coursesRouter);
router.use('/orders', ordersRouter);
router.use('/wallet', walletRouter);
router.use('/admin', adminRouter);
