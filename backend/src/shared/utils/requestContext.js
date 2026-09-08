import crypto from 'node:crypto';
import { isIP } from 'node:net';

/**
 * Extracts a normalized client context (IP, user-agent, device fingerprint)
 * from an Express request. Used for audit logging, session records, device
 * tracking, and rate-limit keys.
 */

/**
 * Best-effort client IP resolution. Express computes `req.ip` using the
 * application's configured `trust proxy` policy, so this helper must not read
 * `x-forwarded-for` directly or an untrusted client could spoof throttle and
 * audit identities.
 * @param {import('express').Request} req
 * @returns {string}
 */
export function getClientIp(req) {
  return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
}

function expandIpv6(ip) {
  let normalized = ip.toLowerCase().split('%')[0];
  const ipv4Match = normalized.match(/(?:^|:)(\d+\.\d+\.\d+\.\d+)$/);
  if (ipv4Match) {
    const octets = ipv4Match[1].split('.').map(Number);
    const tail = `${((octets[0] << 8) | octets[1]).toString(16)}:${((octets[2] << 8) | octets[3]).toString(16)}`;
    normalized = normalized.slice(0, -ipv4Match[1].length) + tail;
  }
  const [left = '', right = ''] = normalized.split('::');
  const leftParts = left ? left.split(':') : [];
  const rightParts = right ? right.split(':') : [];
  const missing = Math.max(0, 8 - leftParts.length - rightParts.length);
  return [...leftParts, ...Array(missing).fill('0'), ...rightParts].map((part) =>
    part.padStart(4, '0')
  );
}

export function getThrottleIp(ip) {
  const value = String(ip ?? '').trim();
  const mappedIpv4 = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mappedIpv4 && isIP(mappedIpv4[1]) === 4) return mappedIpv4[1];
  if (isIP(value) !== 6) return value || 'unknown';
  return `${expandIpv6(value).slice(0, 4).join(':')}::/64`;
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
    throttleIpAddress: getThrottleIp(getClientIp(req)),
    userAgent,
    deviceType: getDeviceType(userAgent),
    deviceFingerprint: getDeviceFingerprint(req),
  };
}
