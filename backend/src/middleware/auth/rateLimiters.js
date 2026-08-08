import rateLimit from 'express-rate-limit';
import RateLimitError from '../../shared/errors/RateLimitError.js';
import { getClientIp } from '../../shared/utils/requestContext.js';

/**
 * IP-based rate limiters for sensitive auth endpoints. These are a coarse first
 * line of defense (network layer); AuthService additionally enforces per-account
 * throttling and lockout (business layer).
 */

function build({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => getClientIp(req),
    handler: () => {
      throw new RateLimitError(message);
    },
  });
}

// 10 login attempts / 5 minutes / IP.
export const loginLimiter = build({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts from this device. Please slow down and try again shortly.',
});

// 5 registrations / hour / IP.
export const registerLimiter = build({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many accounts created from this device. Please try again later.',
});

// 5 password-reset or verification requests / 15 minutes / IP.
export const passwordResetLimiter = build({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many requests. Please wait a few minutes before trying again.',
});

export default { loginLimiter, registerLimiter, passwordResetLimiter };
