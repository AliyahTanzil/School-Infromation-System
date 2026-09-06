import prisma from '../../infrastructure/orm/prismaClient.js';
import {
  canTransitionTimetable,
  detectTimetableConflicts,
  evaluateTeacherAvailability,
  scoreTimetableCandidate,
  teacherWorkloadIssue,
  generateTimetableSlots,
  validateTimeRange,
  validateTimetableSettings,
  validateSubjectPeriodCapacity,
} from '../../domain/timetableEngine.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';
import ValidationError from '../../shared/errors/ValidationError.js';
import { validateEntryTeacherAvailability } from './teacherAvailabilityService.js';
import { validateEntryRoom } from './timetableRoomService.js';

const scopeWhere = ({ tenantId, schoolId }) => ({ tenantId, schoolId });

export async function getTimetableOptions(scope) {
  const [school, academicYears, classes, subjects, teachers] = await Promise.all([
    prisma.school.findFirst({
      where: { id: scope.schoolId, tenantId: scope.tenantId },
      select: { id: true, name: true },
    }),
    prisma.academicYear.findMany({
      where: { tenantId: scope.tenantId },
      include: { terms: true },
      orderBy: { startsOn: 'desc' },
    }),
    prisma.class.findMany({
      where: { ...scopeWhere(scope), deletedAt: null },
      select: { id: true, name: true, academicYearId: true },
    }),
    prisma.subject.findMany({
      where: { ...scopeWhere(scope), deletedAt: null },
      select: { id: true, name: true, code: true },
    }),
    prisma.teacher.findMany({
      where: { ...scopeWhere(scope), deletedAt: null },
      select: { id: true, employeeNumber: true, profile: true },
      orderBy: { employeeNumber: 'asc' },
    }),
  ]);
  return { school, academicYears, classes, subjects, teachers };
}

const defaultSettings = {
  workingDays: [1, 2, 3, 4, 5],
  schoolStartsAt: '08:00',
  schoolEndsAt: '16:00',
  lessonDurationMinutes: 60,
  breakStartsAt: null,
  breakEndsAt: null,
  lunchStartsAt: null,
  lunchEndsAt: null,
  maxPeriodsPerDay: 8,
  maxTeacherPeriodsDay: 6,
  maxTeacherPeriodsWeek: 30,
  maxConsecutivePeriods: 3,
  allowDoublePeriods: false,
  allowSaturday: false,
};

export async function getTimetableSettings(scope) {
  const row = await prisma.timetableSettings.findUnique({
    where: { tenantId_schoolId: scopeWhere(scope) },
  });
  return row || { ...defaultSettings, ...scope };
}

export async function upsertTimetableSettings({ tenantId, schoolId, ...input }) {
  const settings = { ...defaultSettings, ...input };
  try {
    validateTimetableSettings(settings);
  } catch (error) {
    throw new ValidationError(error.message);
  }
  return prisma.$transaction(
    async (tx) => {
      const requirements = await tx.subjectPeriodRequirement.findMany({
        where: { tenantId, schoolId },
      });
      checkSubjectCapacity(settings, requirements);
      return tx.timetableSettings.upsert({
        where: { tenantId_schoolId: { tenantId, schoolId } },
        create: { tenantId, schoolId, ...settings },
        update: settings,
      });
    },
    { isolationLevel: 'Serializable' }
  );
}

function checkSubjectCapacity(settings, requirements) {
  try {
    return validateSubjectPeriodCapacity(settings, requirements);
  } catch (error) {
    throw new ValidationError(error.message);
  }
}

const subjectPeriodInclude = { subject: true, class: true, academicYear: true, term: true };

export async function listSubjectPeriodRequirements(scope, filters = {}) {
  const where = scopeWhere(scope);
  for (const key of ['subjectId', 'classId', 'academicYearId', 'termId']) {
    if (filters[key]) where[key] = filters[key];
  }
  return prisma.subjectPeriodRequirement.findMany({
    where,
    include: subjectPeriodInclude,
    orderBy: [{ classId: 'asc' }, { subjectId: 'asc' }],
  });
}

