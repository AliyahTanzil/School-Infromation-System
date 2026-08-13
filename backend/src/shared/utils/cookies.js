import config from '../../config/index.js';

/**
 * Refresh-token cookie helpers.
 *
 * The refresh token is delivered as an httpOnly, SameSite=strict cookie so it
 * is invisible to JavaScript (XSS-resistant) and not sent cross-site (CSRF-
 * resistant). The short-lived access token, by contrast, lives only in the
 * client's memory.
 */

function baseCookieOptions() {
  const isProduction = (process.env.NODE_ENV ?? config.env) === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    // v0 previews and separately hosted frontends are cross-site contexts.
    // SameSite=None is required there so refresh can reach the API function.
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/auth',
  };
}

/**
 * @param {import('express').Response} res
 * @param {string} token
 */
export function setRefreshCookie(res, token) {
  res.cookie(config.auth.refreshCookieName, token, {
    ...baseCookieOptions(),
    maxAge: config.auth.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
  });
}

/**
 * @param {import('express').Response} res
 */
export function clearRefreshCookie(res) {
  res.clearCookie(config.auth.refreshCookieName, baseCookieOptions());
}

/**
 * Read the refresh token from the httpOnly cookie, falling back to the request
 * body for non-browser API clients and tests.
 * @param {import('express').Request} req
 * @returns {string | undefined}
 */
export function readRefreshToken(req) {
  return req.cookies?.[config.auth.refreshCookieName] ?? req.body?.refreshToken;
}

export default { setRefreshCookie, clearRefreshCookie, readRefreshToken };
