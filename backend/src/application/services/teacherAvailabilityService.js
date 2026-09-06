import prisma from '../../infrastructure/orm/prismaClient.js';
import {
  evaluateTeacherAvailability,
  getEntryTeachingSlots,
  validateTimeRange,
} from '../../domain/timetableEngine.js';
import { teacherAvailabilityBody } from '../validators/timetableValidators.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';
import ValidationError from '../../shared/errors/ValidationError.js';

async function requireTeacher(db, { tenantId, schoolId }, teacherId) {
  const teacher = await db.teacher.findFirst({
    where: { id: teacherId, tenantId, schoolId, deletedAt: null },
  });
  if (!teacher) throw new NotFoundError('Teacher not found in this school');
}

export async function listTeacherAvailability(scope, teacherId) {
  await requireTeacher(prisma, scope, teacherId);
  return prisma.teacherAvailability.findMany({
    where: { teacherId },
    orderBy: [{ dayOfWeek: 'asc' }, { startsAt: 'asc' }, { id: 'asc' }],
  });
}

export function assertEntryAvailability(entry, slots, rules) {
  if (!entry.teacherId || ['BREAK', 'FREE'].includes(entry.kind)) return;
  let span;
  try {
    span = getEntryTeachingSlots(entry, slots);
  } catch (error) {
    throw new ValidationError(error.message);
  }
  if (span.some((slot) => !evaluateTeacherAvailability(slot, rules).available)) {
    throw new ValidationError('Teacher is unavailable for all or part of this lesson');
  }
}

export async function validateEntryTeacherAvailability(db, scope, entry, slots) {
  if (!entry.teacherId) return;
  await requireTeacher(db, scope, entry.teacherId);
  const rules = await db.teacherAvailability.findMany({ where: { teacherId: entry.teacherId } });
  assertEntryAvailability(entry, slots, rules);
}

async function mutateAvailability({ tenantId, schoolId, teacherId, id, ...input }, remove = false) {
  try {
    return await prisma.$transaction(
      async (tx) => {
        await requireTeacher(tx, { tenantId, schoolId }, teacherId);
        const existing = id
          ? await tx.teacherAvailability.findFirst({ where: { id, teacherId } })
          : null;
        if (id && !existing) throw new NotFoundError('Teacher availability not found');
        let data;
        if (!remove) {
          const parsed = teacherAvailabilityBody.safeParse({ ...existing, ...input });
          if (!parsed.success)
            throw new ValidationError('Invalid weekly availability rule', parsed.error.issues);
          data = parsed.data;
          try {
            validateTimeRange(data.startsAt, data.endsAt);
          } catch (error) {
            throw new ValidationError(error.message);
          }
        }
        const rules = await tx.teacherAvailability.findMany({ where: { teacherId } });
        const proposed = rules.filter((rule) => rule.id !== id);
        if (!remove) proposed.push(data);
        const entries = await tx.scheduleEntry.findMany({
          where: { tenantId, schoolId, teacherId, timetable: { status: { not: 'ARCHIVED' } } },
          include: { timetable: { include: { slots: true } } },
        });
        for (const entry of entries) {
          assertEntryAvailability(entry, entry.timetable.slots, proposed);
        }
        if (remove) return tx.teacherAvailability.delete({ where: { id } });
        return id
          ? tx.teacherAvailability.update({ where: { id }, data })
          : tx.teacherAvailability.create({ data: { ...data, teacherId } });
      },
      { isolationLevel: 'Serializable' }
    );
  } catch (error) {
    if (error.code === 'P2034')
      throw new ValidationError(
        'Teacher availability or timetable changed concurrently; retry this request'
      );
    throw error;
  }
}

export const createTeacherAvailability = (input) => mutateAvailability({ ...input, id: undefined });
export const updateTeacherAvailability = (input) => mutateAvailability(input);
export const removeTeacherAvailability = (input) => mutateAvailability(input, true);
