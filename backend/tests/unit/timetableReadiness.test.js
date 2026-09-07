import test from 'node:test';
import assert from 'node:assert/strict';

const db = { $on() {} };
globalThis.__prisma = db;
const { getTimetableReadiness } =
  await import('../../src/application/services/timetableService.js');

test('readiness reports incomplete live setup without writing scheduling data', async () => {
  const writes = [];
  db.timetable = {
    findFirst: async () => ({ id: 'table', academicPeriodId: 'term', status: 'DRAFT' }),
  };
  db.timetableSlot = {
    findMany: async () => [
      { id: 'slot', weekday: 1, startTime: '08:00', endTime: '08:40', isBreak: false },
    ],
  };
  db.scheduleEntry = {
    findMany: async () => [
      {
        id: 'entry',
        classId: 'class',
        subjectId: 'subject',
        subjectCode: 'MATH',
        timeSlotId: 'slot',
        kind: 'LESSON',
        duration: 1,
        teacherId: null,
        roomId: null,
      },
    ],
    create: async () => writes.push('entry'),
  };
  db.subjectPeriodRequirement = {
    findMany: async () => [
      {
        classId: 'class',
        subjectId: 'subject',
        periodsPerWeek: 2,
        class: { name: 'SSS 3A' },
        subject: { name: 'Mathematics' },
      },
    ],
  };
  db.teacherTeachingAssignment = { findMany: async () => [] };
  db.timetableRoom = { findMany: async () => [] };
  db.teacherAvailability = { findMany: async () => [] };
  db.schedulingConflict = { findMany: async () => [] };
  db.timetableSettings = { findUnique: async () => null };

  const report = await getTimetableReadiness({
    tenantId: 'tenant',
    schoolId: 'school',
    timetableId: 'table',
  });

  assert.equal(report.ready, false);
  assert.deepEqual(
    new Set(report.issues.map((issue) => issue.code)),
    new Set([
      'NO_ACTIVE_ROOMS',
      'MISSING_TEACHING_ASSIGNMENT',
      'PERIOD_REQUIREMENT_MISMATCH',
      'ENTRY_WITHOUT_TEACHER',
      'ENTRY_WITHOUT_ROOM',
    ])
  );
  assert.deepEqual(writes, []);
});
