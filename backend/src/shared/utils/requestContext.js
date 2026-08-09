import crypto from 'node:crypto';

/**
 * Extracts a normalized client context (IP, user-agent, device fingerprint)
 * from an Express request. Used for audit logging, session records, device
 * tracking, and rate-limit keys.
 */

/**
 * Best-effort client IP resolution, honoring the first entry of
 * `x-forwarded-for` when running behind a proxy/load balancer.
 * @param {import('express').Request} req
 * @returns {string}
 */
export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
}

/**
 * @param {import('express').Request} req
 * @returns {string}
 */
export function getUserAgent(req) {
  return req.get('user-agent') ?? 'unknown';
}

/**
 * A coarse device type derived from the user-agent string. Full device
 * intelligence is out of scope; this is enough to label sessions for users.
 * @param {string} userAgent
 * @returns {string}
 */
export function getDeviceType(userAgent = '') {
  const ua = userAgent.toLowerCase();
  if (/mobile|iphone|android(?!.*tablet)/.test(ua)) return 'mobile';
  if (/ipad|tablet/.test(ua)) return 'tablet';
  if (/curl|wget|node|axios|postman|insomnia/.test(ua)) return 'api-client';
  if (ua === '' || ua === 'unknown') return 'unknown';
  return 'desktop';
}

/**
 * Stable per-device fingerprint. We intentionally combine only IP + UA — it is
 * a heuristic used to recognize "the same browser", never a security control.
 * @param {import('express').Request} req
 * @returns {string} hex-encoded SHA-256 digest
 */
export function getDeviceFingerprint(req) {
  const raw = `${getClientIp(req)}::${getUserAgent(req)}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/**
 * Bundles all client context in one call.
 * @param {import('express').Request} req
 */
export function getRequestContext(req) {
  const userAgent = getUserAgent(req);
  return {
    ipAddress: getClientIp(req),
    userAgent,
    deviceType: getDeviceType(userAgent),
    deviceFingerprint: getDeviceFingerprint(req),
  };
}
