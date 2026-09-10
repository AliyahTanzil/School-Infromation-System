import authorizeSchoolAdmin from './authorizeSchoolAdmin.js';

// Teacher assignment checks remain the responsibility of the scoped service operation.
export default function authorizeSchoolAdminOrTeacher(req, res, next) {
  if (req.user?.roles?.includes('TEACHER')) return next();
  return authorizeSchoolAdmin(req, res, next);
}
