import prisma from '../orm/prismaClient.js';

const include = {
  profile: true,
  employment: true,
  qualifications: true,
  certifications: true,
  departments: true,
  availability: true,
};

export function createTeacher(data) {
  return prisma.teacher.create({ data, include });
}
export function listTeachers({ tenantId, schoolId, status, query, page = 1, pageSize = 50 }) {
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
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
}
export function findTeacher(id, context) {
  return prisma.teacher.findFirst({
    where: { id, tenantId: context.tenantId, schoolId: context.schoolId, deletedAt: null },
    include: { ...include, history: { orderBy: { createdAt: 'desc' }, take: 20 } },
  });
}
export function findTeacherByUser(userId, context) {
  return prisma.teacher.findFirst({
    where: {
      userId,
      tenantId: context.tenantId,
      schoolId: context.schoolId,
      deletedAt: null,
    },
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

export function changeStatus(teacher, context, data) {
  return prisma.$transaction(async (tx) => {
    await tx.teacher.updateMany({
      where: {
        id: teacher.id,
        tenantId: context.tenantId,
        schoolId: context.schoolId,
        deletedAt: null,
      },
      data: { status: data.status },
    });
    await tx.teacherHistory.create({
      data: {
        teacherId: teacher.id,
        fromStatus: teacher.status,
        toStatus: data.status,
        reason: data.reason,
        actorId: context.userId,
      },
    });
    return tx.teacher.findFirst({
      where: { id: teacher.id, tenantId: context.tenantId, schoolId: context.schoolId },
      include: { ...include, history: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
  });
}
