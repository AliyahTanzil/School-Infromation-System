import prisma from '../../infrastructure/orm/prismaClient.js';

export async function list({ tenantId, schoolId, classroomId }) {
  return prisma.digitalMaterial.findMany({
    where: { tenantId, schoolId, ...(classroomId ? { classroomId } : {}), status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  });
}

export async function create(input) {
  return prisma.digitalMaterial.create({ data: input });
}

export async function getById({ id, tenantId, schoolId }) {
  return prisma.digitalMaterial.findFirst({ where: { id, tenantId, schoolId, status: 'ACTIVE' } });
}

export async function archive({ id, tenantId, schoolId }) {
  return prisma.digitalMaterial.updateMany({
    where: { id, tenantId, schoolId },
    data: { status: 'ARCHIVED' },
  });
}
