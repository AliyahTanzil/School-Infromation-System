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

export function detectTimetableConflicts(
  entries,
  slots,
  { roomCapacities = {}, classCapacities = {} } = {}
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
    if (entry.classroomId && classCapacities[entry.classId] > roomCapacities[entry.classroomId]) {
      conflicts.push({
        entryId: entry.id,
        code: 'ROOM_CAPACITY',
        severity: 'HARD',
        message: 'Room capacity is below class capacity',
      });
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
      if (entry.classroomId && entry.classroomId === other.classroomId)
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
