import prisma from '../../infrastructure/orm/prismaClient.js';
import {
  canTransitionTimetable,
  detectTimetableConflicts,
  validateTimeRange,
} from '../../domain/timetableEngine.js';

const scopeWhere = ({ tenantId, schoolId }) => ({ tenantId, schoolId });

export async function listTimetables(scope) {
  return prisma.timetable.findMany({
    where: scopeWhere(scope),
    include: { academicPeriod: true, slots: true, entries: true, conflicts: true },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function createTimetable({
  tenantId,
  schoolId,
  actorId,
  academicPeriodId,
  name,
  academicYear,
  slots,
}) {
  slots.forEach((slot) => validateTimeRange(slot.startTime, slot.endTime));
  const period = await prisma.academicPeriod.findFirst({
    where: { id: academicPeriodId, ...scopeWhere({ tenantId, schoolId }) },
  });
  if (!period) throw new Error('Academic period not found');
  return prisma.timetable.create({
    data: {
      tenantId,
      schoolId,
      academicPeriodId,
      name,
      academicYear,
      slots: { create: slots },
      versions: { create: { number: 1, snapshot: { slots }, createdBy: actorId } },
      audits: { create: { tenantId, schoolId, actorId, action: 'CREATED', metadata: { name } } },
    },
    include: { slots: true, entries: true, conflicts: true },
  });
}

export async function addEntry({ tenantId, schoolId, timetableId, actorId, data }) {
  const timetable = await prisma.timetable.findFirst({
    where: { id: timetableId, ...scopeWhere({ tenantId, schoolId }) },
    include: { slots: true, entries: true },
  });
  if (!timetable) throw new Error('Timetable not found');
  if (['PUBLISHED', 'LOCKED', 'ARCHIVED'].includes(timetable.status))
    throw new Error('Timetable is not editable');
  const created = await prisma.scheduleEntry.create({
    data: { ...data, tenantId, schoolId, timetableId },
  });
  const entries = [...timetable.entries, created];
  const conflicts = detectTimetableConflicts(entries, timetable.slots);
  await prisma.$transaction([
    prisma.schedulingConflict.deleteMany({ where: { timetableId } }),
    ...conflicts.map((conflict) =>
      prisma.schedulingConflict.create({
        data: {
          tenantId,
          schoolId,
          timetableId,
          entryId: conflict.entryId,
          code: conflict.code,
          severity: conflict.severity,
          message: conflict.message,
        },
      })
    ),
    prisma.timetableAudit.create({
      data: {
        tenantId,
        schoolId,
        timetableId,
        actorId,
        action: 'ENTRY_ADDED',
        metadata: { entryId: created.id, conflicts: conflicts.length },
      },
    }),
  ]);
  return prisma.scheduleEntry.findUnique({
    where: { id: created.id },
    include: {
      timeSlot: true,
      class: true,
      teacher: { include: { profile: true } },
      classroom: true,
    },
  });
}

export async function changeStatus({ tenantId, schoolId, timetableId, actorId, status }) {
  const timetable = await prisma.timetable.findFirst({
    where: { id: timetableId, ...scopeWhere({ tenantId, schoolId }) },
    include: { conflicts: true, entries: true, slots: true },
  });
  if (!timetable) throw new Error('Timetable not found');
  const next = canTransitionTimetable(timetable.status, status, timetable.conflicts);
  return prisma.$transaction(async (tx) => {
    const updated = await tx.timetable.update({
      where: { id: timetableId },
      data: {
        status: next,
        ...(next === 'PUBLISHED' ? { publishedAt: new Date() } : {}),
        ...(next === 'LOCKED' ? { lockedAt: new Date() } : {}),
      },
    });
    await tx.timetableVersion.create({
      data: {
        timetableId,
        number: updated.version + 1,
        snapshot: { entries: timetable.entries, slots: timetable.slots },
        createdBy: actorId,
      },
    });
    await tx.timetableAudit.create({
      data: {
        tenantId,
        schoolId,
        timetableId,
        actorId,
        action: `STATUS_${next}`,
        metadata: { from: timetable.status, to: next },
      },
    });
    return updated;
  });
}

export async function createSubstitution({ tenantId, schoolId, timetableId, createdBy, ...data }) {
  const timetable = await prisma.timetable.findFirst({
    where: { id: timetableId, ...scopeWhere({ tenantId, schoolId }) },
  });
  if (!timetable || timetable.status === 'ARCHIVED')
    throw new Error('Timetable not found or archived');
  return prisma.scheduleSubstitution.create({
    data: { tenantId, schoolId, timetableId, createdBy, ...data },
  });
}
