import AppError from './AppError.js';

export default class AuthorizationError extends AppError {
  /**
   * @param {string} message
   * @param {unknown} [details]
   */
  constructor(message = 'You are not authorized to perform this action', details = null) {
    super(message, {
      statusCode: 403,
      code: 'AUTHORIZATION_ERROR',
      details,
      isOperational: true,
    });
  }
}
