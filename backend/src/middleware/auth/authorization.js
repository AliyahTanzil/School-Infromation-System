import AuthorizationError from '../../shared/errors/AuthorizationError.js';
import authorizationService from '../../application/services/authorizationService.js';

function schoolScopeFromRequest(req) {
  return req.schoolContext?.schoolId ?? req.auth?.schoolId ?? req.user?.schoolId ?? null;
}

export function requireTenantContext(req, _res, next) {
  const schoolId = schoolScopeFromRequest(req);
  if (!schoolId) {
    throw new AuthorizationError('School context required', 'SCHOOL_CONTEXT_REQUIRED');
  }
  req.auth = { ...req.auth, schoolId, tenantId: req.auth?.tenantId ?? req.user?.tenantId ?? null };
  next();
}

export function requirePermission(
  permissionCode,
  scopeResolver = (req) => req.auth?.schoolId ?? req.user?.schoolId ?? 'school'
) {
  return async (req, _res, next) => {
    const scopeKey = scopeResolver(req);
    if (req.user?.platformRole === 'OWNER') return next();
    await authorizationService.assertCan(req.user.id, permissionCode, scopeKey);
    next();
  };
}

export function requireRole(...roleCodes) {
  return async (req, _res, next) => {
    const roles = new Set(req.user?.roles ?? []);
    if (!roleCodes.some((role) => roles.has(role))) {
      throw new AuthorizationError('Required role not present', 'ROLE_REQUIRED');
    }
    next();
  };
}

export function requirePlatformOwner() {
  throw new AuthorizationError(
    'Platform access is not available in single-school mode',
    'PLATFORM_ACCESS_DISABLED'
  );
}

export default { requireTenantContext, requirePermission, requireRole, requirePlatformOwner };
