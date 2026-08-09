import crypto from 'node:crypto';

/**
 * Cryptographic helpers for opaque tokens (refresh tokens, email verification
 * tokens, password reset tokens).
 *
 * Strategy: we generate a high-entropy random string and hand it to the client,
 * but only ever persist its SHA-256 hash. A leaked database therefore cannot be
 * used to reconstruct valid tokens, and lookups remain O(1) via the unique
 * `tokenHash` index.
 */

/**
 * Generate a URL-safe, high-entropy random token.
 * @param {number} [bytes=48] number of random bytes (48 → 64-char base64url)
 * @returns {string}
 */
export function generateOpaqueToken(bytes = 48) {
  return crypto.randomBytes(bytes).toString('base64url');
}

/**
 * Deterministically hash a token for storage/lookup.
 * @param {string} token
 * @returns {string} hex-encoded SHA-256 digest
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Constant-time comparison of two hex hashes to avoid timing attacks.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function safeCompareHash(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
