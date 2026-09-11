export class AppError extends Error {
  constructor(status, message, code = undefined, details = undefined) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

export const badRequest   = (m, d) => new AppError(400, m, 'BAD_REQUEST', d);
export const unauthorized = (m = 'Authentication required') => new AppError(401, m, 'UNAUTHORIZED');
export const forbidden    = (m = 'You do not have access to this resource') => new AppError(403, m, 'FORBIDDEN');
export const notFound     = (m = 'Not found') => new AppError(404, m, 'NOT_FOUND');
export const conflict     = (m) => new AppError(409, m, 'CONFLICT');
export const unprocessable= (m, d) => new AppError(422, m, 'UNPROCESSABLE', d);

/// Wraps an async route handler so rejections reach the error middleware.
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
