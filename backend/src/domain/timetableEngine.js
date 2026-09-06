const minutes = (value) => {
  const [hours, mins] = value.split(':').map(Number);
  return hours * 60 + mins;
};

export function validateTimeRange(startTime, endTime) {
  if (
    !/^\d{2}:\d{2}$/.test(startTime) ||
    !/^\d{2}:\d{2}$/.test(endTime) ||
    minutes(startTime) >= minutes(endTime)
  ) {
    throw new Error('Time slot must have a valid start and end time');
  }
}

export function validateTimetableSettings(settings) {
  const timeFields = [
    ['schoolStartsAt', settings.schoolStartsAt],
    ['schoolEndsAt', settings.schoolEndsAt],
    ['breakStartsAt', settings.breakStartsAt],
    ['breakEndsAt', settings.breakEndsAt],
    ['lunchStartsAt', settings.lunchStartsAt],
    ['lunchEndsAt', settings.lunchEndsAt],
  ];
  for (const [name, value] of timeFields) {
    if (value != null && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
      throw new Error(`${name} must use HH:MM format`);
    }
  }

  const start = minutes(settings.schoolStartsAt);
  const end = minutes(settings.schoolEndsAt);
  if (start >= end) throw new Error('School closing time must be after opening time');
  if (!Number.isInteger(settings.lessonDurationMinutes) || settings.lessonDurationMinutes <= 0) {
    throw new Error('Lesson duration must be greater than zero');
  }
  if (!Array.isArray(settings.workingDays) || settings.workingDays.length === 0) {
    throw new Error('At least one working day is required');
  }
  if (settings.workingDays.some((day) => !Number.isInteger(day) || day < 1 || day > 7)) {
    throw new Error('Working days must be weekday numbers from 1 to 7');
  }
  if (new Set(settings.workingDays).size !== settings.workingDays.length) {
    throw new Error('Working days cannot contain duplicates');
  }
  if (settings.allowSaturday && !settings.workingDays.includes(6)) {
    throw new Error('Saturday classes require Saturday in working days');
  }

  const blockedRanges = [
    ['break', settings.breakStartsAt, settings.breakEndsAt],
    ['lunch', settings.lunchStartsAt, settings.lunchEndsAt],
  ];
  for (const [label, blockedStart, blockedEnd] of blockedRanges) {
    if ((blockedStart && !blockedEnd) || (!blockedStart && blockedEnd)) {
      throw new Error(`${label} requires both start and end times`);
    }
    if (blockedStart && blockedEnd) {
      validateTimeRange(blockedStart, blockedEnd);
      if (minutes(blockedStart) < start || minutes(blockedEnd) > end) {
        throw new Error(`${label} must be within school hours`);
      }
    }
  }
  if (
    settings.breakStartsAt &&
    settings.lunchStartsAt &&
    minutes(settings.breakStartsAt) < minutes(settings.lunchEndsAt) &&
    minutes(settings.lunchStartsAt) < minutes(settings.breakEndsAt)
  ) {
    throw new Error('Break and lunch periods cannot overlap');
  }
  for (const [name, value] of [
    ['maxPeriodsPerDay', settings.maxPeriodsPerDay],
    ['maxTeacherPeriodsDay', settings.maxTeacherPeriodsDay],
    ['maxTeacherPeriodsWeek', settings.maxTeacherPeriodsWeek],
    ['maxConsecutivePeriods', settings.maxConsecutivePeriods],
  ]) {
    if (!Number.isInteger(value) || value <= 0)
      throw new Error(`${name} must be greater than zero`);
  }
  return settings;
}

export function generateTimetableSlots(settings) {
  validateTimetableSettings(settings);
  const slots = [];
  const schoolStart = minutes(settings.schoolStartsAt);
  const schoolEnd = minutes(settings.schoolEndsAt);
  const blocked = [
    ['BREAK', settings.breakStartsAt, settings.breakEndsAt],
    ['LUNCH', settings.lunchStartsAt, settings.lunchEndsAt],
  ]
    .filter(([, start, end]) => start && end)
    .map(([kind, start, end]) => ({ kind, start: minutes(start), end: minutes(end) }));

  for (const weekday of settings.workingDays) {
    let cursor = schoolStart;
    let period = 1;
    while (cursor < schoolEnd) {
      const blockedPeriod = blocked.find((item) => item.start <= cursor && cursor < item.end);
      if (blockedPeriod) {
        slots.push({
          weekday,
          startTime: formatMinutes(cursor),
          endTime: formatMinutes(blockedPeriod.end),
          label: blockedPeriod.kind === 'LUNCH' ? 'Lunch' : 'Break',
          isBreak: true,
          kind: blockedPeriod.kind,
        });
        cursor = blockedPeriod.end;
        continue;
      }
      const nextBlocked = blocked
        .filter((item) => item.start > cursor)
        .sort((a, b) => a.start - b.start)[0];
      const boundary = nextBlocked?.start ?? schoolEnd;
      const next = cursor + settings.lessonDurationMinutes;
      if (next > boundary || period > settings.maxPeriodsPerDay) {
        cursor = boundary;
        continue;
      }
      slots.push({
        weekday,
        startTime: formatMinutes(cursor),
        endTime: formatMinutes(next),
        label: `Period ${period}`,
        isBreak: false,
        kind: 'LESSON',
      });
      period += 1;
      cursor = next;
    }
  }
  return slots;
}

