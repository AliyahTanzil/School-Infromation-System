import prisma from '../../infrastructure/orm/prismaClient.js';
import { timetableRoomBody } from '../validators/timetableValidators.js';
import ValidationError from '../../shared/errors/ValidationError.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';
import { getEntryTeachingSlots } from '../../domain/timetableEngine.js';

const scopeWhere = ({ tenantId, schoolId }) => ({ tenantId, schoolId });
export const listTimetableRooms = (scope) =>
  prisma.timetableRoom.findMany({ where: scopeWhere(scope), orderBy: { name: 'asc' } });

async function saveRoom({ tenantId, schoolId, id, ...input }) {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const existing = id
          ? await tx.timetableRoom.findFirst({ where: { id, tenantId, schoolId } })
          : null;
        if (id && !existing) throw new NotFoundError('Timetable room not found');
        const parsed = timetableRoomBody.safeParse({ ...existing, ...input });
        if (!parsed.success) throw new ValidationError('Invalid room details', parsed.error.issues);
        const data = parsed.data;
        if (id) {
          const entries = await tx.scheduleEntry.findMany({
            where: { roomId: id, timetable: { status: { not: 'ARCHIVED' } } },
            include: { class: true },
          });
          if (
            entries.some(
              (entry) =>
                !data.isActive ||
                (entry.class && entry.class.capacity > data.capacity) ||
                (['LABORATORY', 'PRACTICAL'].includes(entry.kind) && data.kind !== 'LABORATORY')
            )
          ) {
            throw new ValidationError('Room changes would invalidate existing lessons');
          }
        }
        return id
          ? tx.timetableRoom.update({ where: { id }, data })
          : tx.timetableRoom.create({ data: { ...data, tenantId, schoolId } });
      },
      { isolationLevel: 'Serializable' }
    );
  } catch (error) {
    if (error.code === 'P2002')
      throw new ValidationError('A room with this code already exists in this school');
    if (error.code === 'P2034')
      throw new ValidationError('Room or timetable changed concurrently; retry this request');
    throw error;
  }
}
export const createTimetableRoom = (input) => saveRoom({ ...input, id: undefined });
export const updateTimetableRoom = (input) => saveRoom(input);
export async function removeTimetableRoom({ tenantId, schoolId, id }) {
  return prisma.$transaction(
    async (tx) => {
      const room = await tx.timetableRoom.findFirst({ where: { id, tenantId, schoolId } });
      if (!room) throw new NotFoundError('Timetable room not found');
      if (await tx.scheduleEntry.count({ where: { roomId: id } }))
        throw new ValidationError(
          'Rooms referenced by timetables cannot be deleted; deactivate unused rooms instead'
        );
      return tx.timetableRoom.delete({ where: { id } });
    },
    { isolationLevel: 'Serializable' }
  );
}

export async function validateEntryRoom(db, scope, entry, slots, timetableId) {
  if (!entry.roomId) return;
  const room = await db.timetableRoom.findFirst({
    where: { id: entry.roomId, ...scopeWhere(scope) },
  });
  if (!room) throw new NotFoundError('Timetable room not found in this school');
  if (!room.isActive) throw new ValidationError('Room is inactive');
  if (['LABORATORY', 'PRACTICAL'].includes(entry.kind) && room.kind !== 'LABORATORY')
    throw new ValidationError('Practical lessons require a laboratory');
  if (entry.classId) {
    const academicClass = await db.class.findFirst({
      where: { id: entry.classId, ...scopeWhere(scope), deletedAt: null },
    });
    if (!academicClass) throw new NotFoundError('Class not found in this school');
    if (academicClass.capacity > room.capacity)
      throw new ValidationError('Room capacity is below class capacity');
  }
  const otherEntries = await db.scheduleEntry.findMany({
    where: { timetableId, roomId: entry.roomId, ...(entry.id ? { id: { not: entry.id } } : {}) },
  });
  let span;
  try {
    span = getEntryTeachingSlots(entry, slots);
    for (const other of otherEntries) {
      if (
        getEntryTeachingSlots(other, slots).some((a) =>
          span.some(
            (b) => a.weekday === b.weekday && a.startTime < b.endTime && b.startTime < a.endTime
          )
        )
      ) {
        throw new Error('Room is already booked during this lesson');
      }
    }
  } catch (error) {
    throw new ValidationError(error.message);
  }
}
