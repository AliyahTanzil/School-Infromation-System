import AuthorizationError from '../../shared/errors/AuthorizationError.js';
import prisma from '../../infrastructure/orm/prismaClient.js';

/** Resolve and validate the tenant/school scope for every school request. */
export async function requireSchoolContext(req, _res, next) {
  const schoolId = req.params.schoolId ?? req.body?.schoolId ?? req.query.schoolId;
  if (!schoolId)
    throw new AuthorizationError('School context is required', 'SCHOOL_CONTEXT_REQUIRED');

  const school = await prisma.school.findFirst({
    where: { id: schoolId, deletedAt: null, status: 'ACTIVE' },
    select: { id: true, tenantId: true, name: true, slug: true },
  });
  if (!school) throw new AuthorizationError('School not found', 'SCHOOL_NOT_FOUND');

  const requestedTenant = req.headers['x-tenant-id'] ?? req.query.tenantId;
  if (requestedTenant && requestedTenant !== school.tenantId) {
    throw new AuthorizationError('School is outside the requested tenant', 'TENANT_SCOPE_MISMATCH');
  }
  req.schoolContext = school;
  req.tenantContext = { id: school.tenantId };
  next();
}

export default requireSchoolContext;
