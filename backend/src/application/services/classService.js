import { generateRecordCode } from '../../shared/utils/recordCode.js';
const EnrollmentStatus = Object.freeze({ ACTIVE: 'ACTIVE' });
const ClassStatus = Object.freeze({ ACTIVE: 'ACTIVE' });
import { assertCapacity, assertClassTransition } from '../../domain/classLifecycle.js';
import * as repository from '../../infrastructure/repositories/classRepository.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';
import ValidationError from '../../shared/errors/ValidationError.js';

export async function list({
  tenantId,
  schoolId,
  query,
  status,
  academicYearId,
  page = 1,
  pageSize = 25,
}) {
  const where = {
    tenantId,
    schoolId,
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(academicYearId ? { academicYearId } : {}),
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
  const data = {
    ...input,
    code:
      input.code ||
      generateRecordCode('CLS', input.schoolId, [input.name, input.section, input.academicYearId]),
    tenantId: input.tenantId,
    schoolId: input.schoolId,
  };
  assertCapacity(data.capacity, 0);
  const prisma = repository.getClient();
  const [year, grade, room] = await Promise.all([
    prisma.academicYear.findFirst({ where: { id: data.academicYearId, tenantId: data.tenantId } }),
    prisma.gradeLevel.findFirst({
      where: { id: data.gradeLevelId, tenantId: data.tenantId, schoolId: data.schoolId },
    }),
    data.classroomId
      ? prisma.classroom.findFirst({
          where: { id: data.classroomId, tenantId: data.tenantId, schoolId: data.schoolId },
        })
      : null,
  ]);
  if (!year || !grade || (data.classroomId && !room))
    throw new ValidationError(
      'Academic year, grade level, or classroom is outside the selected school'
    );
  return repository.createClass(data);
}

export async function changeStatus({ id, tenantId, schoolId, actorId, status, reason }) {
  const context = { tenantId, schoolId };
  const current = await repository.getClass(id, context);
  if (!current) throw new NotFoundError('Class not found');
  assertClassTransition(current.status, status);
  return repository.getClient().$transaction(async (tx) => {
    const updated = await tx.class.update({
      where: { id, tenantId: context.tenantId, schoolId },
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
    if (!klass) throw new NotFoundError('Class not found');
    if (klass.status !== ClassStatus.ACTIVE)
      throw new ValidationError('Only active classes accept enrollment');
    const student = await tx.student.findFirst({ where: { id: studentId, tenantId } });
    if (!student) throw new NotFoundError('Student not found');
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

export async function options({ tenantId, schoolId }) {
  const db = repository.getClient();
  const [academicYears, gradeLevels] = await Promise.all([
    db.academicYear.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      orderBy: { startsOn: 'desc' },
    }),
    db.gradeLevel.findMany({
      where: { tenantId, schoolId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);
  return { academicYears, gradeLevels };
}
