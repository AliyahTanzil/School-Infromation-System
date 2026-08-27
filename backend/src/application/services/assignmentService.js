import prisma from '../../infrastructure/orm/prismaClient.js';

export async function list({ tenantId, schoolId, classroomId, status }) {
  return prisma.assignment.findMany({
    where: {
      tenantId,
      schoolId,
      ...(classroomId ? { classroomId } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { dueAt: 'asc' },
  });
}

export async function create(input) {
  return prisma.assignment.create({
    data: { ...input, tenantId: input.tenantId, schoolId: input.schoolId },
  });
}

export async function updateStatus({ id, tenantId, schoolId, status }) {
  return prisma.assignment.updateMany({ where: { id, tenantId, schoolId }, data: { status } });
}
