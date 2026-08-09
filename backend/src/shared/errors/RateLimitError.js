import AppError from './AppError.js';

/**
 * 429 Too Many Requests — the client has sent too many requests in a given
 * window (login throttling, brute-force protection, etc.).
 */
export default class RateLimitError extends AppError {
  /**
   * @param {string} message
   * @param {unknown} [details]
   */
  constructor(message = 'Too many requests', details = null) {
    super(message, {
      statusCode: 429,
      code: 'RATE_LIMITED',
      details,
      isOperational: true,
    });
  }
}
