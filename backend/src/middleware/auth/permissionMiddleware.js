import authorizationService from '../../application/services/authorizationService.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';

export function requirePermission(
  permissionCode,
  getScope = (req) => req.query.scopeKey ?? req.body?.scopeKey ?? 'global'
) {
  return async function permissionMiddleware(req, _res, next) {
    if (!req.user?.id)
      throw new AuthorizationError('Authentication required', 'AUTHENTICATION_REQUIRED');
    const scopeKey = getScope(req);
    if (req.user.platformRole === 'OWNER') {
      req.authorization = { permissionCode, scopeKey, source: 'platform-owner' };
      return next();
    }
    const allowed = await authorizationService.can(req.user.id, permissionCode, scopeKey);
    if (!allowed) throw new AuthorizationError('Forbidden', 'FORBIDDEN');
    req.authorization = { permissionCode, scopeKey };
    next();
  };
}

export default requirePermission;
