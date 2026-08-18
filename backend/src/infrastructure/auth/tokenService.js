import jwt from 'jsonwebtoken';
import config from '../../config/index.js';
import AuthenticationError from '../../shared/errors/AuthenticationError.js';
import { generateOpaqueToken, hashToken } from '../../shared/utils/tokenUtils.js';

/**
 * TokenService
 *
 * Two-token strategy:
 *  • Access token  — a short-lived signed JWT carrying identity + claims. Sent
 *    on every request in the Authorization header. Never stored server-side.
 *  • Refresh token — a long-lived, high-entropy opaque string. Only its hash is
 *    persisted (see RefreshTokenRepository). Rotated on every use.
 */

/**
 * Sign a short-lived access token.
 * @param {{ sub: string, email: string, sessionId: string, roles?: string[] }} claims
 * @returns {string} signed JWT
 */
export function signAccessToken({ sub, email, sessionId, roles = [] }) {
  return jwt.sign(
    { tokenType: 'access', email, sessionId, sid: sessionId, roles },
    config.auth.accessTokenSecret,
    {
      subject: sub,
      expiresIn: config.auth.accessTokenTtl,
      issuer: config.auth.issuer,
      audience: config.auth.audience,
    }
  );
}

/**
 * Verify and decode an access token.
 * Throws AuthenticationError (via normalizeError-friendly JWT error names) on
 * expiry or tampering.
 * @param {string} token
 * @returns {{ sub: string, email: string, sessionId: string, roles: string[] }}
 */
export function verifyAccessToken(token) {
  if (!token) {
    throw new AuthenticationError('Access token is required');
  }
  const payload = jwt.verify(token, config.auth.accessTokenSecret, {
    issuer: config.auth.issuer,
    audience: config.auth.audience,
  });
  if (
    payload.tokenType !== 'access' ||
    typeof payload.sub !== 'string' ||
    typeof payload.sid !== 'string'
  ) {
    throw new AuthenticationError('Invalid access token');
  }
  return {
    sub: payload.sub,
    email: payload.email,
    sessionId: payload.sessionId ?? payload.sid,
    sid: payload.sid ?? payload.sessionId,
    roles: payload.roles ?? [],
  };
}

/**
 * Create a new opaque refresh token plus its storable hash and expiry.
 * @returns {{ token: string, tokenHash: string, expiresAt: Date }}
 */
export function generateRefreshToken() {
  const token = generateOpaqueToken(48);
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + config.auth.refreshTokenTtlDays * 24 * 60 * 60 * 1000);
  return { token, tokenHash, expiresAt };
}

/**
 * Hash a client-supplied refresh token for repository lookup.
 * @param {string} token
 * @returns {string}
 */
export function hashRefreshToken(token) {
  return hashToken(token);
}

export default {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
};
