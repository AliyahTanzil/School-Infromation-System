import prisma from '../orm/prismaClient.js';

const scope = (context) => ({
  tenantId: context.tenantId,
  schoolId: context.schoolId,
  deletedAt: null,
});
const include = {
  bands: { orderBy: { sortOrder: 'desc' } },
  weights: { include: { subject: true } },
  history: { orderBy: { createdAt: 'desc' } },
};
export const list = (context, status) =>
  prisma.gradeScheme.findMany({
    where: { ...scope(context), ...(status ? { status } : {}) },
    include,
    orderBy: { effectiveFrom: 'desc' },
  });
export const find = (id, context) =>
  prisma.gradeScheme.findFirst({ where: { id, ...scope(context) }, include });
export const create = (data, tx = prisma) => tx.gradeScheme.create({ data, include });
export const transaction = (operation) => prisma.$transaction(operation);
export { prisma };
