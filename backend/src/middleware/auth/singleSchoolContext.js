import AuthorizationError from '../../shared/errors/AuthorizationError.js';
import { resolveSingleSchool } from '../../application/services/singleSchoolContextService.js';

export default async function singleSchoolContext(req, _res, next) {
  if (!req.user) throw new AuthorizationError('Authentication required');

  const school = await resolveSingleSchool({ tenantId: req.user.tenantId || undefined });
  if (req.user.tenantId && school.tenantId && req.user.tenantId !== school.tenantId) {
    throw new AuthorizationError('Account does not belong to this school');
  }

  req.schoolContext = {
    tenantId: school.tenantId,
    schoolId: school.id,
    userId: req.user.id,
  };
  req.tenantContext = school.tenantId ? { id: school.tenantId } : null;
  req.auth = { ...req.auth, tenantId: school.tenantId, schoolId: school.id };
  req.school = school;
  next();
}
