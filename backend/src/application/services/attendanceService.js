const AttendanceCaptureMethod = Object.freeze({ MANUAL: 'MANUAL' });
const AttendanceSessionStatus = Object.freeze({ OPEN: 'OPEN', LOCKED: 'LOCKED' });
import {
  assertAttendanceStatus,
  assertSessionTransition,
  assertWritableSession,
  summarizeAttendance,
} from '../../domain/attendanceLifecycle.js';
import prisma from '../../infrastructure/orm/prismaClient.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';
import ValidationError from '../../shared/errors/ValidationError.js';

const isAttendanceAdmin = (roles = []) =>
  roles.some((role) => ['PLATFORM_ADMIN', 'SCHOOL_ADMIN'].includes(role));

export async function getTeacherAttendanceClassIds(
  { tenantId, schoolId, actorId, roles },
  db = prisma
) {
  if (isAttendanceAdmin(roles)) return null;
  const teacher = await db.teacher.findFirst({
    where: { userId: actorId, tenantId, schoolId, status: 'ACTIVE', deletedAt: null },
    select: { id: true },
  });
  if (!teacher) return [];

  const [classRoles, teachingAssignments] = await Promise.all([
    db.classTeacher.findMany({
      where: {
        teacherId: teacher.id,
        class: { tenantId, schoolId, deletedAt: null },
      },
      select: { classId: true },
    }),
    db.teacherTeachingAssignment.findMany({
      where: { tenantId, schoolId, teacherId: teacher.id, status: 'ACTIVE' },
      select: { classId: true },
    }),
  ]);
  return [...new Set([...classRoles, ...teachingAssignments].map(({ classId }) => classId))];
}

export async function assertAttendanceClassAccess(context, classId, db = prisma) {
  const allowedClassIds = await getTeacherAttendanceClassIds(context, db);
  if (allowedClassIds === null || allowedClassIds.includes(classId)) return;
  throw new AuthorizationError('You are not assigned to manage attendance for this class');
}

export async function attendanceOptions(context) {
  const allowedClassIds = await getTeacherAttendanceClassIds(context);
  return prisma.class.findMany({
    where: {
      tenantId: context.tenantId,
      schoolId: context.schoolId,
      deletedAt: null,
      status: { in: ['PLANNED', 'ACTIVE'] },
      ...(allowedClassIds === null ? {} : { id: { in: allowedClassIds } }),
    },
    select: {
      id: true,
      name: true,
      code: true,
      section: true,
      gradeLevel: { select: { name: true } },
      academicYear: { select: { name: true } },
    },
    orderBy: [{ name: 'asc' }, { section: 'asc' }],
  });
}

export async function listSessions({
  tenantId,
  schoolId,
  classId,
  status,
  dateFrom,
  dateTo,
  actorId,
  roles,
  page = 1,
  pageSize = 25,
}) {
  const allowedClassIds = await getTeacherAttendanceClassIds({
    tenantId,
    schoolId,
    actorId,
    roles,
  });
  const take = Math.min(Math.max(Number(pageSize) || 25, 1), 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
  const where = {
    tenantId,
    schoolId,
    ...(allowedClassIds === null
      ? classId
        ? { classId }
        : {}
      : {
          classId: {
            in:
              classId && allowedClassIds.includes(classId)
                ? [classId]
                : classId
                  ? []
                  : allowedClassIds,
          },
        }),
    ...(status ? { status } : {}),
    ...(dateFrom || dateTo
      ? {
          sessionDate: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {}),
          },
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    prisma.attendanceSession.findMany({
      where,
      skip,
      take,
      orderBy: { sessionDate: 'desc' },
      include: { class: true, period: true, _count: { select: { records: true } } },
    }),
    prisma.attendanceSession.count({ where }),
  ]);
  return {
    items,
    total,
    page: Math.floor(skip / take) + 1,
    pageSize: take,
    totalPages: Math.ceil(total / take),
  };
}

