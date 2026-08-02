import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import AppError from './AppError.js';
import AuthenticationError from './AuthenticationError.js';
import DatabaseError from './DatabaseError.js';
import NotFoundError from './NotFoundError.js';
import ValidationError from './ValidationError.js';

/**
 * Convert unknown errors into known AppError subclasses.
 * @param {unknown} error
 * @returns {AppError}
 */
export default function normalizeError(error) {
  if (error instanceof AppError) {
    return error;
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
      return new DatabaseError('Duplicate value violates unique constraint', {
        statusCode: 409,
        code: 'DB_UNIQUE_CONSTRAINT',
        details: { target: error.meta?.target },
      });
    }

    if (error.code === 'P2025') {
      return new NotFoundError('Requested record was not found');
    }

    return new DatabaseError('Known database request error', {
      statusCode: 500,
      code: `DB_${error.code}`,
      details: { meta: error.meta },
    });
  }

  // Prisma validation / initialization errors.
  if (
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return new DatabaseError('Database client error', {
      statusCode: 500,
      code: 'DB_CLIENT_ERROR',
      details: error instanceof Error ? { message: error.message } : null,
    });
  }

  const message = error instanceof Error ? error.message : 'Internal server error';

  return new AppError(message, {
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    details: null,
    isOperational: false,
  });
}
