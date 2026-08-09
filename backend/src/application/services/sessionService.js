import config from '../../config/index.js';
import * as tokenService from '../../infrastructure/auth/tokenService.js';
import auditLoginRepository from '../../infrastructure/repositories/auditLoginRepository.js';
import refreshTokenRepository from '../../infrastructure/repositories/refreshTokenRepository.js';
import sessionRepository from '../../infrastructure/repositories/sessionRepository.js';
import trustedDeviceRepository from '../../infrastructure/repositories/trustedDeviceRepository.js';
import userRepository from '../../infrastructure/repositories/userRepository.js';
import AuthenticationError from '../../shared/errors/AuthenticationError.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';

/**
 * SessionService
 *
 * Owns the lifecycle of login sessions and their refresh-token chains:
 *  • issueSession  — create a session + first refresh token + access token
 *  • rotate        — validate/rotate a refresh token (with reuse detection)
 *  • revoke / revokeAll — logout single device / all devices
 *  • list          — active devices for the account page
 */

function refreshExpiry() {
  return new Date(Date.now() + config.auth.refreshTokenTtlDays * 24 * 60 * 60 * 1000);
}

/**
 * Create a brand-new session for a user and mint the first token pair.
 * @param {{ user: any, context: { ipAddress: string, userAgent: string, deviceType: string, deviceFingerprint: string }, deviceName?: string }} params
 */
export async function issueSession({ user, context, deviceName }) {
  const session = await sessionRepository.create({
    userId: user.id,
    deviceName: deviceName ?? null,
    deviceType: context.deviceType,
    deviceHash: context.deviceFingerprint,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    expiresAt: refreshExpiry(),
  });

  const roles = await userRepository.findActiveRoleCodes(user.id);
  const { token: refreshToken, tokenHash, expiresAt } = tokenService.generateRefreshToken();

  await refreshTokenRepository.create({
    tokenHash,
    userId: user.id,
    sessionId: session.id,
    parentTokenId: null,
    expiresAt,
  });

  await trustedDeviceRepository.upsert({
    userId: user.id,
    fingerprint: context.deviceFingerprint,
    name: deviceName ?? context.deviceType,
    userAgent: context.userAgent,
    lastIp: context.ipAddress,
  });

  const accessToken = tokenService.signAccessToken({
    sub: user.id,
    email: user.email,
    sessionId: session.id,
    roles,
  });

  return { accessToken, refreshToken, session, roles };
}

/**
 * Validate and rotate a refresh token. Implements refresh-token reuse
 * detection: if a token that has already been rotated/revoked is presented, we
 * treat it as a compromise and nuke the entire session.
 * @param {{ refreshToken: string, context: object }} params
 */
export async function rotate({ refreshToken, context }) {
  if (!refreshToken) {
    throw new AuthenticationError('Refresh token is required');
  }

  const tokenHash = tokenService.hashRefreshToken(refreshToken);
  const stored = await refreshTokenRepository.findByHash(tokenHash);

  if (!stored) {
    throw new AuthenticationError('Invalid refresh token');
  }

  // Reuse detection: a revoked token presented again ⇒ possible theft.
  if (stored.revokedAt) {
    await refreshTokenRepository.revokeAllForSession(stored.sessionId, 'reuse_detected');
    await sessionRepository.revoke(stored.sessionId, 'reuse_detected');
    await auditLoginRepository.record({
      userId: stored.userId,
      sessionId: stored.sessionId,
      event: 'SESSION_REVOKED',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { reason: 'refresh_token_reuse_detected' },
    });
    throw new AuthenticationError('Refresh token has already been used');
  }

  if (stored.expiresAt.getTime() <= Date.now()) {
    throw new AuthenticationError('Refresh token has expired');
  }

  const session = await sessionRepository.findActiveById(stored.sessionId);
  if (!session) {
    throw new AuthenticationError('Session is no longer active');
  }

  const user = await userRepository.findById(stored.userId);
  if (!user || user.status === 'SUSPENDED') {
    throw new AuthenticationError('Account is not able to authenticate');
  }

  // Rotate: revoke the presented token and mint its successor.
  await refreshTokenRepository.revokeById(stored.id, 'rotated');
  const {
    token: newRefreshToken,
    tokenHash: newHash,
    expiresAt,
  } = tokenService.generateRefreshToken();
  await refreshTokenRepository.create({
    tokenHash: newHash,
    userId: user.id,
    sessionId: session.id,
    parentTokenId: stored.id,
    expiresAt,
  });

  await sessionRepository.touch(session.id, {
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  const roles = await userRepository.findActiveRoleCodes(user.id);
  const accessToken = tokenService.signAccessToken({
    sub: user.id,
    email: user.email,
    sessionId: session.id,
    roles,
  });

  await auditLoginRepository.record({
    userId: user.id,
    sessionId: session.id,
    event: 'TOKEN_REFRESHED',
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return { accessToken, refreshToken: newRefreshToken, user, session, roles };
}

/**
 * Revoke a single session (logout current device).
 */
export async function revoke({ sessionId, userId, reason, context }) {
  const session = await sessionRepository.findActiveById(sessionId);
  if (!session || session.userId !== userId) {
    throw new NotFoundError('Session not found');
  }
  await refreshTokenRepository.revokeAllForSession(sessionId, reason ?? 'user_logout');
  await sessionRepository.revoke(sessionId, reason ?? 'user_logout');
  await auditLoginRepository.record({
    userId,
    sessionId,
    event: 'LOGGED_OUT',
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
  });
}

/**
 * Revoke every session for a user (logout everywhere).
 */
export async function revokeAll({ userId, reason, context }) {
  await refreshTokenRepository.revokeAllForUser(userId, reason ?? 'logout_all');
  await sessionRepository.revokeAllForUser(userId, reason ?? 'logout_all');
  await auditLoginRepository.record({
    userId,
    event: 'LOGGED_OUT_ALL',
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
  });
}

/**
 * List active sessions for the account, flagging the caller's current one.
 */
export async function list({ userId, currentSessionId }) {
  const sessions = await sessionRepository.listActiveByUser(userId);
  return sessions.map((s) => ({
    id: s.id,
    deviceName: s.deviceName,
    deviceType: s.deviceType,
    ipAddress: s.ipAddress,
    userAgent: s.userAgent,
    lastActiveAt: s.lastActiveAt,
    createdAt: s.createdAt,
    expiresAt: s.expiresAt,
    current: s.id === currentSessionId,
  }));
}

export default { issueSession, rotate, revoke, revokeAll, list };
