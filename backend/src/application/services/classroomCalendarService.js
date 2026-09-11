import prisma from '../../infrastructure/orm/prismaClient.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';

const owned = ({ tenantId, schoolId }) => ({ tenantId, schoolId });
const admin = (access = {}) =>
  access.platformRole === 'OWNER' ||
  access.roles?.includes('PLATFORM_ADMIN') ||
  access.roles?.includes('SCHOOL_ADMIN');
const withinRange = (value, start, end) => value && value >= start && value <= end;

async function requireClassroom(scope, classroomId, userId, access) {
  const classroom = await prisma.digitalClassroom.findFirst({
    where: { id: classroomId, ...owned(scope), status: 'ACTIVE' },
    include: { memberships: { where: { userId, status: 'ACTIVE' } } },
  });
  if (!classroom) throw new NotFoundError('Digital classroom not found');
  if (admin(access) || classroom.ownerId === userId || classroom.memberships.length)
    return classroom;
  throw new AuthorizationError('You are not a member of this classroom');
}

export async function list(scope, classroomId, userId, access, start, end) {
  const classroom = await requireClassroom(scope, classroomId, userId, access);
  const [assignments, timetable] = await Promise.all([
    prisma.assignment.findMany({
      where: {
        ...owned(scope),
        classroomId,
        status: { in: ['PUBLISHED', 'CLOSED'] },
        OR: [{ availableAt: { gte: start, lte: end } }, { dueAt: { gte: start, lte: end } }],
      },
      orderBy: [{ availableAt: 'asc' }, { dueAt: 'asc' }],
    }),
    classroom.classId
      ? prisma.timetable.findFirst({
          where: { ...owned(scope), status: 'PUBLISHED' },
          orderBy: { publishedAt: 'desc' },
        })
      : null,
  ]);
  const assignmentEvents = assignments.flatMap((assignment) => [
    ...(withinRange(assignment.availableAt, start, end)
      ? [
          {
            id: `assignment-available-${assignment.id}`,
            type: 'ASSIGNMENT_AVAILABLE',
            startsAt: assignment.availableAt,
            assignmentId: assignment.id,
            title: assignment.title,
          },
        ]
      : []),
    ...(withinRange(assignment.dueAt, start, end)
      ? [
          {
            id: `assignment-due-${assignment.id}`,
            type: 'ASSIGNMENT_DUE',
            startsAt: assignment.dueAt,
            assignmentId: assignment.id,
            title: assignment.title,
          },
        ]
      : []),
  ]);
  if (!timetable || !classroom.classId) return assignmentEvents;
  const [entries, slots] = await Promise.all([
    prisma.scheduleEntry.findMany({
      where: { ...owned(scope), timetableId: timetable.id, classId: classroom.classId },
    }),
    prisma.timetableSlot.findMany({ where: { ...owned(scope), timetableId: timetable.id } }),
  ]);
  const slotById = new Map(slots.map((slot) => [slot.id, slot]));
  const lessonEvents = [];
  for (const entry of entries) {
    const slot = slotById.get(entry.timeSlotId);
    if (!slot || slot.isBreak) continue;
    for (let date = new Date(start); date <= end; date.setUTCDate(date.getUTCDate() + 1)) {
      const isoWeekday = date.getUTCDay() || 7;
      if (isoWeekday !== slot.weekday) continue;
      const startsAt = new Date(date);
      const [hours, minutes] = slot.startTime.split(':').map(Number);
      startsAt.setUTCHours(hours, minutes, 0, 0);
      lessonEvents.push({
        id: `lesson-${entry.id}-${startsAt.toISOString().slice(0, 10)}`,
        type: 'LESSON',
        startsAt,
        title: entry.subjectCode,
        scheduleEntryId: entry.id,
      });
    }
  }
  return [...assignmentEvents, ...lessonEvents].sort(
    (left, right) => new Date(left.startsAt) - new Date(right.startsAt)
  );
}
