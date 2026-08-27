import AppError from './AppError.js';

export default class AuthorizationError extends AppError {
  /**
   * @param {string} message
   * @param {string} [code]
   * @param {unknown} [details]
   */
  constructor(
    message = 'You are not authorized to perform this action',
    code = 'AUTHORIZATION_ERROR',
    details = null
  ) {
    super(message, {
      statusCode: 403,
      code,
      details,
      isOperational: true,
    });
  }
}
