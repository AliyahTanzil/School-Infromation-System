import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { sciencePeriods } from '../../frontend/src/scienceTimetableDraft.js';
import { generateTimetableSlots } from '../src/domain/timetableEngine.js';

const db = new PrismaClient();
try {
  const result = await db.$transaction(
    async (tx) => {
      const school = await tx.school.findFirstOrThrow({
        where: { name: 'Aunty Isha Internation School' },
      });
      const scope = { tenantId: school.tenantId, schoolId: school.id };
      const timetable = await tx.timetable.findFirstOrThrow({
        where: { ...scope, name: 'SSS Science 3A - First Term 2026/27' },
        include: { slots: true, entries: true },
      });
      assert.equal(timetable.status, 'DRAFT', 'Only the requested draft may be changed');
      assert.equal(timetable.entries.length, 40);
      const oldSettings = await tx.timetableSettings.findUniqueOrThrow({
        where: { tenantId_schoolId: scope },
      });
      if (
        oldSettings.breakStartsAt === null &&
        oldSettings.lunchStartsAt === '12:00' &&
        timetable.slots.length === 45
      )
        return { alreadyUpdated: true };
      const settings = await tx.timetableSettings.update({
        where: { tenantId_schoolId: scope },
        data: {
          breakStartsAt: null,
          breakEndsAt: null,
          lunchStartsAt: '12:00',
          lunchEndsAt: '12:40',
        },
      });
      assert.equal(generateTimetableSlots(settings).filter((s) => !s.isBreak).length, 40);
      for (let weekday = 1; weekday <= 5; weekday++) {
        const slots = timetable.slots.filter((s) => s.weekday === weekday);
        const lessons = slots
          .filter((s) => !s.isBreak)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
        assert.equal(lessons.length, 8);
        for (let i = 0; i < 8; i++)
          await tx.timetableSlot.update({
            where: { id: lessons[i].id },
            data: { startTime: sciencePeriods[i][0], endTime: sciencePeriods[i][1] },
          });
        const lunch = slots.find((s) => s.isBreak && s.label === 'Lunch');
        assert.ok(lunch, 'Lunch slot is required');
        await tx.timetableSlot.update({
          where: { id: lunch.id },
          data: { startTime: '12:00', endTime: '12:40' },
        });
        const breaks = slots.filter((s) => s.isBreak && s.id !== lunch.id);
        assert.ok(
          breaks.every((s) => !timetable.entries.some((e) => e.timeSlotId === s.id)),
          'Cannot delete a slot with lessons'
        );
        await tx.timetableSlot.deleteMany({
          where: { id: { in: breaks.map((s) => s.id) }, timetableId: timetable.id },
        });
      }
      const slots = await tx.timetableSlot.findMany({ where: { timetableId: timetable.id } });
      assert.equal(slots.length, 45);
      assert.equal(slots.filter((s) => s.isBreak && s.label === 'Lunch').length, 5);
      await tx.timetable.update({
        where: { id: timetable.id },
        data: { version: { increment: 1 } },
      });
      await tx.timetableVersion.create({
        data: {
          timetableId: timetable.id,
          number: timetable.version + 1,
          snapshot: { slots, entries: timetable.entries },
        },
      });
      await tx.timetableAudit.create({
        data: {
          ...scope,
          timetableId: timetable.id,
          action: 'LUNCH_ONLY_UPDATED',
          metadata: { lunch: '12:00-12:40', lessons: 40, removedSeparateBreak: true },
        },
      });
      return {
        timetableId: timetable.id,
        status: 'DRAFT',
        lessons: 40,
        totalSlots: 45,
        lunch: '12:00-12:40',
        separateBreaks: 0,
      };
    },
    { isolationLevel: 'Serializable', timeout: 60000 }
  );
  console.log(JSON.stringify(result));
} finally {
  await db.$disconnect();
}
