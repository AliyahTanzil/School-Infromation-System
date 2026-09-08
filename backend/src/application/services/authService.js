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
// Keep nonexistent-account authentication on the same expensive bcrypt path as
// real accounts. This value is a bcrypt hash of a non-secret sentinel and must
// never be used as an application credential.
const DUMMY_PASSWORD_HASH = '$2a$12$F04/dVjHoyrDwNb/fmRr2.DHt.iAVmo.mENbzIHoqYzcJGoY6gRvG';

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
  firstName = '',
  lastName = '',
  designation,
  context,
}) {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    // Recover a tenant registration that created the user but failed before
    // creating its owner-activation request (for example, an interrupted deploy).
    if (
      accountType === 'TENANT_ADMIN' &&
      existing.accountType === 'TENANT_ADMIN' &&
      existing.status === 'PENDING_VERIFICATION' &&
      (await passwordService.verifyPassword(password, existing.passwordHash))
    ) {
      const pendingRequest = await prisma.activationRequest.findFirst({
        where: { userId: existing.id, status: 'PENDING' },
      });
      if (!pendingRequest) {
        const owner = await prisma.user.findFirst({
          where: { accountType: 'APPLICATION_MANAGER', status: 'ACTIVE', deletedAt: null },
          orderBy: { createdAt: 'asc' },
        });
        if (!owner) {
          throw new ConflictError(
            'No active application owner is available to approve this account'
          );
        }
        await activationService.createRequest({
          userId: existing.id,
          ownerUserId: owner.id,
          email: existing.email,
          firstName: existing.firstName,
          lastName: existing.lastName,
          designation,
        });
      }
      return {
        user: toPublicUser(existing, { roles: [] }),
        activationPending: true,
      };
    }
    throw new ConflictError('An account with this email already exists');
  }
  if (accountType === 'APPLICATION_MANAGER') {
    const existingOwner = await prisma.user.findFirst({
      where: { accountType: 'APPLICATION_MANAGER', deletedAt: null },
    });
    if (existingOwner) {
      throw new ConflictError('Application owner creation is restricted to the existing owner');
    }
  }

  const passwordHash = await passwordService.hashPassword(password);
  const user = await userRepository.create({
    email,
    passwordHash,
    status: accountType === 'TENANT_ADMIN' ? 'PENDING_VERIFICATION' : 'ACTIVE',
    accountType,
    firstName,
    lastName,
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
  // Persisted limits work across restarts and horizontally scaled instances.
  // The higher IP threshold avoids locking out a shared school network merely
  // because several users mistyped their own passwords.
  const windowStart = lockoutWindowStart();
  const [recentEmailFailures, recentIpFailures] = await Promise.all([
    loginAttemptRepository.countRecentFailuresByEmail(email, windowStart),
    loginAttemptRepository.countRecentFailuresByIp(
      context.throttleIpAddress ?? context.ipAddress,
      windowStart
    ),
  ]);
  if (
    recentEmailFailures >= config.auth.maxFailedLogins ||
    recentIpFailures >= config.auth.maxFailedLoginsPerIp
  ) {
    throw new RateLimitError(
      `Too many failed attempts. Try again in ${config.auth.lockoutMinutes} minutes.`
    );
  }

  const user = await userRepository.findByEmail(email);

  const recordFailure = async (reason, userId = null) => {
    await loginAttemptRepository.record({
      userId,
      email,
      ipAddress: context.throttleIpAddress ?? context.ipAddress,
      userAgent: context.userAgent,
      succeeded: false,
      failureReason: reason,
    });
  };

  const passwordOk = await passwordService.verifyPassword(
    password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH
  );

  if (!user) {
    await recordFailure('user_not_found');
    throw new AuthenticationError(GENERIC_LOGIN_ERROR);
  }

  if (user.status === 'SUSPENDED') {
    await recordFailure('account_suspended', user.id);
    throw new AuthenticationError(GENERIC_LOGIN_ERROR);
  }

  // Honor an active lockout; auto-clear it once the window elapses.
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    await recordFailure('account_locked', user.id);
    throw new AuthenticationError(GENERIC_LOGIN_ERROR);
  }
  if (user.status === 'LOCKED' && (!user.lockedUntil || user.lockedUntil.getTime() <= Date.now())) {
    await userRepository.unlock(user.id);
  } else if (user.status !== 'ACTIVE') {
    await recordFailure('account_pending_activation', user.id);
    throw new AuthenticationError(GENERIC_LOGIN_ERROR);
  }

  if (!passwordOk) {
    await prisma.$transaction(
      async (tx) => {
        const current = await userRepository.findById(user.id, tx);
        if (!current || current.status !== 'ACTIVE') {
          throw new AuthenticationError(GENERIC_LOGIN_ERROR);
        }
        const shouldLock = current.failedLoginCount + 1 >= config.auth.maxFailedLogins;
        await userRepository.incrementFailedLogins(
          user.id,
          {
            lockUntil: shouldLock
              ? new Date(Date.now() + config.auth.lockoutMinutes * 60 * 1000)
              : null,
          },
          tx
        );
        await loginAttemptRepository.record(
          {
            userId: user.id,
            email,
            ipAddress: context.throttleIpAddress ?? context.ipAddress,
            userAgent: context.userAgent,
            succeeded: false,
            failureReason: 'invalid_password',
          },
          tx
        );
        await auditLoginRepository.record(
          {
            userId: user.id,
            event: shouldLock ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
          },
          tx
        );
      },
      { isolationLevel: 'Serializable' }
    );
    throw new AuthenticationError(GENERIC_LOGIN_ERROR);
  }

  const { accessToken, refreshToken, session, roles } = await sessionService.issueSession({
    user,
    context,
    deviceName,
    onIssued: async ({ tx, session: issuedSession }) => {
      await userRepository.recordSuccessfulLogin(user.id, tx);
      await loginAttemptRepository.record(
        {
          userId: user.id,
          email,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          succeeded: true,
        },
        tx
      );
      await auditLoginRepository.record(
        {
          userId: user.id,
          sessionId: issuedSession.id,
          event: 'LOGIN_SUCCEEDED',
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
        tx
      );
    },
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
  const invalid = () =>
    new AuthenticationError('This password reset link is invalid or has expired');
  if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) throw invalid();

  // Hash before opening the transaction; the conditional write rechecks expiry and use.
  const passwordHash = await passwordService.hashPassword(password);
  await prisma.$transaction(async (tx) => {
    const consumed = await passwordResetTokenRepository.consume(record.id, tx);
    if (consumed.count !== 1) throw invalid();
    await userRepository.setPasswordHash(record.userId, passwordHash, tx);
    await passwordResetTokenRepository.invalidateAllForUser(record.userId, tx);
    await refreshTokenRepository.revokeAllForUser(record.userId, 'password_reset', tx);
    await sessionRepository.revokeAllForUser(record.userId, 'password_reset', tx);
    await auditLoginRepository.record(
      {
        userId: record.userId,
        event: 'PASSWORD_RESET_COMPLETED',
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      },
      tx
    );
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
  await prisma.$transaction(async (tx) => {
    const session = await sessionRepository.findActiveById(sessionId, tx);
    if (!session || session.userId !== userId) {
      throw new AuthenticationError('Session is no longer valid');
    }
    const changed = await userRepository.replacePasswordHash(
      userId,
      user.passwordHash,
      passwordHash,
      tx
    );
    if (changed.count !== 1) {
      throw new AuthenticationError(
        'Account credentials changed or the account is unavailable. Please sign in again.'
      );
    }
    await passwordResetTokenRepository.invalidateAllForUser(userId, tx);
    // Keep the current device signed in; revoke every other session.
    await refreshTokenRepository.revokeAllForUserExcept(userId, sessionId, 'password_changed', tx);
    await sessionRepository.revokeAllForUserExcept(userId, sessionId, 'password_changed', tx);
    await auditLoginRepository.record(
      {
        userId,
        sessionId,
        event: 'PASSWORD_RESET_COMPLETED',
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        metadata: { via: 'change_password' },
      },
      tx
    );
  });
}

// ─── Email verification ──────────────────────────────────────────────────────

export async function verifyEmail({ token, context }) {
  const tokenHash = hashToken(token);
  return prisma.$transaction(async (tx) => {
    const invalid = () =>
      new AuthenticationError('This verification link is invalid or has expired');
    const record = await emailVerificationTokenRepository.findByHash(tokenHash, tx);
    if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) throw invalid();
    const consumed = await emailVerificationTokenRepository.consume(record.id, tx);
    if (consumed.count !== 1) throw invalid();
    // Email ownership is separate from owner approval and account lifecycle.
    const verified = await userRepository.markEmailVerified(record.userId, tx);
    if (verified.count !== 1) throw invalid();
    await emailVerificationTokenRepository.invalidateAllForUser(record.userId, tx);
    await auditLoginRepository.record(
      {
        userId: record.userId,
        event: 'EMAIL_VERIFIED',
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      },
      tx
    );
    const user = await userRepository.findById(record.userId, tx);
    if (!user) throw invalid();
    const roles = await userRepository.findActiveRoleCodes(user.id, tx);
    return { user: toPublicUser(user, { roles }) };
  });
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
