import { forbidden } from '../lib/errors.js';

/// requireRole('ADMIN') · requireRole('SELLER', 'ADMIN')
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(forbidden('Authentication required'));
  if (!roles.includes(req.user.role)) return next(forbidden(`Requires role: ${roles.join(' or ')}`));
  next();
};

/// Ownership check for resources loaded onto req by an earlier handler.
export const requireOwnerOrAdmin = (getOwnerId) => (req, _res, next) => {
  if (req.user?.role === 'ADMIN') return next();
  if (getOwnerId(req) === req.user?.id) return next();
  next(forbidden('You do not own this resource'));
};