async function saveSubjectPeriodRequirement({ tenantId, schoolId, id, ...input }) {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const scope = { tenantId, schoolId };
        const existing = id
          ? await tx.subjectPeriodRequirement.findFirst({ where: { id, ...scope } })
          : null;
        if (id && !existing) throw new NotFoundError('Subject period requirement not found');
        const merged = { ...existing, ...input };
        const [subject, academicClass, year, term] = await Promise.all([
          tx.subject.findFirst({ where: { id: merged.subjectId, ...scope, deletedAt: null } }),
          tx.class.findFirst({ where: { id: merged.classId, ...scope, deletedAt: null } }),
          tx.academicYear.findFirst({ where: { id: merged.academicYearId, tenantId } }),
          tx.academicTerm.findFirst({
            where: {
              id: merged.termId,
              academicYearId: merged.academicYearId,
              academicYear: { tenantId },
            },
          }),
        ]);
        if (!subject) throw new NotFoundError('Subject not found in this school');
        if (!academicClass) throw new NotFoundError('Class not found in this school');
        if (!year) throw new NotFoundError('Academic year not found');
        if (!term) throw new ValidationError('Academic term does not belong to the selected year');
        const settings =
          (await tx.timetableSettings.findUnique({ where: { tenantId_schoolId: scope } })) ??
          defaultSettings;
        const requirements = await tx.subjectPeriodRequirement.findMany({
          where: {
            ...scope,
            classId: merged.classId,
            academicYearId: merged.academicYearId,
            termId: merged.termId,
            ...(id ? { id: { not: id } } : {}),
          },
        });
        checkSubjectCapacity(settings, [...requirements, merged]);
        return id
          ? tx.subjectPeriodRequirement.update({
              where: { id },
              data: input,
              include: subjectPeriodInclude,
            })
          : tx.subjectPeriodRequirement.create({
              data: { ...input, ...scope },
              include: subjectPeriodInclude,
            });
      },
      { isolationLevel: 'Serializable' }
    );
  } catch (error) {
    if (error.code === 'P2002')
      throw new ValidationError(
        'A requirement already exists for this subject, class, year and term'
      );
    if (error.code === 'P2034')
      throw new ValidationError('Timetable requirements changed concurrently; retry this request');
    throw error;
  }
}

export const createSubjectPeriodRequirement = (input) => saveSubjectPeriodRequirement(input);
export const updateSubjectPeriodRequirement = (input) => saveSubjectPeriodRequirement(input);
export async function removeSubjectPeriodRequirement({ tenantId, schoolId, id }) {
  const result = await prisma.subjectPeriodRequirement.deleteMany({
    where: { tenantId, schoolId, id },
  });
  if (!result.count) throw new NotFoundError('Subject period requirement not found');
}

export async function generateSlotsFromSettings(scope) {
  const settings = await getTimetableSettings(scope);
  try {
    return generateTimetableSlots(settings);
  } catch (error) {
    throw new ValidationError(error.message);
  }
}

