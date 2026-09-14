import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import AppError from './AppError.js';
import AuthenticationError from './AuthenticationError.js';
import DatabaseError from './DatabaseError.js';
import NotFoundError from './NotFoundError.js';
import ValidationError from './ValidationError.js';

const bodyParserErrors = new Map([
  ['entity.parse.failed', [400, 'INVALID_REQUEST_BODY', 'Request body is malformed.']],
  ['entity.too.large', [413, 'PAYLOAD_TOO_LARGE', 'Request body exceeds the allowed size.']],
  [
    'charset.unsupported',
    [415, 'UNSUPPORTED_MEDIA_TYPE', 'Request character encoding is unsupported.'],
  ],
  [
    'encoding.unsupported',
    [415, 'UNSUPPORTED_MEDIA_TYPE', 'Request content encoding is unsupported.'],
  ],
]);

/**
 * Convert unknown errors into known AppError subclasses.
 * @param {unknown} error
 * @returns {AppError}
 */
export default function normalizeError(error) {
  if (error instanceof AppError) {
    return error;
  }

  // Only map recognized parser failures; never copy their body, message or metadata.
  if (error instanceof Error) {
    const parserError = bodyParserErrors.get(error.type);
    if (parserError && error.status === parserError[0]) {
      const [statusCode, code, message] = parserError;
      return new AppError(message, { statusCode, code, details: null });
    }
  }

  if (error instanceof ZodError) {
    return new ValidationError(
      'Request validation failed',
      error.issues.map((issue) => ({
        path: issue.path.join('.'),
        code: issue.code,
        message: issue.message,
      }))
    );
  }

  // JWT errors thrown by jsonwebtoken.
  if (error instanceof Error) {
    if (error.name === 'TokenExpiredError') {
      return new AuthenticationError('Access token has expired');
    }

    if (error.name === 'JsonWebTokenError' || error.name === 'NotBeforeError') {
      return new AuthenticationError('Invalid access token');
    }
  }

  // Prisma known request errors.
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return new DatabaseError('A record with these details already exists', {
        statusCode: 409,
        code: 'DB_UNIQUE_CONSTRAINT',
        details: null,
      });
    }

    if (error.code === 'P2025') {
      return new NotFoundError('Requested record was not found');
    }

    if (error.code === 'P2028') {
      return new DatabaseError(
        'The service is temporarily unavailable. Please try again shortly.',
        {
          statusCode: 503,
          code: 'DB_P2028',
          details: null,
        }
      );
    }

    return new DatabaseError('The request could not be completed. Please try again.', {
      statusCode: 500,
      code: `DB_${error.code}`,
      details: null,
    });
  }

  // Prisma validation / initialization errors.
  if (
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return new DatabaseError('The service is temporarily unavailable. Please try again shortly.', {
      statusCode: 503,
      code: 'DATABASE_UNAVAILABLE',
      details: null,
    });
  }

  const rawMessage = error instanceof Error ? error.message : 'Internal server error';

  if (/PostgreSQL connection|connection.*closed|kind: Closed/i.test(rawMessage)) {
    return new DatabaseError('Database is temporarily unavailable', {
      statusCode: 503,
      code: 'DATABASE_UNAVAILABLE',
    });
  }

  // Never surface an unexpected internal message to clients in production; it can
  // carry infrastructure detail. Development keeps it for diagnostics.
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again.'
      : rawMessage;

  return new AppError(message, {
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    details: null,
    isOperational: false,
  });
}