function formatMinutes(value) {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

export function validateSubjectPeriodCapacity(settings, requirements) {
  const slots = generateTimetableSlots(settings).filter((slot) => !slot.isBreak);
  const groups = new Map();
  for (const requirement of requirements) {
    const { periodsPerWeek, minimumPeriods = 0, maximumPeriods } = requirement;
    if (
      !Number.isInteger(periodsPerWeek) ||
      periodsPerWeek <= 0 ||
      !Number.isInteger(minimumPeriods) ||
      minimumPeriods < 0 ||
      (maximumPeriods != null &&
        (!Number.isInteger(maximumPeriods) || maximumPeriods < minimumPeriods)) ||
      periodsPerWeek < minimumPeriods ||
      (maximumPeriods != null && periodsPerWeek > maximumPeriods)
    ) {
      throw new Error(
        'Requested periods must be positive and within the minimum and maximum bounds'
      );
    }
    if (
      requirement.requiresDoublePeriod &&
      (!settings.allowDoublePeriods ||
        periodsPerWeek < 2 ||
        !slots.some(
          (slot, index) =>
            slots[index + 1]?.weekday === slot.weekday &&
            slots[index + 1]?.startTime === slot.endTime
        ))
    ) {
      throw new Error('Double periods require permission and two adjacent teaching slots');
    }
    const key = JSON.stringify([
      requirement.classId,
      requirement.academicYearId,
      requirement.termId,
    ]);
    const total = (groups.get(key) ?? 0) + periodsPerWeek;
    if (total > slots.length) {
      throw new Error(
        `Class ${requirement.classId} requests ${total} periods per week but generated timetable capacity is ${slots.length}`
      );
    }
    groups.set(key, total);
  }
  return { periodsPerWeek: slots.length };
}

export function detectTimetableConflicts(
  entries,
  slots,
  { roomCapacities = {}, classCapacities = {}, teacherAvailability = [] } = {}
) {
  const slotById = new Map(slots.map((slot) => [slot.id, slot]));
  const conflicts = [];
  for (const entry of entries) {
    const slot = slotById.get(entry.timeSlotId);
    if (!slot) {
      conflicts.push({
        entryId: entry.id,
        code: 'INVALID_TIME_SLOT',
        severity: 'HARD',
        message: 'Entry references an unknown time slot',
      });
      continue;
    }
    const entryRoomId = entry.roomId ?? entry.classroomId;
    if (entryRoomId && classCapacities[entry.classId] > roomCapacities[entryRoomId]) {
      conflicts.push({
        entryId: entry.id,
        code: 'ROOM_CAPACITY',
        severity: 'HARD',
        message: 'Room capacity is below class capacity',
      });
    }
    if (entry.teacherId && !['BREAK', 'FREE'].includes(entry.kind)) {
      try {
        const teachingSlots = getEntryTeachingSlots(entry, slots);
        if (
          teachingSlots.some(
            (teachingSlot) =>
              !evaluateTeacherAvailability(
                teachingSlot,
                teacherAvailability.filter((rule) => rule.teacherId === entry.teacherId)
              ).available
          )
        ) {
          conflicts.push({
            entryId: entry.id,
            code: 'TEACHER_UNAVAILABLE',
            severity: 'HARD',
            message: 'Teacher is unavailable for all or part of this lesson',
          });
        }
      } catch (error) {
        conflicts.push({
          entryId: entry.id,
          code: 'INVALID_LESSON_SPAN',
          severity: 'HARD',
          message: error.message,
        });
      }
    }
    for (const other of entries) {
      if (entry.id >= other.id || entry.timeSlotId !== other.timeSlotId) continue;
      if (entry.teacherId && entry.teacherId === other.teacherId)
        conflicts.push({
          entryId: entry.id,
          code: 'TEACHER_OVERLAP',
          severity: 'HARD',
          message: 'Teacher is assigned to overlapping entries',
        });
      if (entry.classId && entry.classId === other.classId)
        conflicts.push({
          entryId: entry.id,
          code: 'CLASS_OVERLAP',
          severity: 'HARD',
          message: 'Class is assigned to overlapping entries',
        });
      if (entryRoomId && entryRoomId === (other.roomId ?? other.classroomId))
        conflicts.push({
          entryId: entry.id,
          code: 'ROOM_OVERLAP',
          severity: 'HARD',
          message: 'Room is assigned to overlapping entries',
        });
    }
  }
  return [
    ...new Map(
      conflicts.map((conflict) => [`${conflict.entryId}:${conflict.code}`, conflict])
    ).values(),
  ];
}

export function canTransitionTimetable(from, to, conflicts = []) {
  const valid = {
    DRAFT: ['REVIEW', 'ARCHIVED'],
    REVIEW: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    PUBLISHED: ['LOCKED', 'ARCHIVED'],
    LOCKED: ['ARCHIVED'],
    ARCHIVED: [],
  };
  if (!valid[from]?.includes(to))
    throw new Error(`Invalid timetable transition from ${from} to ${to}`);
  if (
    to === 'PUBLISHED' &&
    conflicts.some((conflict) => conflict.severity === 'HARD' && !conflict.resolvedAt)
  )
    throw new Error('Hard timetable conflicts must be resolved before publication');
  return to;
}

// AVAILABLE windows form a weekly whitelist; UNAVAILABLE always takes precedence.
// Preferences are soft scores and never grant permission over a hard restriction.
export function evaluateTeacherAvailability(slot, rules = []) {
  const recurring = rules.filter((rule) => rule.isRecurring !== false);
  const windows = recurring.filter((rule) => rule.kind === 'AVAILABLE');
  const today = recurring.filter((rule) => rule.dayOfWeek === slot.weekday);
  const overlaps = (rule) => rule.startsAt < slot.endTime && slot.startTime < rule.endsAt;
  if (today.some((rule) => rule.kind === 'UNAVAILABLE' && overlaps(rule))) {
    return { available: false, preference: 0 };
  }
  if (windows.length) {
    let coveredUntil = slot.startTime;
    for (const rule of windows
      .filter((item) => item.dayOfWeek === slot.weekday)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))) {
      if (rule.startsAt > coveredUntil) break;
      if (rule.endsAt > coveredUntil) coveredUntil = rule.endsAt;
    }
    if (coveredUntil < slot.endTime) return { available: false, preference: 0 };
  }
  const preference = Math.max(
    0,
    ...today
      .filter(
        (rule) =>
          rule.kind === 'PREFERRED' &&
          rule.startsAt <= slot.startTime &&
          rule.endsAt >= slot.endTime
      )
      .map((rule) => rule.priority ?? 0)
  );
  return { available: true, preference };
}

