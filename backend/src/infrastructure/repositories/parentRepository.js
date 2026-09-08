import prisma from '../orm/prismaClient.js';

const includePortal = ({ tenantId, schoolId }) => ({
  profile: true,
  relationships: {
    where: {
      status: 'ACTIVE',
      revokedAt: null,
      student: {
        classEnrollments: { some: { tenantId, schoolId, status: 'ACTIVE' } },
      },
    },
    include: {
      student: {
        include: {
          classEnrollments: {
            where: { tenantId, schoolId, status: 'ACTIVE' },
            orderBy: { enrolledAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  },
});

export async function findPortal(parentId, { tenantId, schoolId }) {
  return prisma.parent.findFirst({
    where: {
      id: parentId,
      tenantId,
      deletedAt: null,
      OR: [{ schoolId }, { schoolId: null }],
    },
    include: includePortal({ tenantId, schoolId }),
  });
}

export async function findByUser(userId, tenantId) {
  return prisma.parent.findFirst({
    where: { userId, tenantId, deletedAt: null },
    include: includePortal({ tenantId, schoolId: undefined }),
  });
}

export async function createWithProfile(data, profile) {
  return prisma.parent.create({
    data: {
      ...data,
      profile: { create: profile },
    },
    include: includePortal({ tenantId: data.tenantId, schoolId: data.schoolId }),
  });
}

export async function linkStudent(parentId, studentId, relationship) {
  return prisma.parentStudentRelationship.upsert({
    where: { parentId_studentId: { parentId, studentId } },
    update: { relationship, status: 'PENDING', revokedAt: null },
    create: { parentId, studentId, relationship },
  });
}

export async function unlinkStudent(parentId, studentId) {
  return prisma.parentStudentRelationship.update({
    where: { parentId_studentId: { parentId, studentId } },
    data: { status: 'REVOKED', revokedAt: new Date() },
  });
}

export default { findPortal, findByUser, createWithProfile, linkStudent, unlinkStudent };
