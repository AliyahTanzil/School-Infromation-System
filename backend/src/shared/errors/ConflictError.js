import AppError from './AppError.js';

/**
 * 409 Conflict — the request conflicts with the current state of the resource,
 * e.g. registering an email that already exists.
 */
export default class ConflictError extends AppError {
  /**
   * @param {string} message
   * @param {unknown} [details]
   */
  constructor(message = 'Resource conflict', details = null) {
    super(message, {
      statusCode: 409,
      code: 'CONFLICT',
      details,
      isOperational: true,
    });
  }
}
