import type { ErrorRequestHandler, RequestHandler } from 'express';
import { randomUUID } from 'node:crypto';
import { isAppError } from './errors.js';
import { logger } from './logger.js';

export const requestId: RequestHandler = (request, response, next) => {
  const id = request.header('x-request-id') ?? randomUUID();
  response.setHeader('x-request-id', id);
  response.locals.requestId = id;
  next();
};

export const requestLogger: RequestHandler = (request, response, next) => {
  const started = Date.now();
  response.on('finish', () => {
    logger.info('request completed', {
      requestId: response.locals.requestId,
      method: request.method,
      path: request.originalUrl,
      status: response.statusCode,
      durationMs: Date.now() - started,
    });
  });
  next();
};

export const notFound: RequestHandler = (request, response) => {
  response.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${request.method} ${request.originalUrl}`,
    },
    requestId: response.locals.requestId,
  });
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  void next;
  const appError = isAppError(error) ? error : undefined;
  const statusCode = appError?.statusCode ?? 500;
  response.status(statusCode).json({
    success: false,
    error: {
      code: appError?.code ?? 'INTERNAL_ERROR',
      message: appError?.message ?? 'Internal server error',
      details: appError?.details,
    },
    requestId: response.locals.requestId,
  });
};
