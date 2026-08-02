import AppError from './AppError.js';

export default class DatabaseError extends AppError {
  /**
   * @param {string} message
   * @param {{statusCode?: number, code?: string, details?: unknown}} [options]
   */
  constructor(message = 'Database operation failed', options = {}) {
    super(message, {
      statusCode: options.statusCode ?? 500,
      code: options.code ?? 'DATABASE_ERROR',
      details: options.details ?? null,
      isOperational: true,
    });
  }
}
