import test from 'node:test';
import assert from 'node:assert/strict';
const db = { $on() {} };
globalThis.__prisma = db;
const { changeStatus } = await import('../../src/application/services/timetableService.js');
const scope = { tenantId: 'tenant', schoolId: 'school', timetableId: 'table', actorId: 'owner' };
const slots = [
  { id: 'a', weekday: 1, startTime: '08:00', endTime: '08:40' },
  { id: 'b', weekday: 1, startTime: '08:40', endTime: '09:20' },
  { id: 'c', weekday: 1, startTime: '09:20', endTime: '10:00' },
  { id: 'd', weekday: 1, startTime: '10:00', endTime: '10:40' },
  { id: 'e', weekday: 2, startTime: '08:00', endTime: '08:40' },
  { id: 'f', weekday: 1, startTime: '11:00', endTime: '11:40' },
];
const entries = slots.slice(0, 4).map((slot, index) => ({
  id: `entry-${index}`,
  teacherId: 'teacher',
  classId: `class-${index}`,
  timeSlotId: slot.id,
  kind: 'LESSON',
  duration: 1,
  subjectCode: 'MATH',
}));
const defaults = { maxTeacherPeriodsDay: 6, maxTeacherPeriodsWeek: 30, maxConsecutivePeriods: 3 };
function prepare(status, lessons = entries, settings = defaults) {
  const writes = [];
  db.$transaction = async (fn, options) => {
    assert.equal(options.isolationLevel, 'Serializable');
    return fn(db);
  };
  const row = {
    id: 'table',
    tenantId: 'tenant',
    academicPeriodId: 'term',
    status: status === 'LOCKED' ? 'PUBLISHED' : 'REVIEW',
    version: 2,
  };
  db.timetable = {
    findFirst: async () => row,
    update: async ({ data }) => {
      writes.push('status');
      return { ...row, ...data };
    },
  };
  db.timetableSettings = {
    findUnique: async ({ where }) => {
      assert.deepEqual(where.tenantId_schoolId, { tenantId: 'tenant', schoolId: 'school' });
      return settings;
    },
  };
  db.scheduleEntry = { findMany: async () => lessons };
  db.timetableSlot = { findMany: async () => slots };
  db.teacher = { findFirst: async () => ({ id: 'teacher' }) };
  db.teacherAvailability = { findMany: async () => [] };
  db.schedulingConflict = db.scheduleSubstitution = { findMany: async () => [] };
  db.academicTerm = { findFirst: async () => ({ id: 'term' }) };
  db.timetableVersion = { create: async () => writes.push('version') };
  db.timetableAudit = { create: async () => writes.push('audit') };
  return writes;
}
for (const status of ['PUBLISHED', 'LOCKED']) {
  test(`${status} rejects each workload limit with no status, version or audit writes`, async () => {
    for (const [settings, reason] of [
      [{ ...defaults, maxTeacherPeriodsDay: 3 }, /daily teacher workload/],
      [{ ...defaults, maxTeacherPeriodsWeek: 3 }, /weekly teacher workload/],
      [defaults, /consecutive teacher workload/],
    ]) {
      const writes = prepare(status, entries, settings);
      await assert.rejects(changeStatus({ ...scope, status }), reason);
      assert.deepEqual(writes, []);
    }
  });
  test(`${status} allows exact limits including both periods of a double lesson`, async () => {
    const double = [{ ...entries[0], kind: 'DOUBLE', duration: 2 }, entries[2]];
    const writes = prepare(status, double, {
      ...defaults,
      maxTeacherPeriodsDay: 3,
      maxTeacherPeriodsWeek: 3,
    });
    const result = await changeStatus({ ...scope, status });
    assert.equal(result.status, status);
    assert.equal(result.version, 3);
    assert.deepEqual(writes, ['status', 'version', 'audit']);
  });
}
test('publication counts weekly loads across weekdays but breaks interrupt consecutive teaching', async () => {
  const lessons = [
    entries[0],
    entries[1],
    entries[2],
    { ...entries[3], timeSlotId: 'f' },
    { ...entries[3], id: 'other-day', timeSlotId: 'e' },
  ];
  let writes = prepare('PUBLISHED', lessons, { ...defaults, maxTeacherPeriodsWeek: 4 });
  await assert.rejects(changeStatus({ ...scope, status: 'PUBLISHED' }), /weekly teacher workload/);
  assert.deepEqual(writes, []);
  writes = prepare('PUBLISHED', lessons);
  await changeStatus({ ...scope, status: 'PUBLISHED' });
  assert.equal(writes.length, 3);
});
test('missing settings use defaults; separate teachers do not share workload', async () => {
  prepare('PUBLISHED', entries, null);
  await assert.rejects(
    changeStatus({ ...scope, status: 'PUBLISHED' }),
    /consecutive teacher workload/
  );
  prepare(
    'PUBLISHED',
    entries.map((entry, index) => ({ ...entry, teacherId: `teacher-${index}` })),
    { ...defaults, maxTeacherPeriodsDay: 1 }
  );
  await changeStatus({ ...scope, status: 'PUBLISHED' });
});
test('archiving remains possible even when current workloads exceed settings', async () => {
  const writes = prepare('ARCHIVED');
  db.timetable.findFirst = async () => ({ id: 'table', status: 'PUBLISHED', version: 1 });
  db.timetableSettings.findUnique = async () =>
    assert.fail('Archiving must not require workload checks');
  await changeStatus({ ...scope, status: 'ARCHIVED' });
  assert.equal(writes.length, 3);
});
