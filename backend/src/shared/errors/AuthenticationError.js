import AppError from './AppError.js';

export default class AuthenticationError extends AppError {
  /**
   * @param {string} message
   * @param {unknown} [details]
   */
  constructor(message = 'Authentication failed', details = null) {
    super(message, {
      statusCode: 401,
      code: 'AUTHENTICATION_ERROR',
      details,
      isOperational: true,
    });
  }
}
