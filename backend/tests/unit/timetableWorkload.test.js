import test from 'node:test';
import assert from 'node:assert/strict';
import { teacherWorkloadIssue } from '../../src/domain/timetableEngine.js';

const settings = { maxTeacherPeriodsDay: 6, maxTeacherPeriodsWeek: 30, maxConsecutivePeriods: 3 };
const slot = (id, weekday, startTime, endTime) => ({ id, weekday, startTime, endTime });
const morning = [
  slot('a', 1, '08:00', '08:40'),
  slot('b', 1, '08:40', '09:20'),
  slot('c', 1, '09:20', '10:00'),
  slot('d', 1, '10:00', '10:40'),
];

test('consecutive limit includes lessons on both sides of a candidate', () => {
  assert.match(
    teacherWorkloadIssue({
      scheduledSlots: [morning[0], morning[3]],
      candidateSlots: morning.slice(1, 3),
      settings,
    }),
    /consecutive/
  );
});

test('breaks and day boundaries interrupt consecutive periods', () => {
  for (const candidate of [slot('e', 1, '10:20', '11:00'), slot('f', 2, '10:00', '10:40')]) {
    assert.equal(
      teacherWorkloadIssue({
        scheduledSlots: morning.slice(0, 3),
        candidateSlots: [candidate],
        settings,
      }),
      null
    );
  }
});

const db = { $on() {} };
globalThis.__prisma = db;
const { generateCompleteSchedule } =
  await import('../../src/application/services/timetableService.js');
const scope = { tenantId: 'tenant', schoolId: 'school', timetableId: 'draft' };

function prepare(limits, slots = morning, double = false) {
  const writes = [];
  db.$transaction = async (fn, options) => {
    assert.equal(options.isolationLevel, 'Serializable');
    return fn(db);
  };
  db.timetable = {
    findFirst: async () => ({ id: 'draft', ...scope, academicPeriodId: 'term', status: 'DRAFT' }),
  };
  db.timetableSettings = {
    findUnique: async ({ where }) => {
      assert.deepEqual(where.tenantId_schoolId, { tenantId: 'tenant', schoolId: 'school' });
      return limits;
    },
  };
  db.timetableSlot = { findMany: async () => slots };
  db.subjectPeriodRequirement = {
    findMany: async () =>
      ['one', 'two'].map((classId) => ({
        classId,
        subjectId: 'math',
        periodsPerWeek: 2,
        requiresDoublePeriod: double,
        class: { name: classId, capacity: 20 },
        subject: { name: 'Math', code: 'M' },
      })),
  };
  db.teacherTeachingAssignment = {
    findMany: async () =>
      ['one', 'two'].map((classId) => ({
        id: classId,
        classId,
        teacherId: 'teacher',
        subjectId: 'math',
      })),
  };
  db.timetableRoom = { findMany: async () => [{ id: 'room', capacity: 30 }] };
  db.teacherAvailability = { findMany: async () => [] };
  db.scheduleEntry = {
    count: async () => 0,
    createMany: async ({ data }) => writes.push(...data),
    findMany: async () => writes,
  };
  db.timetableAudit = { create: async () => writes.push('audit') };
  db.academicTerm = { findFirst: async () => ({ id: 'term' }) };
  db.schedulingConflict = db.scheduleSubstitution = { findMany: async () => [] };
  return writes;
}

test('generation enforces each teacher limit across classes with no partial writes', async () => {
  for (const [limits, reason] of [
    [{ ...settings, maxTeacherPeriodsDay: 3 }, /daily teacher workload/],
    [{ ...settings, maxTeacherPeriodsWeek: 3 }, /weekly teacher workload/],
    [settings, /consecutive teacher workload/],
  ]) {
    const writes = prepare(limits);
    await assert.rejects(generateCompleteSchedule(scope), reason);
    assert.deepEqual(writes, []);
  }
});

test('double periods count fully toward workload and permit exact limits', async () => {
  const limits = {
    ...settings,
    maxTeacherPeriodsDay: 4,
    maxTeacherPeriodsWeek: 4,
    maxConsecutivePeriods: 4,
  };
  const writes = prepare(limits, morning, true);
  await generateCompleteSchedule(scope);
  assert.deepEqual(
    writes.filter((entry) => entry !== 'audit').map((entry) => entry.duration),
    [2, 2]
  );
  const rejectedWrites = prepare({ ...limits, maxTeacherPeriodsWeek: 3 }, morning, true);
  await assert.rejects(generateCompleteSchedule(scope), /weekly teacher workload/);
  assert.deepEqual(rejectedWrites, []);
});

test('generation uses school defaults when settings have not been saved', async () => {
  const writes = prepare(null);
  await assert.rejects(generateCompleteSchedule(scope), /consecutive teacher workload/);
  assert.deepEqual(writes, []);
});
