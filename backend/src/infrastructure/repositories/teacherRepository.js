import prisma from '../orm/prismaClient.js';

const include = {
  profile: true,
  employment: true,
  qualifications: true,
  certifications: true,
  departments: true,
  subjects: true,
  classes: true,
  availability: true,
};

export function createTeacher(data) {
  return prisma.teacher.create({ data, include });
}
export function listTeachers({ tenantId, schoolId, status, query }) {
  return prisma.teacher.findMany({
    where: {
      tenantId,
      schoolId,
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(query
        ? {
            OR: [
              { employeeNumber: { contains: query, mode: 'insensitive' } },
              { profile: { firstName: { contains: query, mode: 'insensitive' } } },
              { profile: { lastName: { contains: query, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    include,
    orderBy: { createdAt: 'desc' },
  });
}
export function findTeacher(id, context) {
  return prisma.teacher.findFirst({
    where: { id, tenantId: context.tenantId, schoolId: context.schoolId, deletedAt: null },
    include: { ...include, history: { orderBy: { createdAt: 'desc' }, take: 20 } },
  });
}
export function updateTeacher(id, context, data) {
  return prisma.teacher.updateMany({
    where: { id, tenantId: context.tenantId, schoolId: context.schoolId, deletedAt: null },
    data,
  });
}
export function addHistory(data) {
  return prisma.teacherHistory.create({ data });
}
