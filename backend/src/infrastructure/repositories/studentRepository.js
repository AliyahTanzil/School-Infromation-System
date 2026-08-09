import prisma from '../orm/prismaClient.js';

const include = {
  profile: true,
  admission: true,
  guardians: { include: { guardian: true } },
  enrollments: { orderBy: { startDate: 'desc' } },
};

const scoped = (schoolId, tenantId, extra = {}) => ({
  tenantId,
  schoolId,
  deletedAt: null,
  ...extra,
});

export async function create(data, tx = prisma) {
  return tx.student.create({
    data: {
      ...data,
      profile: { create: data.profile },
      admission: { create: data.admission ?? {} },
    },
    include,
  });
}

export function findById(id, schoolId, tenantId, tx = prisma) {
  return tx.student.findFirst({ where: scoped(schoolId, tenantId, { id }), include });
}

export async function list(
  { schoolId, tenantId, search, status, page = 1, pageSize = 25 },
  tx = prisma
) {
  const where = scoped(schoolId, tenantId, {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { admissionNumber: { contains: search, mode: 'insensitive' } },
            { profile: { firstName: { contains: search, mode: 'insensitive' } } },
            { profile: { lastName: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  });
  const [items, total] = await tx.$transaction([
    tx.student.findMany({
      where,
      include,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    tx.student.count({ where }),
  ]);
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export function update(id, schoolId, tenantId, data, tx = prisma) {
  return tx.student.update({
    where: { id },
    data: { ...data, profile: data.profile ? { update: data.profile } : undefined },
    include,
  });
}

export function updateStatus(id, schoolId, tenantId, status, tx = prisma) {
  return tx.student.update({
    where: { id },
    data: { status, enrolledAt: status === 'ACTIVE' ? new Date() : undefined },
    include,
  });
}

export function addHistory(data, tx = prisma) {
  return tx.studentHistory.create({ data });
}
export function addGuardian(studentId, guardianId, data, tx = prisma) {
  return tx.studentGuardian.create({
    data: { studentId, guardianId, ...data },
    include: { guardian: true },
  });
}
export function createGuardian(data, tx = prisma) {
  return tx.guardian.create({ data });
}
export function updateMedical(studentId, data, tx = prisma) {
  return tx.medicalRecord.upsert({
    where: { studentId },
    create: { studentId, ...data },
    update: data,
  });
}

export default {
  create,
  findById,
  list,
  update,
  updateStatus,
  addHistory,
  addGuardian,
  createGuardian,
  updateMedical,
};
