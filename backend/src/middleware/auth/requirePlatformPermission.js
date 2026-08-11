import AuthorizationError from '../../shared/errors/AuthorizationError.js';

export default function requirePlatformPermission(permission = 'PLATFORM_ADMIN_ACCESS') {
  return (req, _res, next) => {
    const roles = req.user?.roles ?? req.auth?.roles ?? [];
    const normalized = Array.isArray(roles) ? roles : [roles];
    if (!normalized.includes('PLATFORM_ADMIN')) {
      throw new AuthorizationError('Platform administrator permission required');
    }
    if (req.body?.tenantId || req.query?.tenantId || req.params?.tenantId) {
      throw new AuthorizationError('Platform routes cannot accept implicit tenant scope');
    }
    req.platform = { permission };
    next();
  };
}
