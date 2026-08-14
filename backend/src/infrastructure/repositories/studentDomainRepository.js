import prisma from '../orm/prismaClient.js';

const studentInclude = {
  guardians: { include: { guardian: true } },
  enrollments: { include: { academicYear: true }, orderBy: { enrolledAt: 'desc' } },
};

export const listStudents = ({ tenantId, search, page, pageSize }) => {
  const query = search?.trim();
  const where = {
    tenantId,
    ...(query
      ? {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { admissionNumber: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  return prisma.$transaction([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      include: studentInclude,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
};

export const findStudent = (tenantId, id) =>
  prisma.student.findFirst({ where: { tenantId, id }, include: studentInclude });

export const createStudent = (data) => prisma.student.create({ data, include: studentInclude });

export const updateStudent = (tenantId, id, data) =>
  prisma.student.update({ where: { id, tenantId }, data, include: studentInclude });

export const createGuardianLink = (tenantId, studentId, data) =>
  prisma.studentGuardian.create({
    data: {
      studentId,
      guardian: { create: { tenantId, ...data.guardian } },
      relationship: data.relationship,
      isPrimary: data.isPrimary ?? false,
    },
    include: { guardian: true },
  });

export const findGuardian = (tenantId, guardianId) =>
  prisma.guardian.findFirst({ where: { tenantId, id: guardianId } });

export const linkExistingGuardian = (studentId, guardianId, relationship, isPrimary) =>
  prisma.studentGuardian.create({ data: { studentId, guardianId, relationship, isPrimary } });
