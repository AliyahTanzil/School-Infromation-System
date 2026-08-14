import config from '../../config/index.js';
import emailService from '../../infrastructure/email/emailService.js';
import passwordService from '../../infrastructure/hash/passwordService.js';
import auditLoginRepository from '../../infrastructure/repositories/auditLoginRepository.js';
import emailVerificationTokenRepository from '../../infrastructure/repositories/emailVerificationTokenRepository.js';
import loginAttemptRepository from '../../infrastructure/repositories/loginAttemptRepository.js';
import passwordResetTokenRepository from '../../infrastructure/repositories/passwordResetTokenRepository.js';
import refreshTokenRepository from '../../infrastructure/repositories/refreshTokenRepository.js';
import sessionRepository from '../../infrastructure/repositories/sessionRepository.js';
import userRepository from '../../infrastructure/repositories/userRepository.js';
import AuthenticationError from '../../shared/errors/AuthenticationError.js';
import ConflictError from '../../shared/errors/ConflictError.js';
import RateLimitError from '../../shared/errors/RateLimitError.js';
import logger from '../../infrastructure/logger/index.js';
import { generateOpaqueToken, hashToken } from '../../shared/utils/tokenUtils.js';
import { toPublicUser } from '../dtos/userDto.js';
import sessionService from './sessionService.js';
import activationService from './activationService.js';
import prisma from '../../infrastructure/orm/prismaClient.js';

/**
 * AuthService
 *
 * Application-layer orchestrator for the full authentication lifecycle. It
 * composes the infrastructure services (password, token, email) and
 * repositories, keeping all business rules — throttling, lockout, single-use
 * tokens, audit trails — in one cohesive place.
 */

const GENERIC_LOGIN_ERROR = 'Invalid email or password';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function lockoutWindowStart() {
  return new Date(Date.now() - config.auth.lockoutMinutes * 60 * 1000);
}

async function issueSingleUseToken(repository, { userId, context, ttlMs }) {
  const token = generateOpaqueToken(48);
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ttlMs);
  await repository.invalidateAllForUser(userId);
  await repository.create({
    tokenHash,
    userId,
    expiresAt,
    requestedIp: context?.ipAddress,
    userAgent: context?.userAgent,
  });
  return token;
}

// ─── Registration ────────────────────────────────────────────────────────────

/**
 * Register a new account, send a verification email, and immediately issue a
 * session so the user is logged in (status stays PENDING_VERIFICATION until the
 * email is confirmed).
 */