export async function generateSlotsForTimetable({ tenantId, schoolId, timetableId, actorId }) {
  const timetable = await prisma.timetable.findFirst({
    where: { id: timetableId, ...scopeWhere({ tenantId, schoolId }) },
  });
  if (!timetable) throw new NotFoundError('Timetable not found');
  if (!['DRAFT', 'REVIEW'].includes(timetable.status)) {
    throw new ValidationError('Only draft or review timetables can regenerate slots');
  }

  const entryCount = await prisma.scheduleEntry.count({ where: { timetableId } });
  if (entryCount > 0) {
    throw new ValidationError('Remove existing schedule entries before regenerating slots');
  }

  const settings = await getTimetableSettings({ tenantId, schoolId });
  let slots;
  try {
    slots = generateTimetableSlots(settings);
  } catch (error) {
    throw new ValidationError(error.message);
  }

  return prisma.$transaction(async (tx) => {
    await tx.timetableSlot.deleteMany({ where: { timetableId } });
    await tx.timetableSlot.createMany({
      data: slots.map((slot) => ({
        tenantId,
        schoolId,
        timetableId,
        weekday: slot.weekday,
        startTime: slot.startTime,
        endTime: slot.endTime,
        label: slot.label,
        isBreak: slot.isBreak,
      })),
    });
    await tx.timetableAudit.create({
      data: {
        tenantId,
        schoolId,
        timetableId,
        actorId,
        action: 'SLOTS_GENERATED',
        metadata: { slotCount: slots.length },
      },
    });
    return slots;
  });
}

async function validateTeachingAssignmentScope({
  tenantId,
  schoolId,
  teacherId,
  subjectId,
  classId,
  academicYearId,
  termId,
}) {
  const [teacher, subject, academicClass, academicYear, term] = await Promise.all([
    prisma.teacher.findFirst({ where: { id: teacherId, tenantId, schoolId, deletedAt: null } }),
    prisma.subject.findFirst({ where: { id: subjectId, tenantId, schoolId, deletedAt: null } }),
    prisma.class.findFirst({ where: { id: classId, tenantId, schoolId, deletedAt: null } }),
    prisma.academicYear.findFirst({ where: { id: academicYearId, tenantId } }),
    prisma.academicTerm.findFirst({ where: { id: termId, academicYear: { tenantId } } }),
  ]);
  if (!teacher) throw new NotFoundError('Teacher not found in this school');
  if (!subject) throw new NotFoundError('Subject not found in this school');
  if (!academicClass) throw new NotFoundError('Class not found in this school');
  if (!academicYear) throw new NotFoundError('Academic year not found');
  if (!term || term.academicYearId !== academicYearId) {
    throw new ValidationError('Academic term does not belong to the selected year');
  }
}

