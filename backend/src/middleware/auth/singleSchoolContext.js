import AuthorizationError from '../../shared/errors/AuthorizationError.js';
import { resolveSingleSchool } from '../../application/services/singleSchoolContextService.js';
import prisma from '../../infrastructure/orm/prismaClient.js';

export default async function singleSchoolContext(req, _res, next) {
  if (!req.user) throw new AuthorizationError('Authentication required');

  const selectedId = req.get('x-school-id');
  const isOwner =
    req.user.platformRole === 'OWNER' || req.user.accountType === 'APPLICATION_MANAGER';
  if (
    selectedId &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedId)
  )
    throw new AuthorizationError('Select a valid school');
  if (selectedId && !isOwner && !req.user.tenantId)
    throw new AuthorizationError('Account does not belong to a school');
  const school = selectedId
    ? await prisma.school.findFirst({
        where: { id: selectedId, ...(!isOwner ? { tenantId: req.user.tenantId } : {}) },
      })
    : await resolveSingleSchool({ tenantId: req.user.tenantId || undefined });
  if (!school) throw new AuthorizationError('Selected school is not available to this account');
  if (!isOwner && req.user.tenantId && school.tenantId && req.user.tenantId !== school.tenantId) {
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
