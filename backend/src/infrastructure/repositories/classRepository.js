import prisma from '../orm/prismaClient.js';

const include = {
  academicYear: { select: { id: true, name: true } },
  gradeLevel: { select: { id: true, name: true, code: true } },
  classroom: { select: { id: true, name: true, code: true, capacity: true } },
  subjects: { include: { subject: true } },
  teachers: { include: { teacher: { include: { profile: true } } } },
  _count: { select: { enrollments: { where: { status: 'ACTIVE' } } } },
};

export function listClasses(where, { skip = 0, take = 25 } = {}) {
  return prisma.class.findMany({
    where,
    include,
    orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
    skip,
    take,
  });
}
export function countClasses(where) {
  return prisma.class.count({ where });
}
export function getClass(id, context) {
  return prisma.class.findFirst({
    where: { id, tenantId: context.tenantId, schoolId: context.schoolId, deletedAt: null },
    include,
  });
}
export function createClass(data) {
  return prisma.class.create({ data, include });
}
export function updateClass(id, schoolId, data) {
  return prisma.class.update({ where: { id, schoolId }, data, include });
}
export function createHistory(data, tx = prisma) {
  return tx.classHistory.create({ data });
}
export function getClient() {
  return prisma;
}
