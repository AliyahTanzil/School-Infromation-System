import authService from '../../../application/services/authService.js';
import sessionService from '../../../application/services/sessionService.js';
import { getRequestContext } from '../../../shared/utils/requestContext.js';
import {
  setRefreshCookie,
  clearRefreshCookie,
  readRefreshToken,
} from '../../../shared/utils/cookies.js';

/**
 * Auth HTTP controllers.
 *
 * Thin adapters: translate HTTP ⇄ application services. All business rules live
 * in AuthService / SessionService. Every success response follows the
 * `{ success: true, data }` envelope; errors are handled globally.
 *
 * The refresh token is returned as an httpOnly cookie (never in the JSON body);
 * the access token is returned in the body for the client to hold in memory.
 */

function authPayload(result) {
  return {
    user: result.user,
    accessToken: result.accessToken,
    sessionId: result.sessionId,
  };
}

export async function register(req, res) {
  const context = getRequestContext(req);
  // Public registration is exclusively the approval-based administrator flow.
  // Staff and learner identities must be provisioned by authenticated admins.
  const result = await authService.register({ ...req.body, accountType: 'TENANT_ADMIN', context });
  if (result.activationPending) {
    res.status(202).json({
      success: true,
      data: {
        user: result.user,
        activationPending: true,
        message: 'Your account is awaiting application-owner activation.',
      },
    });
    return;
  }
  setRefreshCookie(res, result.refreshToken);
  res.status(201).json({ success: true, data: authPayload(result) });
}

export async function login(req, res) {
  const context = getRequestContext(req);
  const result = await authService.login({ ...req.body, context });
  setRefreshCookie(res, result.refreshToken);
  res.status(200).json({ success: true, data: authPayload(result) });
}

export async function refresh(req, res) {
  const context = getRequestContext(req);
  const refreshToken = readRefreshToken(req);
  const result = await authService.refresh({ refreshToken, context });
  setRefreshCookie(res, result.refreshToken);
  res.status(200).json({ success: true, data: authPayload(result) });
}

export async function logout(req, res) {
  const context = getRequestContext(req);
  await authService.logout({
    userId: req.user.id,
    sessionId: req.auth.sessionId,
    context,
  });
  clearRefreshCookie(res);
  res.status(200).json({ success: true, data: { message: 'Logged out' } });
}

export async function logoutAll(req, res) {
  const context = getRequestContext(req);
  await authService.logoutAll({ userId: req.user.id, context });
  clearRefreshCookie(res);
  res.status(200).json({ success: true, data: { message: 'Logged out from all devices' } });
}

export async function forgotPassword(req, res) {
  const context = getRequestContext(req);
  await authService.forgotPassword({ email: req.body.email, context });
  // Enumeration-safe: identical response whether or not the email exists.
  res.status(200).json({
    success: true,
    data: { message: 'If an account exists for that email, a reset link has been sent.' },
  });
}

export async function resetPassword(req, res) {
  const context = getRequestContext(req);
  await authService.resetPassword({ ...req.body, context });
  clearRefreshCookie(res);
  res.status(200).json({ success: true, data: { message: 'Password has been reset' } });
}

export async function changePassword(req, res) {
  const context = getRequestContext(req);
  await authService.changePassword({
    userId: req.user.id,
    sessionId: req.auth.sessionId,
    ...req.body,
    context,
  });
  res.status(200).json({ success: true, data: { message: 'Password changed' } });
}

export async function verifyEmail(req, res) {
  const context = getRequestContext(req);
  const result = await authService.verifyEmail({ token: req.body.token, context });
  res.status(200).json({ success: true, data: result });
}

export async function resendVerification(req, res) {
  const context = getRequestContext(req);
  await authService.resendVerification({ email: req.body.email, context });
  res.status(200).json({
    success: true,
    data: { message: 'If the account exists and is unverified, a new link has been sent.' },
  });
}

export async function me(req, res) {
  const result = await authService.getCurrentUser({ userId: req.user.id });
  res.status(200).json({ success: true, data: result });
}

export async function listSessions(req, res) {
  const sessions = await sessionService.list({
    userId: req.user.id,
    currentSessionId: req.auth.sessionId,
  });
  res.status(200).json({ success: true, data: { sessions } });
}

export async function revokeSession(req, res) {
  const context = getRequestContext(req);
  await sessionService.revoke({
    sessionId: req.params.id,
    userId: req.user.id,
    reason: 'user_revoked',
    context,
  });
  res.status(200).json({ success: true, data: { message: 'Session revoked' } });
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
  me,
  listSessions,
  revokeSession,
};
