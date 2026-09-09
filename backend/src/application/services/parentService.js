import parentRepository from '../../infrastructure/repositories/parentRepository.js';
import prisma from '../../infrastructure/orm/prismaClient.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';

function parentScope(scope) {
  if (!scope?.tenantId || !scope?.schoolId) {
    throw new AuthorizationError('Parent school context is required', 'SCHOOL_CONTEXT_REQUIRED');
  }
  return {
    tenantId: scope.tenantId,
    deletedAt: null,
    OR: [{ schoolId: scope.schoolId }, { schoolId: null }],
  };
}

function publicPortal(parent) {
  return {
    id: parent.id,
    profile: parent.profile,
    preferences: { locale: parent.profile?.preferredLanguage ?? 'en' },
    notifications: [],
    children: parent.relationships.map((link) => ({
      relationship: link.relationship,
      permissions: {
        academic: link.canViewAcademic,
        attendance: link.canViewAttendance,
        fees: link.canViewFees,
      },
      student: {
        id: link.student.id,
        status: link.student.classEnrollments[0]?.status ?? 'NOT_ENROLLED',
        admissionNumber: link.student.admissionNumber,
        profile: {
          firstName: link.student.firstName,
          lastName: link.student.lastName,
        },
        enrollment: link.student.classEnrollments[0] ?? null,
      },
    })),
  };
}

export async function getPortal(parentId, scope, req) {
  parentScope(scope);
  const parent = await parentRepository.findPortal(parentId, scope);
  if (!parent) throw new NotFoundError('Parent portal not found');
  await prisma.parentAccessLog.create({
    data: { parentId, resource: 'parent-portal', action: 'VIEW', ipAddress: req.ip },
  });
  return publicPortal(parent);
}

export async function updateProfile(parentId, data, scope) {
  const ownership = parentScope(scope);
  return prisma.parentProfile.update({ where: { parentId, parent: ownership }, data });
}

export async function link(parentId, scope, studentId, relationship) {
  const ownership = parentScope(scope);
  const { tenantId, schoolId } = scope;
  return prisma.$transaction(async (tx) => {
    const parent = await tx.parent.findFirst({
      where: { id: parentId, ...ownership },
      select: { id: true },
    });
    if (!parent) throw new NotFoundError('Parent portal not found');
    const student = await tx.student.findFirst({
      where: {
        id: studentId,
        tenantId,
        classEnrollments: { some: { tenantId, schoolId, status: 'ACTIVE' } },
      },
      select: { id: true },
    });
    if (!student) throw new NotFoundError('Student not found');
    return parentRepository.linkStudent(parentId, studentId, relationship, tx);
  });
}

export async function unlink(parentId, studentId, scope) {
  return parentRepository.unlinkStudent(parentId, studentId, parentScope(scope));
}

export default { getPortal, updateProfile, link, unlink };
