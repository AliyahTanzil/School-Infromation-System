import prisma from '../orm/prismaClient.js';

const scope = (context) => ({
  tenantId: context.tenantId,
  schoolId: context.schoolId,
  deletedAt: null,
});

export function list(context, filters) {
  const query = filters.query;
  return prisma.subject.findMany({
    where: {
      ...scope(context),
      ...(filters.status ? { status: filters.status } : {}),
      ...(query
        ? {
            OR: [
              { code: { contains: query, mode: 'insensitive' } },
              { name: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: [{ name: 'asc' }, { code: 'asc' }],
  });
}
export const find = (id, context) => prisma.subject.findFirst({ where: { id, ...scope(context) } });
export const create = (data) => prisma.subject.create({ data });
export const update = (id, context, data) =>
  prisma.subject.update({
    where: { id, tenantId: context.tenantId, schoolId: context.schoolId },
    data,
  });
