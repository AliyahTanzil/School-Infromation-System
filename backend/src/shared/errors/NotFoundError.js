import AppError from './AppError.js';

export default class NotFoundError extends AppError {
  /**
   * @param {string} message
   * @param {unknown} [details]
   */
  constructor(message = 'Resource not found', details = null) {
    super(message, {
      statusCode: 404,
      code: 'NOT_FOUND',
      details,
      isOperational: true,
    });
  }
}
