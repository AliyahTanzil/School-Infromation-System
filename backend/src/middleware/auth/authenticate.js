import * as tokenService from '../../infrastructure/auth/tokenService.js';
import sessionRepository from '../../infrastructure/repositories/sessionRepository.js';
import AuthenticationError from '../../shared/errors/AuthenticationError.js';
import accessContextService from '../../application/services/accessContextService.js';

/**
 * Authentication middleware.
 *
 * 1. Extracts the Bearer access token from the Authorization header.
 * 2. Verifies its signature, issuer, audience, and expiry.
 * 3. Confirms the referenced session is still active (so a revoked/ logged-out
 *    session cannot keep acting on a not-yet-expired access token).
 * 4. Attaches a normalized `req.user` and `req.auth` for downstream handlers.
 *
 * Throws AuthenticationError (401) on any failure.
 */
export default async function authenticate(req, _res, next) {
  const header = req.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AuthenticationError('Authentication required');
  }

  // Throws on tamper/expiry; normalizeError maps JWT errors to 401.
  const payload = tokenService.verifyAccessToken(token);

  const session = await sessionRepository.findActiveById(payload.sessionId);
  if (!session || session.userId !== payload.sub) {
    throw new AuthenticationError('Session is no longer valid');
  }

  const context = await accessContextService.resolveAccessContext(
    payload.sub,
    req.get('x-tenant-id') || null
  );
  req.user = {
    id: payload.sub,
    email: payload.email,
    tenantId: context.tenantId,
    accountType: context.accountType,
    platformRole: context.platformRole,
    roles: context.roles,
  };
  req.auth = { sessionId: payload.sessionId, ...context };

  next();
}
