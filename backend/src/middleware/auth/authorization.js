import AuthorizationError from '../../shared/errors/AuthorizationError.js';
import authorizationService from '../../application/services/authorizationService.js';

function tenantFromRequest(req) {
  const requested = req.get('x-tenant-id') || req.params.tenantId || req.query.tenantId;
  const current = req.user?.tenantId;
  if (requested && current && requested !== current) {
    throw new AuthorizationError('Tenant context is not permitted', 'TENANT_CONTEXT_FORBIDDEN');
  }
  return requested || current || null;
}

export function requireTenantContext(req, _res, next) {
  const tenantId = tenantFromRequest(req);
  if (!tenantId) throw new AuthorizationError('Tenant context required', 'TENANT_CONTEXT_REQUIRED');
  req.auth = { ...req.auth, tenantId };
  next();
}

export function requirePermission(
  permissionCode,
  scopeResolver = (req) => req.auth?.tenantId ?? 'global'
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

export function requirePlatformOwner(req, _res, next) {
  if (req.user?.platformRole !== 'OWNER') {
    throw new AuthorizationError('Platform owner access required', 'PLATFORM_OWNER_REQUIRED');
  }
  next();
}

export default { requireTenantContext, requirePermission, requireRole, requirePlatformOwner };
