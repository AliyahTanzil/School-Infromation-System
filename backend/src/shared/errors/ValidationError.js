import AppError from './AppError.js';

export default class ValidationError extends AppError {
  /**
   * @param {string} message
   * @param {unknown} [details]
   */
  constructor(message = 'Validation failed', details = null) {
    super(message, {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      details,
      isOperational: true,
    });
  }
}
