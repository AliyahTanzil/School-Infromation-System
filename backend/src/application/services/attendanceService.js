const AttendanceCaptureMethod = Object.freeze({ MANUAL: 'MANUAL' });
const AttendanceSessionStatus = Object.freeze({ OPEN: 'OPEN', LOCKED: 'LOCKED' });
import {
  assertAttendanceStatus,
  assertSessionTransition,
  assertWritableSession,
  summarizeAttendance,
} from '../../domain/attendanceLifecycle.js';
import prisma from '../../infrastructure/orm/prismaClient.js';

export async function listSessions({
  tenantId,
  schoolId,
  classId,
  status,
  dateFrom,
  dateTo,
  page = 1,
  pageSize = 25,
}) {
  const take = Math.min(Math.max(Number(pageSize) || 25, 1), 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
  const where = {
    tenantId,
    schoolId,
    ...(classId ? { classId } : {}),
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

export async function createSession({ tenantId, schoolId, createdById, ...input }) {
  const klass = await prisma.class.findFirst({
    where: { id: input.classId, tenantId, schoolId, deletedAt: null },
  });
  if (!klass) throw new Error('Class not found');
  return prisma.$transaction(async (tx) => {
    const session = await tx.attendanceSession.create({
      data: { tenantId, schoolId, createdById, ...input },
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

export async function getSession({ id, tenantId, schoolId }) {
  const session = await prisma.attendanceSession.findFirst({
    where: { id, tenantId, schoolId },
    include: {
      class: true,
      period: true,
      records: {
        include: { student: { include: { profile: true } } },
        orderBy: { student: { admissionNumber: 'asc' } },
      },
    },
  });
  if (!session) throw new Error('Attendance session not found');
  return { ...session, summary: summarizeAttendance(session.records) };
}

export async function changeStatus({ id, tenantId, schoolId, status, actorId, reason }) {
  const current = await prisma.attendanceSession.findFirst({ where: { id, tenantId, schoolId } });
  if (!current) throw new Error('Attendance session not found');
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

export async function markBulk({ id, tenantId, schoolId, actorId, records }) {
  const session = await prisma.attendanceSession.findFirst({ where: { id, tenantId, schoolId } });
  if (!session) throw new Error('Attendance session not found');
  assertWritableSession(session.status);
  records.forEach((record) => assertAttendanceStatus(record.status));
  return prisma.$transaction(async (tx) => {
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
    return getSession({ id, tenantId, schoolId });
  });
}
