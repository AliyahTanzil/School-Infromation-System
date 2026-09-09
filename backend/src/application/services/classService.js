import { generateRecordCode } from '../../shared/utils/recordCode.js';
const EnrollmentStatus = Object.freeze({ ACTIVE: 'ACTIVE' });
const ClassStatus = Object.freeze({ ACTIVE: 'ACTIVE' });
import { assertCapacity, assertClassTransition } from '../../domain/classLifecycle.js';
import * as repository from '../../infrastructure/repositories/classRepository.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';
import ValidationError from '../../shared/errors/ValidationError.js';

const gradeLevelNames = Object.freeze({
  PRE_SCHOOL_NURSERY: 'Pre-School Nursery',
  PRIMARY_SCHOOL: 'Primary School',
  JUNIOR_SECONDARY: 'Junior Secondary',
  SENIOR_SECONDARY: 'Senior Secondary',
});

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
  const prisma = repository.getClient();
  assertCapacity(input.capacity, 0);

  return prisma.$transaction(async (tx) => {
    let year;
    if (input.academicYearId) {
      year = await tx.academicYear.findFirst({
        where: { id: input.academicYearId, tenantId: input.tenantId },
      });
    } else {
      const startsOn = new Date(Date.UTC(input.academicYear, 0, 1));
      const nextYear = new Date(Date.UTC(input.academicYear + 1, 0, 1));
      year = await tx.academicYear.findFirst({
        where: { tenantId: input.tenantId, startsOn: { gte: startsOn, lt: nextYear } },
        orderBy: { startsOn: 'asc' },
      });
      year ??= await tx.academicYear.upsert({
        where: {
          tenantId_name: { tenantId: input.tenantId, name: String(input.academicYear) },
        },
        update: {},
        create: {
          tenantId: input.tenantId,
          name: String(input.academicYear),
          startsOn,
          endsOn: new Date(Date.UTC(input.academicYear, 11, 31)),
        },
      });
    }

    let grade;
    if (input.gradeLevelId) {
      grade = await tx.gradeLevel.findFirst({
        where: {
          id: input.gradeLevelId,
          tenantId: input.tenantId,
          schoolId: input.schoolId,
        },
      });
    } else {
      grade = await tx.gradeLevel.upsert({
        where: {
          tenantId_schoolId_code: {
            tenantId: input.tenantId,
            schoolId: input.schoolId,
            code: input.gradeLevelCode,
          },
        },
        update: { name: gradeLevelNames[input.gradeLevelCode] },
        create: {
          tenantId: input.tenantId,
          schoolId: input.schoolId,
          code: input.gradeLevelCode,
          name: gradeLevelNames[input.gradeLevelCode],
        },
      });
    }

    const room = input.classroomId
      ? await tx.classroom.findFirst({
          where: {
            id: input.classroomId,
            tenantId: input.tenantId,
            schoolId: input.schoolId,
          },
        })
      : null;
    if (!year || !grade || (input.classroomId && !room)) {
      throw new ValidationError(
        'Academic year, grade level, or classroom is outside the selected school'
      );
    }

    const data = {
      tenantId: input.tenantId,
      schoolId: input.schoolId,
      academicYearId: year.id,
      gradeLevelId: grade.id,
      classroomId: input.classroomId,
      name: input.name,
      code:
        input.code ||
        generateRecordCode('CLS', input.schoolId, [input.name, input.section, year.id]),
      section: input.section,
      capacity: input.capacity,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
    };
    return repository.createClass(data, tx);
  });
}

export async function get({ id, tenantId, schoolId }) {
  const klass = await repository.getClassDashboard(id, { tenantId, schoolId });
  if (!klass) throw new NotFoundError('Class not found');
  return klass;
}

export async function addSubject({ classId, subjectId, subject, tenantId, schoolId }) {
  const db = repository.getClient();
  return db.$transaction(async (tx) => {
    const klass = await tx.class.findFirst({
      where: { id: classId, tenantId, schoolId, deletedAt: null },
      select: { id: true },
    });
    if (!klass) throw new NotFoundError('Class not found');

    let selectedSubject;
    if (subjectId) {
      selectedSubject = await tx.subject.findFirst({
        where: { id: subjectId, tenantId, schoolId, deletedAt: null },
      });
      if (!selectedSubject) throw new NotFoundError('Subject not found');
    } else {
      selectedSubject = await tx.subject.create({
        data: {
          ...subject,
          code: subject.code || generateRecordCode('SUB', schoolId, [subject.name]),
          tenantId,
          schoolId,
        },
      });
    }

    await tx.classSubject.upsert({
      where: { classId_subjectId: { classId, subjectId: selectedSubject.id } },
      update: {},
      create: { classId, subjectId: selectedSubject.id },
    });
    return selectedSubject;
  });
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
    const student = await tx.student.findFirst({
      where: { id: studentId, tenantId, schoolId, deletedAt: null },
    });
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
