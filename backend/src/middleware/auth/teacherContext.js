import prisma from '../../infrastructure/orm/prismaClient.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';

export default async function teacherContext(req, _res, next) {
  const membership = await prisma.schoolAdministrator.findFirst({
    where: { userId: req.user.id, revokedAt: null },
    select: { tenantId: true, schoolId: true },
  });
  if (!membership) throw new AuthorizationError('School context is not available');
  req.schoolContext = { ...membership, userId: req.user.id };
  next();
}