export async function listTeachingAssignments(scope, filters = {}) {
  return prisma.teacherTeachingAssignment.findMany({
    where: {
      ...scopeWhere(scope),
      ...(filters.teacherId ? { teacherId: filters.teacherId } : {}),
      ...(filters.classId ? { classId: filters.classId } : {}),
      ...(filters.academicYearId ? { academicYearId: filters.academicYearId } : {}),
      ...(filters.termId ? { termId: filters.termId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    },
    include: {
      teacher: { include: { profile: true } },
      subject: true,
      class: true,
      academicYear: true,
      term: true,
    },
    orderBy: [{ teacherId: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function createTeachingAssignment({ tenantId, schoolId, ...input }) {
  await validateTeachingAssignmentScope({ tenantId, schoolId, ...input });
  const assignment = await prisma.teacherTeachingAssignment.create({
    data: { tenantId, schoolId, ...input },
    include: {
      teacher: { include: { profile: true } },
      subject: true,
      class: true,
      academicYear: true,
      term: true,
    },
  });
  return assignment;
}

export async function updateTeachingAssignment({ tenantId, schoolId, id, ...input }) {
  const existing = await prisma.teacherTeachingAssignment.findFirst({
    where: { id, ...scopeWhere({ tenantId, schoolId }) },
  });
  if (!existing) throw new NotFoundError('Teaching assignment not found');
  await validateTeachingAssignmentScope({ tenantId, schoolId, ...input });
  return prisma.teacherTeachingAssignment.update({
    where: { id },
    data: input,
    include: {
      teacher: { include: { profile: true } },
      subject: true,
      class: true,
      academicYear: true,
      term: true,
    },
  });
}

export async function removeTeachingAssignment({ tenantId, schoolId, id }) {
  const existing = await prisma.teacherTeachingAssignment.findFirst({
    where: { id, ...scopeWhere({ tenantId, schoolId }) },
    select: { id: true },
  });
  if (!existing) throw new NotFoundError('Teaching assignment not found');
  return prisma.teacherTeachingAssignment.delete({ where: { id } });
}

export async function getTeacherWorkload(scope, teacherId, filters = {}) {
  const assignments = await listTeachingAssignments(scope, { ...filters, teacherId });
  const totalPeriods = assignments.reduce((sum, item) => sum + item.periodsPerWeek, 0);
  const bySubject = Object.values(
    assignments.reduce((groups, item) => {
      const key = item.subjectId;
      groups[key] ??= { subjectId: key, subject: item.subject, periodsPerWeek: 0, classes: [] };
      groups[key].periodsPerWeek += item.periodsPerWeek;
      groups[key].classes.push({
        id: item.classId,
        name: item.class.name,
        periodsPerWeek: item.periodsPerWeek,
      });
      return groups;
    }, {})
  );
  return {
    teacherId,
    totalPeriodsPerWeek: totalPeriods,
    assignmentCount: assignments.length,
    subjects: bySubject,
    assignments,
  };
}
async function hydrate(row, db = prisma) {
  const [academicPeriod, slots, entries, conflicts, substitutions] = await Promise.all([
    db.academicTerm.findFirst({
      where: { id: row.academicPeriodId, academicYear: { tenantId: row.tenantId } },
    }),
    db.timetableSlot.findMany({
      where: { timetableId: row.id },
      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
    }),
    db.scheduleEntry.findMany({
      where: { timetableId: row.id },
      include: { timeSlot: true, class: true, room: true, subject: true },
      orderBy: { createdAt: 'asc' },
    }),
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
  return prisma.$transaction(
    async (tx) => {
      const row = await tx.timetable.findFirst({
        where: { id: timetableId, ...scopeWhere({ tenantId, schoolId }) },
      });
      if (!row) throw new NotFoundError('Timetable not found');
      if (!['DRAFT', 'REVIEW'].includes(row.status))
        throw new ValidationError('Timetable is not editable');
      const slots = await tx.timetableSlot.findMany({ where: { timetableId, tenantId, schoolId } });
      const slot = slots.find((item) => item.id === data.timeSlotId);
      if (!slot) throw new ValidationError('Time slot does not belong to this timetable');
      await validateEntryTeacherAvailability(tx, { tenantId, schoolId }, data, slots);
      await validateEntryRoom(tx, { tenantId, schoolId }, data, slots, timetableId);
      const created = await tx.scheduleEntry.create({
        data: { ...data, tenantId, schoolId, timetableId },
      });
      const entries = await tx.scheduleEntry.findMany({ where: { timetableId } });
      const teacherAvailability = await tx.teacherAvailability.findMany({
        where: {
          teacherId: { in: entries.map((entry) => entry.teacherId).filter(Boolean) },
          teacher: { tenantId, schoolId },
        },
      });
      const conflicts = detectTimetableConflicts(entries, slots, { teacherAvailability });
      await tx.schedulingConflict.deleteMany({ where: { timetableId } });
      for (const conflict of conflicts) {
        await tx.schedulingConflict.create({
          data: { ...conflict, tenantId, schoolId, timetableId },
        });
      }
      await tx.timetableAudit.create({
        data: {
          tenantId,
          schoolId,
          timetableId,
          actorId,
          action: 'ENTRY_ADDED',
          metadata: { entryId: created.id, conflicts: conflicts.length },
        },
      });
      return created;
    },
    { isolationLevel: 'Serializable' }
  );
}

export async function generateCompleteSchedule({ tenantId, schoolId, timetableId, actorId }) {
  return prisma.$transaction(
    async (tx) => {
      const scope = { tenantId, schoolId };
      const timetable = await tx.timetable.findFirst({ where: { id: timetableId, ...scope } });
      if (!timetable) throw new NotFoundError('Timetable not found');
      if (timetable.status !== 'DRAFT')
        throw new ValidationError('Only draft timetables can be generated');
      if (await tx.scheduleEntry.count({ where: { timetableId } })) {
        throw new ValidationError('Automatic generation requires an empty timetable draft');
      }
      const [slots, requirements, assignments, rooms, availability, savedSettings] =
        await Promise.all([
          tx.timetableSlot.findMany({
            where: { timetableId, ...scope },
            orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
          }),
          tx.subjectPeriodRequirement.findMany({
            where: { ...scope, termId: timetable.academicPeriodId },
            include: { subject: true, class: true },
            orderBy: [{ classId: 'asc' }, { subjectId: 'asc' }],
          }),
          tx.teacherTeachingAssignment.findMany({
            where: { ...scope, termId: timetable.academicPeriodId, status: 'ACTIVE' },
            orderBy: { id: 'asc' },
          }),
          tx.timetableRoom.findMany({
            where: { ...scope, isActive: true },
            orderBy: [{ capacity: 'asc' }, { code: 'asc' }],
          }),
          tx.teacherAvailability.findMany({ where: { teacher: { ...scope, deletedAt: null } } }),
          tx.timetableSettings.findUnique({ where: { tenantId_schoolId: scope } }),
        ]);
      const settings = { ...defaultSettings, ...savedSettings };
      if (!requirements.length)
        throw new ValidationError('No subject period requirements exist for this timetable term');
      const teachingSlots = slots.filter((slot) => !slot.isBreak);
      const occupied = { class: new Set(), teacher: new Set(), room: new Set() };
      const dailyCounts = { subject: {}, class: {}, teacher: {} };
      const teacherSlots = new Map();
      const entries = [];
      const issues = [];
      const slotKeys = (slotList, id) => slotList.map((slot) => `${id}:${slot.id}`);
      const free = (slotList, assignment, room) =>
        slotKeys(slotList, assignment.classId).every((key) => !occupied.class.has(key)) &&
        slotKeys(slotList, assignment.teacherId).every((key) => !occupied.teacher.has(key)) &&
        slotKeys(slotList, room.id).every((key) => !occupied.room.has(key)) &&
        slotList.every(
          (slot) =>
            evaluateTeacherAvailability(
              slot,
              availability.filter((rule) => rule.teacherId === assignment.teacherId)
            ).available
        );

      for (const requirement of requirements) {
        const assignment = assignments.find(
          (item) => item.classId === requirement.classId && item.subjectId === requirement.subjectId
        );
        if (!assignment) {
          issues.push(
            `${requirement.class.name}: ${requirement.subject.name} has no active teacher assignment`
          );
          continue;
        }
        const room = rooms.find(
          (item) =>
            item.capacity >= requirement.class.capacity &&
            (!requirement.requiresLaboratory || item.kind === 'LABORATORY')
        );
        if (!room) {
          issues.push(
            `${requirement.class.name}: ${requirement.subject.name} has no suitable active room`
          );
          continue;
        }
        let remaining = requirement.periodsPerWeek;
        while (remaining > 0) {
          const duration = requirement.requiresDoublePeriod && remaining >= 2 ? 2 : 1;
          const candidates = [];
          const workloadIssues = new Set();
          for (let index = 0; index < teachingSlots.length; index += 1) {
            const span = teachingSlots.slice(index, index + duration);
            if (
              span.length !== duration ||
              span.some((slot) => slot.weekday !== span[0].weekday) ||
              span.some((slot, offset) => offset > 0 && slot.startTime !== span[offset - 1].endTime)
            )
              continue;
            if (!free(span, assignment, room)) continue;
            const workloadIssue = teacherWorkloadIssue({
              scheduledSlots: teacherSlots.get(assignment.teacherId) ?? [],
              candidateSlots: span,
              settings,
            });
            if (workloadIssue) workloadIssues.add(workloadIssue);
            else candidates.push(span);
          }
          candidates.sort(
            (left, right) =>
              scoreTimetableCandidate({
                slots: left,
                requirement,
                assignment,
                availability,
                dailyCounts,
              }) -
                scoreTimetableCandidate({
                  slots: right,
                  requirement,
                  assignment,
                  availability,
                  dailyCounts,
                }) ||
              left[0].weekday - right[0].weekday ||
              left[0].startTime.localeCompare(right[0].startTime)
          );
          const choice = candidates[0];
          if (!choice) {
            issues.push(
              `${requirement.class.name}: ${requirement.subject.name} cannot place ${remaining} remaining period(s)${workloadIssues.size ? ` (${[...workloadIssues].join(', ')})` : ''}`
            );
            break;
          }
          for (const key of slotKeys(choice, assignment.classId)) occupied.class.add(key);
          for (const key of slotKeys(choice, assignment.teacherId)) occupied.teacher.add(key);
          teacherSlots.set(assignment.teacherId, [
            ...(teacherSlots.get(assignment.teacherId) ?? []),
            ...choice,
          ]);
          for (const key of slotKeys(choice, room.id)) occupied.room.add(key);
          const day = choice[0].weekday;
          const countKeys = {
            subject: `${requirement.classId}:${requirement.subjectId}:${day}`,
            class: `${assignment.classId}:${day}`,
            teacher: `${assignment.teacherId}:${day}`,
          };
          for (const [group, key] of Object.entries(countKeys))
            dailyCounts[group][key] = (dailyCounts[group][key] ?? 0) + duration;
          entries.push({
            tenantId,
            schoolId,
            timetableId,
            timeSlotId: choice[0].id,
            classId: assignment.classId,
            teacherId: assignment.teacherId,
            subjectId: assignment.subjectId,
            roomId: room.id,
            teachingAssignmentId: assignment.id,
            subjectCode: requirement.subject.code,
            kind:
              duration === 2 ? 'DOUBLE' : requirement.requiresLaboratory ? 'LABORATORY' : 'LESSON',
            duration,
          });
          remaining -= duration;
        }
      }
      if (issues.length)
        throw new ValidationError(`Timetable is not feasible: ${issues.join('; ')}`);
      await tx.scheduleEntry.createMany({ data: entries });
      await tx.timetableAudit.create({
        data: {
          tenantId,
          schoolId,
          timetableId,
          actorId,
          action: 'SCHEDULE_GENERATED',
          metadata: {
            entries: entries.length,
            periods: entries.reduce((sum, item) => sum + item.duration, 0),
          },
        },
      });
      return hydrate(timetable, tx);
    },
    { isolationLevel: 'Serializable' }
  );
}
export async function changeStatus({ tenantId, schoolId, timetableId, actorId, status }) {
  return prisma.$transaction(
    async (tx) => {
      const row = await tx.timetable.findFirst({
        where: { id: timetableId, ...scopeWhere({ tenantId, schoolId }) },
      });
      if (!row) throw new NotFoundError('Timetable not found');
      const [conflicts, entries, slots] = await Promise.all([
        tx.schedulingConflict.findMany({ where: { timetableId } }),
        tx.scheduleEntry.findMany({ where: { timetableId } }),
        tx.timetableSlot.findMany({ where: { timetableId } }),
      ]);
      if (status === 'PUBLISHED' || status === 'LOCKED') {
        for (const entry of entries) {
          await validateEntryTeacherAvailability(tx, { tenantId, schoolId }, entry, slots);
          await validateEntryRoom(tx, { tenantId, schoolId }, entry, slots, timetableId);
        }
      }
      let next;
      try {
        next = canTransitionTimetable(row.status, status, conflicts);
      } catch (error) {
        throw new ValidationError(error.message);
      }
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
    },
    { isolationLevel: 'Serializable' }
  );
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
