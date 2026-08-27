import prisma from '../orm/prismaClient.js';

const includePortal = {
  profile: true,
  relationships: {
    where: { status: 'ACTIVE', revokedAt: null },
    include: {
      student: {
        include: { enrollments: { orderBy: { enrolledAt: 'desc' }, take: 1 } },
      },
    },
  },
};

export async function findPortal(parentId, tenantId) {
  return prisma.parent.findFirst({
    where: { id: parentId, tenantId, deletedAt: null },
    include: includePortal,
  });
}

export async function findByUser(userId, tenantId) {
  return prisma.parent.findFirst({
    where: { userId, tenantId, deletedAt: null },
    include: includePortal,
  });
}

export async function createWithProfile(data, profile) {
  return prisma.parent.create({
    data: {
      ...data,
      profile: { create: profile },
    },
    include: includePortal,
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
