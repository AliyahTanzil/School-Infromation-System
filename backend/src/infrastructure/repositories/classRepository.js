import prisma from '../orm/prismaClient.js';

const include = {
  gradeLevel: { select: { id: true, name: true, code: true } },
  classroom: { select: { id: true, name: true, code: true, capacity: true } },
  _count: { select: { enrollments: { where: { status: 'ACTIVE' } }, teachers: true } },
};

export function listClasses(where, { skip = 0, take = 25 } = {}) {
  return prisma.class.findMany({
    where,
    include,
    orderBy: [{ academicYear: 'desc' }, { name: 'asc' }],
    skip,
    take,
  });
}
export function countClasses(where) {
  return prisma.class.count({ where });
}
export function getClass(id, schoolId) {
  return prisma.class.findFirst({ where: { id, schoolId, deletedAt: null }, include });
}
export function createClass(data) {
  return prisma.class.create({ data, include });
}
export function updateClass(id, schoolId, data) {
  return prisma.class.update({ where: { id }, data, include });
}
export function createHistory(data, tx = prisma) {
  return tx.classHistory.create({ data });
}
export function getClient() {
  return prisma;
}
