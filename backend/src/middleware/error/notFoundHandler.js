import NotFoundError from '../../shared/errors/NotFoundError.js';

/**
 * Terminal middleware for unmapped routes.
 * Always forwards a typed NotFoundError into the global error middleware.
 */
export default function notFoundHandler(req, _res, next) {
  next(
    new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`, {
      method: req.method,
      path: req.originalUrl,
    })
  );
}
