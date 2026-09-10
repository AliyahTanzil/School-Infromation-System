import authorize from './authorize.js';

const administrator = authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN');

// Use after authentication and school-context resolution on school administration routes.
export default function authorizeSchoolAdmin(req, res, next) {
  if (req.user?.platformRole === 'OWNER') return next();
  return administrator(req, res, next);
}
