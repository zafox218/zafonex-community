import { Router } from 'express';
import * as c from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rateLimit.js';

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate({ body: c.registerSchema }), c.register);
authRouter.post('/login',    authLimiter, validate({ body: c.loginSchema }),    c.login);
authRouter.post('/refresh',  c.refresh);
authRouter.post('/logout',   c.logout);
authRouter.get('/me',        requireAuth, c.me);
