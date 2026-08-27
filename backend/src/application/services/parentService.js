import parentRepository from '../../infrastructure/repositories/parentRepository.js';
import prisma from '../../infrastructure/orm/prismaClient.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';

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
        status: link.student.enrollments[0]?.status ?? 'NOT_ENROLLED',
        admissionNumber: link.student.admissionNumber,
        profile: {
          firstName: link.student.firstName,
          lastName: link.student.lastName,
        },
        enrollment: link.student.enrollments[0] ?? null,
      },
    })),
  };
}

export async function getPortal(parentId, tenantId, req) {
  const parent = await parentRepository.findPortal(parentId, tenantId);
  if (!parent) throw new NotFoundError('Parent portal not found');
  await prisma.parentAccessLog.create({
    data: { parentId, resource: 'parent-portal', action: 'VIEW', ipAddress: req.ip },
  });
  return publicPortal(parent);
}

export async function updateProfile(parentId, data) {
  return prisma.parentProfile.update({ where: { parentId }, data });
}

export async function link(parentId, tenantId, studentId, relationship) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId },
    select: { id: true },
  });
  if (!student) throw new NotFoundError('Student not found');
  return parentRepository.linkStudent(parentId, studentId, relationship);
}

export async function unlink(parentId, studentId) {
  return parentRepository.unlinkStudent(parentId, studentId);
}

export default { getPortal, updateProfile, link, unlink };