export async function createSession({ tenantId, schoolId, actorId, roles, ...input }) {
  const klass = await prisma.class.findFirst({
    where: { id: input.classId, tenantId, schoolId, deletedAt: null },
  });
  if (!klass) throw new NotFoundError('Class not found');
  await assertAttendanceClassAccess({ tenantId, schoolId, actorId, roles }, klass.id);
  if (input.periodId) {
    const period = await prisma.academicTerm.findFirst({
      where: { id: input.periodId, academicYear: { tenantId } },
    });
    if (!period) throw new ValidationError('Academic period is outside the authenticated tenant');
  }
  return prisma.$transaction(async (tx) => {
    const session = await tx.attendanceSession.create({
      data: { tenantId, schoolId, createdById: actorId, ...input },
    });
    const students = await tx.classEnrollment.findMany({
      where: { tenantId, schoolId, classId: input.classId, status: 'ACTIVE' },
      select: { studentId: true },
    });
    if (students.length)
      await tx.attendanceRecord.createMany({
        data: students.map(({ studentId }) => ({
          tenantId,
          schoolId,
          sessionId: session.id,
          studentId,
          status: 'ABSENT',
          method: AttendanceCaptureMethod.MANUAL,
        })),
      });
    return tx.attendanceSession.findUnique({
      where: { id: session.id },
      include: { class: true, records: true },
    });
  });
}

export async function getSession({ id, tenantId, schoolId, actorId, roles }) {
  const session = await prisma.attendanceSession.findFirst({
    where: { id, tenantId, schoolId },
    include: {
      class: true,
      period: true,
      records: {
        include: { student: true },
        orderBy: { student: { admissionNumber: 'asc' } },
      },
    },
  });
  if (!session) throw new NotFoundError('Attendance session not found');
  await assertAttendanceClassAccess({ tenantId, schoolId, actorId, roles }, session.classId);
  return { ...session, summary: summarizeAttendance(session.records) };
}

export async function changeStatus({ id, tenantId, schoolId, status, actorId, roles, reason }) {
  const current = await prisma.attendanceSession.findFirst({ where: { id, tenantId, schoolId } });
  if (!current) throw new NotFoundError('Attendance session not found');
  await assertAttendanceClassAccess({ tenantId, schoolId, actorId, roles }, current.classId);
  assertSessionTransition(current.status, status);
  return prisma.$transaction(async (tx) => {
    const updated = await tx.attendanceSession.update({
      where: { id },
      data: {
        status,
        openedAt: status === AttendanceSessionStatus.OPEN ? new Date() : undefined,
        lockedAt: status === AttendanceSessionStatus.LOCKED ? new Date() : undefined,
      },
    });
    await tx.attendanceAudit.create({
      data: {
        tenantId,
        schoolId,
        sessionId: id,
        actorId,
        action: 'SESSION_STATUS_CHANGED',
        metadata: { from: current.status, to: status, reason },
      },
    });
    return updated;
  });
}

export async function markBulk({ id, tenantId, schoolId, actorId, roles, records }) {
  const session = await prisma.attendanceSession.findFirst({ where: { id, tenantId, schoolId } });
  if (!session) throw new NotFoundError('Attendance session not found');
  await assertAttendanceClassAccess({ tenantId, schoolId, actorId, roles }, session.classId);
  assertWritableSession(session.status);
  records.forEach((record) => assertAttendanceStatus(record.status));
  await prisma.$transaction(async (tx) => {
    await Promise.all(
      records.map((record) =>
        tx.attendanceRecord.update({
          where: { sessionId_studentId: { sessionId: id, studentId: record.studentId } },
          data: {
            status: record.status,
            note: record.note,
            method: AttendanceCaptureMethod.MANUAL,
            markedAt: new Date(),
            markedById: actorId,
          },
        })
      )
    );
    await tx.attendanceAudit.create({
      data: {
        tenantId,
        schoolId,
        sessionId: id,
        actorId,
        action: 'BULK_MARKED',
        metadata: { count: records.length },
      },
    });
  });
  return getSession({ id, tenantId, schoolId, actorId, roles });
}