export function scoreTimetableCandidate({
  slots,
  requirement,
  assignment,
  availability = [],
  dailyCounts = {},
}) {
  const day = slots[0].weekday;
  const duration = slots.length;
  const preference = Math.min(
    ...slots.map(
      (slot) =>
        evaluateTeacherAvailability(
          slot,
          availability.filter((rule) => rule.teacherId === assignment.teacherId)
        ).preference
    )
  );
  const subjectKey = `${requirement.classId}:${requirement.subjectId}:${day}`;
  const classKey = `${requirement.classId}:${day}`;
  const teacherKey = `${assignment.teacherId}:${day}`;
  const subjectToday = dailyCounts.subject?.[subjectKey] ?? 0;
  const preferredDaily = requirement.preferredPeriodsDay ?? 1;
  const abovePreferred = Math.max(0, subjectToday + duration - preferredDaily);
  return (
    abovePreferred * 10000 +
    subjectToday * 1000 +
    (dailyCounts.class?.[classKey] ?? 0) * 100 +
    (dailyCounts.teacher?.[teacherKey] ?? 0) * 50 -
    preference * 5
  );
}

export function getEntryTeachingSlots(entry, slots) {
  const first = slots.find((slot) => slot.id === entry.timeSlotId);
  const duration = entry.duration ?? 1;
  if (!first || first.isBreak || !Number.isInteger(duration) || duration < 1 || duration > 8) {
    throw new Error('Lesson must use between one and eight teaching slots');
  }
  const result = [first];
  while (result.length < duration) {
    const previous = result[result.length - 1];
    const next = slots.find(
      (slot) =>
        slot.weekday === first.weekday && slot.startTime === previous.endTime && !slot.isBreak
    );
    if (!next)
      throw new Error(
        'Lesson duration must fit adjacent teaching slots without crossing a break or day boundary'
      );
    result.push(next);
  }
  return result;
}
