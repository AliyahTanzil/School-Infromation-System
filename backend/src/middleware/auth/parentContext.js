import prisma from '../../infrastructure/orm/prismaClient.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';

export default async function requireParentContext(req, _res, next) {
  const parent = await prisma.parent.findFirst({
    where: { userId: req.user.id, deletedAt: null },
    select: { id: true, tenantId: true, schoolId: true },
  });
  if (!parent) throw new AuthorizationError('Parent portal access is not available');
  req.parent = parent;
  next();
}
