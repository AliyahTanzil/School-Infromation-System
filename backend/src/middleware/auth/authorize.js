import AuthenticationError from '../../shared/errors/AuthenticationError.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';

/**
 * Authorization middleware (foundation).
 *
 * Module 2 establishes the enforcement point; the full permission model and
 * role hierarchy resolution arrive in Module 4 (RBAC). Today this performs a
 * straightforward role-membership check against the roles embedded in the
 * access token.
 *
 * Usage: `router.post('/x', authenticate, authorize('ADMIN'), handler)`
 *
 * @param {...string} allowedRoles required role codes (any-match). No args ⇒
 *   simply requires an authenticated user.
 */
export default function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (allowedRoles.length === 0) {
      return next();
    }

    const userRoles = req.user.roles ?? [];
    const permitted = allowedRoles.some((role) => userRoles.includes(role));

    if (!permitted) {
      throw new AuthorizationError('You do not have permission to perform this action');
    }

    next();
  };
}
