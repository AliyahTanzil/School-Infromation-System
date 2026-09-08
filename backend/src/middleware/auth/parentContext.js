import prisma from '../../infrastructure/orm/prismaClient.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';

export default async function requireParentContext(req, _res, next) {
  if (!req.schoolContext?.tenantId || !req.schoolContext?.schoolId) {
    throw new AuthorizationError('Parent school context is required', 'SCHOOL_CONTEXT_REQUIRED');
  }
  const parent = await prisma.parent.findFirst({
    where: {
      userId: req.user.id,
      tenantId: req.schoolContext.tenantId,
      deletedAt: null,
      OR: [{ schoolId: req.schoolContext.schoolId }, { schoolId: null }],
    },
    select: { id: true, tenantId: true, schoolId: true },
  });
  if (!parent) throw new AuthorizationError('Parent portal access is not available');
  req.parent = parent;
  next();
}
