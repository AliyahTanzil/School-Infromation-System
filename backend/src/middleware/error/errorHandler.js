import logger from '../../infrastructure/logger/index.js';

/**
 * Global error-handling middleware (must be 4-argument to be detected by Express).
 * Maps any thrown error to a structured JSON response.
 */
// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  const status = err.statusCode ?? err.status ?? 500;
  const message = err.message ?? 'Internal Server Error';

  logger.error({ status, message, stack: err.stack, path: req.path, method: req.method });

  res.status(status).json({
    success: false,
    status,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
