import parentRepository from '../../infrastructure/repositories/parentRepository.js';
import prisma from '../../infrastructure/orm/prismaClient.js';

function publicPortal(parent) {
  return {
    id: parent.id,
    profile: parent.profile,
    preferences: parent.preferences,
    notifications: parent.notifications,
    children: parent.relationships.map((link) => ({
      relationship: link.relationship,
      permissions: {
        academic: link.canViewAcademic,
        attendance: link.canViewAttendance,
        fees: link.canViewFees,
      },
      student: {
        id: link.student.id,
        status: link.student.status,
        admissionNumber: link.student.admissionNumber,
        profile: link.student.profile,
        enrollment: link.student.enrollments[0] ?? null,
      },
    })),
  };
}

export async function getPortal(parentId, req) {
  const parent = await parentRepository.findPortal(parentId);
  await prisma.parentAccessLog.create({
    data: { parentId, resource: 'parent-portal', action: 'VIEW', ipAddress: req.ip },
  });
  return publicPortal(parent);
}

export async function updateProfile(parentId, data) {
  return prisma.parentProfile.update({ where: { parentId }, data });
}

export async function link(parentId, studentId, relationship) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, deletedAt: null },
    select: { id: true },
  });
  if (!student) throw new Error('Student not found');
  return parentRepository.linkStudent(parentId, studentId, relationship);
}

export async function unlink(parentId, studentId) {
  return parentRepository.unlinkStudent(parentId, studentId);
}

export default { getPortal, updateProfile, link, unlink };
