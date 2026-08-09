const EnrollmentStatus = Object.freeze({ ACTIVE: 'ACTIVE' });
const ClassStatus = Object.freeze({ ACTIVE: 'ACTIVE' });
import { assertCapacity, assertClassTransition } from '../../domain/classLifecycle.js';
import * as repository from '../../infrastructure/repositories/classRepository.js';

export async function list({
  tenantId,
  schoolId,
  query,
  status,
  academicYear,
  page = 1,
  pageSize = 25,
}) {
  const where = {
    tenantId,
    schoolId,
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(academicYear ? { academicYear } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { code: { contains: query, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  const take = Math.min(Math.max(Number(pageSize) || 25, 1), 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
  const [items, total] = await Promise.all([
    repository.listClasses(where, { skip, take }),
    repository.countClasses(where),
  ]);
  return {
    items,
    page: Math.floor(skip / take) + 1,
    pageSize: take,
    total,
    totalPages: Math.ceil(total / take),
  };
}

export async function create(input) {
  const data = { ...input, tenantId: input.tenantId, schoolId: input.schoolId };
  assertCapacity(data.capacity, 0);
  return repository.createClass(data);
}

export async function changeStatus({ id, schoolId, actorId, status, reason }) {
  const current = await repository.getClass(id, schoolId);
  if (!current) throw new Error('Class not found');
  assertClassTransition(current.status, status);
  return repository.getClient().$transaction(async (tx) => {
    const updated = await tx.class.update({
      where: { id },
      data: { status },
      include: { gradeLevel: true, classroom: true },
    });
    await repository.createHistory(
      { classId: id, fromStatus: current.status, toStatus: status, actorId, reason },
      tx
    );
    return updated;
  });
}

export async function enroll({ classId, studentId, tenantId, schoolId }) {
  return repository.getClient().$transaction(async (tx) => {
    const klass = await tx.class.findFirst({
      where: { id: classId, tenantId, schoolId, deletedAt: null },
      include: {
        _count: { select: { enrollments: { where: { status: EnrollmentStatus.ACTIVE } } } },
      },
    });
    if (!klass) throw new Error('Class not found');
    if (klass.status !== ClassStatus.ACTIVE)
      throw new Error('Only active classes accept enrollment');
    const existing = await tx.classEnrollment.findFirst({
      where: { classId, studentId, status: EnrollmentStatus.ACTIVE },
    });
    if (existing) return existing;
    assertCapacity(klass.capacity, klass._count.enrollments + 1);
    return tx.classEnrollment.upsert({
      where: { classId_studentId: { classId, studentId } },
      update: { status: EnrollmentStatus.ACTIVE, endedAt: null },
      create: { classId, studentId, tenantId, schoolId, status: EnrollmentStatus.ACTIVE },
    });
  });
}
