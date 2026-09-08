import AuthorizationError from '../../shared/errors/AuthorizationError.js';

export default function requireApplicationOwner(req, _res, next) {
  const isApplicationOwner =
    req.user?.accountType === 'APPLICATION_MANAGER' && req.user?.platformRole === 'OWNER';

  if (!isApplicationOwner) {
    throw new AuthorizationError(
      'Only the application owner can manage activation requests',
      'APPLICATION_OWNER_REQUIRED'
    );
  }

  next();
}