export async function register({
  email,
  password,
  deviceName,
  accountType = 'TENANT_ADMIN',
  firstName,
  lastName,
  designation,
  context,
}) {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new ConflictError('An account with this email already exists');
  }

  const passwordHash = await passwordService.hashPassword(password);
  const user = await userRepository.create({
    email,
    passwordHash,
    status: 'PENDING_VERIFICATION',
    accountType,
  });

  const verificationToken = await issueSingleUseToken(emailVerificationTokenRepository, {
    userId: user.id,
    context,
    ttlMs: config.auth.emailVerificationTtlHours * 60 * 60 * 1000,
  });

  try {
    await emailService.sendVerificationEmail({ to: user.email, token: verificationToken });
  } catch (err) {
    logger.error('Failed to send verification email', { error: err.message, userId: user.id });
  }

  await auditLoginRepository.record({
    userId: user.id,
    event: 'REGISTERED',
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
  });

  if (accountType === 'TENANT_ADMIN') {
    const owner = await prisma.user.findFirst({
      where: { accountType: 'APPLICATION_MANAGER', status: 'ACTIVE', deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    if (!owner) {
      throw new ConflictError('No active application owner is available to approve this account');
    }
    const approval = await activationService.createRequest({
      userId: user.id,
      ownerUserId: owner.id,
      email,
      firstName,
      lastName,
      designation,
    });
    return {
      user: toPublicUser(user, { roles: [] }),
      activationPending: true,
      ownerEmail: approval.ownerEmail,
      expiresAt: approval.expiresAt,
    };
  }

  const { accessToken, refreshToken, session, roles } = await sessionService.issueSession({
    user,
    context,
    deviceName,
  });

  return {
    user: toPublicUser(user, { roles }),
    accessToken,
    refreshToken,
    sessionId: session.id,
  };
}

// ─── Login ─────────────────────────────────────────────────────────────────

export async function login({ email, password, deviceName, context }) {
  // Throttle by recent failures for this email within the lockout window.
  const recentFailures = await loginAttemptRepository.countRecentFailuresByEmail(
    email,
    lockoutWindowStart()
  );
  if (recentFailures >= config.auth.maxFailedLogins) {
    throw new RateLimitError(
      `Too many failed attempts. Try again in ${config.auth.lockoutMinutes} minutes.`
    );
  }

  const user = await userRepository.findByEmail(email);

  const recordFailure = async (reason, userId = null) => {
    await loginAttemptRepository.record({
      userId,
      email,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      succeeded: false,
      failureReason: reason,
    });
  };

  if (!user) {
    await recordFailure('user_not_found');
    throw new AuthenticationError(GENERIC_LOGIN_ERROR);
  }

  if (user.status === 'SUSPENDED') {
    await recordFailure('account_suspended', user.id);
    throw new AuthenticationError('This account has been suspended');
  }
  if (user.status !== 'ACTIVE') {
    await recordFailure('account_pending_activation', user.id);
    throw new AuthenticationError('This account is awaiting activation by the application owner');
  }

  // Honor an active lockout; auto-clear it once the window elapses.
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    await recordFailure('account_locked', user.id);
    throw new AuthenticationError('Account is temporarily locked. Please try again later.');
  }
  if (user.status === 'LOCKED' && (!user.lockedUntil || user.lockedUntil.getTime() <= Date.now())) {
    await userRepository.unlock(user.id);
  }

  const passwordOk = await passwordService.verifyPassword(password, user.passwordHash);
  if (!passwordOk) {
    const nextCount = user.failedLoginCount + 1;
    const shouldLock = nextCount >= config.auth.maxFailedLogins;
    await userRepository.incrementFailedLogins(user.id, {
      lockUntil: shouldLock ? new Date(Date.now() + config.auth.lockoutMinutes * 60 * 1000) : null,
    });
    await recordFailure('invalid_password', user.id);
    await auditLoginRepository.record({
      userId: user.id,
      event: shouldLock ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    throw new AuthenticationError(GENERIC_LOGIN_ERROR);
  }

  // Success.
  await userRepository.recordSuccessfulLogin(user.id);
  await loginAttemptRepository.record({
    userId: user.id,
    email,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    succeeded: true,
  });

  const { accessToken, refreshToken, session, roles } = await sessionService.issueSession({
    user,
    context,
    deviceName,
  });

  await auditLoginRepository.record({
    userId: user.id,
    sessionId: session.id,
    event: 'LOGIN_SUCCEEDED',
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return {
    user: toPublicUser(user, { roles }),
    accessToken,
    refreshToken,
    sessionId: session.id,
  };
}

// ─── Token refresh / logout ──────────────────────────────────────────────────

export async function refresh({ refreshToken, context }) {
  const result = await sessionService.rotate({ refreshToken, context });
  return {
    user: toPublicUser(result.user, { roles: result.roles }),
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    sessionId: result.session.id,
  };
}

export async function logout({ userId, sessionId, context }) {
  await sessionService.revoke({ sessionId, userId, reason: 'user_logout', context });
}

export async function logoutAll({ userId, context }) {
  await sessionService.revokeAll({ userId, reason: 'logout_all', context });
}

// ─── Password recovery ───────────────────────────────────────────────────────

/**
 * Always resolves successfully regardless of whether the email exists, to
 * prevent account-enumeration.
 */
export async function forgotPassword({ email, context }) {
  const user = await userRepository.findByEmail(email);
  if (!user) return;

  const token = await issueSingleUseToken(passwordResetTokenRepository, {
    userId: user.id,
    context,
    ttlMs: config.auth.passwordResetTtlMinutes * 60 * 1000,
  });

  try {
    await emailService.sendPasswordResetEmail({ to: user.email, token });
  } catch (err) {
    logger.error('Failed to send password reset email', { error: err.message, userId: user.id });
  }

  await auditLoginRepository.record({
    userId: user.id,
    event: 'PASSWORD_RESET_REQUESTED',
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
  });
}

export async function resetPassword({ token, password, context }) {
  const tokenHash = hashToken(token);
  const record = await passwordResetTokenRepository.findByHash(tokenHash);

  if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
    throw new AuthenticationError('This password reset link is invalid or has expired');
  }

  const passwordHash = await passwordService.hashPassword(password);
  await userRepository.setPasswordHash(record.userId, passwordHash);
  await passwordResetTokenRepository.markUsed(record.id);

  // Force re-authentication everywhere after a reset.
  await refreshTokenRepository.revokeAllForUser(record.userId, 'password_reset');
  await sessionRepository.revokeAllForUser(record.userId, 'password_reset');

  await auditLoginRepository.record({
    userId: record.userId,
    event: 'PASSWORD_RESET_COMPLETED',
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
  });
}

export async function changePassword({ userId, sessionId, currentPassword, newPassword, context }) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AuthenticationError('Account not found');
  }

  const ok = await passwordService.verifyPassword(currentPassword, user.passwordHash);
  if (!ok) {
    throw new AuthenticationError('Current password is incorrect');
  }

  const passwordHash = await passwordService.hashPassword(newPassword);
  await userRepository.setPasswordHash(userId, passwordHash);

  // Keep the current device signed in; revoke every other session.
  await refreshTokenRepository.revokeAllForUserExcept(userId, sessionId, 'password_changed');
  await sessionRepository.revokeAllForUserExcept(userId, sessionId, 'password_changed');

  await auditLoginRepository.record({
    userId,
    sessionId,
    event: 'PASSWORD_RESET_COMPLETED',
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
    metadata: { via: 'change_password' },
  });
}

// ─── Email verification ──────────────────────────────────────────────────────

export async function verifyEmail({ token, context }) {
  const tokenHash = hashToken(token);
  const record = await emailVerificationTokenRepository.findByHash(tokenHash);

  if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
    throw new AuthenticationError('This verification link is invalid or has expired');
  }

  const user = await userRepository.markEmailVerified(record.userId);
  await emailVerificationTokenRepository.markUsed(record.id);

  await auditLoginRepository.record({
    userId: record.userId,
    event: 'EMAIL_VERIFIED',
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
  });

  const roles = await userRepository.findActiveRoleCodes(user.id);
  return { user: toPublicUser(user, { roles }) };
}

/**
 * Re-issues a verification email. Enumeration-safe: always resolves.
 */
export async function resendVerification({ email, context }) {
  const user = await userRepository.findByEmail(email);
  if (!user || user.emailVerifiedAt) return;

  const token = await issueSingleUseToken(emailVerificationTokenRepository, {
    userId: user.id,
    context,
    ttlMs: config.auth.emailVerificationTtlHours * 60 * 60 * 1000,
  });

  try {
    await emailService.sendVerificationEmail({ to: user.email, token });
  } catch (err) {
    logger.error('Failed to resend verification email', { error: err.message, userId: user.id });
  }
}

// ─── Current user ────────────────────────────────────────────────────────────

export async function getCurrentUser({ userId }) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AuthenticationError('Account not found');
  }
  const roles = await userRepository.findActiveRoleCodes(userId);
  return { user: toPublicUser(user, { roles }) };
}

export default {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  resendVerification,
  getCurrentUser,
};
