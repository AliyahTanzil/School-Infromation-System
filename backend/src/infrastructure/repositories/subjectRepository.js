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
    include: {
      classes: {
        include: {
          class: { include: { gradeLevel: true } },
        },
      },
    },
    orderBy: [{ name: 'asc' }, { code: 'asc' }],
  });
}
export const find = (id, context) => prisma.subject.findFirst({ where: { id, ...scope(context) } });
export const create = (data, tx = prisma) => tx.subject.create({ data });
export const getClient = () => prisma;
export const update = (id, context, data, tx = prisma) =>
  tx.subject.update({
    where: { id, ...scope(context) },
    data,
  });
