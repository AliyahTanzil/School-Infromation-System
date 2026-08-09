import prisma from '../orm/prismaClient.js';

const includePortal = {
  profile: true,
  preferences: true,
  notifications: true,
  relationships: {
    where: { status: 'ACTIVE', revokedAt: null },
    include: {
      student: {
        include: { profile: true, enrollments: { orderBy: { startDate: 'desc' }, take: 1 } },
      },
    },
  },
};

export async function findPortal(parentId) {
  return prisma.parent.findUnique({ where: { id: parentId }, include: includePortal });
}

export async function findByUser(userId) {
  return prisma.parent.findFirst({ where: { userId, deletedAt: null }, include: includePortal });
}

export async function createWithProfile(data, profile) {
  return prisma.parent.create({
    data: {
      ...data,
      profile: { create: profile },
      preferences: { create: {} },
      notifications: { create: {} },
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
