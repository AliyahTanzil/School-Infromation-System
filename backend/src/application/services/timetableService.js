import prisma from '../../infrastructure/orm/prismaClient.js';
import {
  canTransitionTimetable,
  detectTimetableConflicts,
  validateTimeRange,
} from '../../domain/timetableEngine.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';
import ValidationError from '../../shared/errors/ValidationError.js';

const scopeWhere = ({ tenantId, schoolId }) => ({ tenantId, schoolId });
async function hydrate(row, db = prisma) {
  const [academicPeriod, slots, entries, conflicts, substitutions] = await Promise.all([
    db.academicTerm.findFirst({
      where: { id: row.academicPeriodId, academicYear: { tenantId: row.tenantId } },
    }),
    db.timetableSlot.findMany({
      where: { timetableId: row.id },
      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
    }),
    db.scheduleEntry.findMany({ where: { timetableId: row.id }, orderBy: { createdAt: 'asc' } }),
    db.schedulingConflict.findMany({
      where: { timetableId: row.id },
      orderBy: { createdAt: 'asc' },
    }),
    db.scheduleSubstitution.findMany({
      where: { timetableId: row.id },
      orderBy: { startsAt: 'asc' },
    }),
  ]);
  return { ...row, academicPeriod, slots, entries, conflicts, substitutions };
}
export async function listTimetables(scope) {
  const rows = await prisma.timetable.findMany({
    where: scopeWhere(scope),
    orderBy: { updatedAt: 'desc' },
  });
  return Promise.all(rows.map((row) => hydrate(row)));
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
  try {
    slots.forEach((slot) => validateTimeRange(slot.startTime, slot.endTime));
  } catch (error) {
    throw new ValidationError(error.message);
  }
  const period = await prisma.academicTerm.findFirst({
    where: { id: academicPeriodId, academicYear: { tenantId } },
  });
  if (!period) throw new NotFoundError('Academic period not found');
  return prisma.$transaction(async (tx) => {
    const row = await tx.timetable.create({
      data: { tenantId, schoolId, academicPeriodId, name, academicYear },
    });
    await tx.timetableSlot.createMany({
      data: slots.map((slot) => ({ ...slot, tenantId, schoolId, timetableId: row.id })),
    });
    await tx.timetableVersion.create({
      data: { timetableId: row.id, number: 1, snapshot: { slots }, createdBy: actorId },
    });
    await tx.timetableAudit.create({
      data: {
        tenantId,
        schoolId,
        timetableId: row.id,
        actorId,
        action: 'CREATED',
        metadata: { name },
      },
    });
    return hydrate(row, tx);
  });
}
export async function addEntry({ tenantId, schoolId, timetableId, actorId, data }) {
  const row = await prisma.timetable.findFirst({
    where: { id: timetableId, ...scopeWhere({ tenantId, schoolId }) },
  });
  if (!row) throw new NotFoundError('Timetable not found');
  if (!['DRAFT', 'REVIEW'].includes(row.status))
    throw new ValidationError('Timetable is not editable');
  const slot = await prisma.timetableSlot.findFirst({
    where: { id: data.timeSlotId, timetableId, tenantId, schoolId },
  });
  if (!slot) throw new ValidationError('Time slot does not belong to this timetable');
  const created = await prisma.scheduleEntry.create({
    data: { ...data, tenantId, schoolId, timetableId },
  });
  const [entries, slots] = await Promise.all([
    prisma.scheduleEntry.findMany({ where: { timetableId } }),
    prisma.timetableSlot.findMany({ where: { timetableId } }),
  ]);
  const conflicts = detectTimetableConflicts(entries, slots);
  await prisma.$transaction([
    prisma.schedulingConflict.deleteMany({ where: { timetableId } }),
    ...conflicts.map((conflict) =>
      prisma.schedulingConflict.create({ data: { ...conflict, tenantId, schoolId, timetableId } })
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
  return created;
}
export async function changeStatus({ tenantId, schoolId, timetableId, actorId, status }) {
  const row = await prisma.timetable.findFirst({
    where: { id: timetableId, ...scopeWhere({ tenantId, schoolId }) },
  });
  if (!row) throw new NotFoundError('Timetable not found');
  const [conflicts, entries, slots] = await Promise.all([
    prisma.schedulingConflict.findMany({ where: { timetableId } }),
    prisma.scheduleEntry.findMany({ where: { timetableId } }),
    prisma.timetableSlot.findMany({ where: { timetableId } }),
  ]);
  let next;
  try {
    next = canTransitionTimetable(row.status, status, conflicts);
  } catch (error) {
    throw new ValidationError(error.message);
  }
  return prisma.$transaction(async (tx) => {
    const version = row.version + 1;
    const updated = await tx.timetable.update({
      where: { id: timetableId },
      data: {
        status: next,
        version,
        ...(next === 'PUBLISHED' ? { publishedAt: new Date() } : {}),
        ...(next === 'LOCKED' ? { lockedAt: new Date() } : {}),
      },
    });
    await tx.timetableVersion.create({
      data: { timetableId, number: version, snapshot: { entries, slots }, createdBy: actorId },
    });
    await tx.timetableAudit.create({
      data: {
        tenantId,
        schoolId,
        timetableId,
        actorId,
        action: `STATUS_${next}`,
        metadata: { from: row.status, to: next },
      },
    });
    return hydrate(updated, tx);
  });
}
export async function createSubstitution({ tenantId, schoolId, timetableId, createdBy, ...data }) {
  const row = await prisma.timetable.findFirst({
    where: { id: timetableId, ...scopeWhere({ tenantId, schoolId }) },
  });
  if (!row) throw new NotFoundError('Timetable not found');
  if (row.status === 'ARCHIVED')
    throw new ValidationError('Archived timetables cannot accept substitutions');
  if (data.startsAt >= data.endsAt)
    throw new ValidationError('Substitution end must be after its start');
  const entry = await prisma.scheduleEntry.findFirst({
    where: { id: data.entryId, timetableId, tenantId, schoolId },
  });
  if (!entry) throw new ValidationError('Schedule entry does not belong to this timetable');
  return prisma.scheduleSubstitution.create({
    data: { tenantId, schoolId, timetableId, createdBy, ...data },
  });
}
