import logger from '../../infrastructure/logger/index.js';
import normalizeError from '../../shared/errors/normalizeError.js';

/**
 * Global error-handling middleware (must keep 4 args to be recognized by Express).
 * 1) Normalizes unknown runtime errors into typed AppError objects.
 * 2) Logs structured error events.
 * 3) Returns a consistent API error response contract.
 */
// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  const normalized = normalizeError(err);

  logger.error('Unhandled application error', {
    requestId: req.requestId,
    code: normalized.code,
    status: normalized.statusCode,
    message: normalized.message,
    details: normalized.details,
    stack: normalized.stack,
    isOperational: normalized.isOperational,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.status(normalized.statusCode).json({
    success: false,
    error: {
      code: normalized.code,
      message: normalized.message,
      details: normalized.details,
    },
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV !== 'production' && { stack: normalized.stack }),
  });
}
