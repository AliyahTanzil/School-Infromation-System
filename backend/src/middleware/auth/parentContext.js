import prisma from '../../infrastructure/orm/prismaClient.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';

export default async function requireParentContext(req, _res, next) {
  if (!req.user?.tenantId) {
    throw new AuthorizationError('Parent tenant context is required', 'TENANT_CONTEXT_REQUIRED');
  }
  const parent = await prisma.parent.findFirst({
    where: { userId: req.user.id, tenantId: req.user.tenantId, deletedAt: null },
    select: { id: true, tenantId: true, schoolId: true },
  });
  if (!parent) throw new AuthorizationError('Parent portal access is not available');
  req.parent = parent;
  next();
}
