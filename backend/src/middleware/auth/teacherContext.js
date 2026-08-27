import prisma from '../../infrastructure/orm/prismaClient.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';

export default async function teacherContext(req, _res, next) {
  const tenantId = req.user.tenantId;
  const schoolId = req.get('x-school-id') ?? req.query.schoolId ?? req.body?.schoolId;
  if (!tenantId) throw new AuthorizationError('Tenant context is required');
  if (!schoolId) throw new AuthorizationError('School context is required');
  const school = await prisma.school.findFirst({
    where: { id: schoolId, tenantId },
    select: { tenantId: true, id: true },
  });
  if (!school) throw new AuthorizationError('School is outside the authenticated tenant');
  req.schoolContext = { tenantId: school.tenantId, schoolId: school.id, userId: req.user.id };
  next();
}
