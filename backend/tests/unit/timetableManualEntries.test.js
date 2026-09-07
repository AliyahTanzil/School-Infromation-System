import test from 'node:test';
import assert from 'node:assert/strict';
const db = { $on() {} };
globalThis.__prisma = db;
const { addEntry, updateEntry } =
  await import('../../src/application/services/timetableService.js');
const { entryUpdateSchema } =
  await import('../../src/application/validators/timetableValidators.js');
const scope = { tenantId: 'tenant', schoolId: 'school', timetableId: 'table', actorId: 'admin' };
const slots = [
  { id: 'one', weekday: 1, startTime: '08:00', endTime: '08:40' },
  { id: 'two', weekday: 1, startTime: '08:40', endTime: '09:20' },
  { id: 'three', weekday: 1, startTime: '09:20', endTime: '10:00' },
];
const lesson = {
  id: 'entry',
  ...scope,
  timeSlotId: 'one',
  classId: 'class',
  subjectId: 'subject',
  subjectCode: 'MATH',
  teacherId: 'teacher',
  kind: 'LESSON',
  duration: 1,
  teachingAssignmentId: 'assignment',
};
function prepare(entries = [lesson], status = 'DRAFT') {
  const writes = [];
  db.$transaction = async (fn, options) => {
    assert.equal(options.isolationLevel, 'Serializable');
    return fn(db);
  };
  db.timetable = { findFirst: async () => ({ id: 'table', status }) };
  db.timetableSlot = { findMany: async () => slots };
  db.scheduleEntry = {
    findFirst: async ({ where }) => {
      assert.deepEqual(where, {
        id: where.id,
        timetableId: 'table',
        tenantId: 'tenant',
        schoolId: 'school',
      });
      return entries.find((entry) => entry.id === where.id);
    },
    findMany: async () => entries,
    create: async ({ data }) => {
      writes.push(data);
      return { ...data, id: 'new' };
    },
    update: async ({ where, data }) => {
      assert.equal(where.schoolId, 'school');
      writes.push(data);
      return { ...lesson, ...data };
    },
  };
  db.teacher = db.class = { findFirst: async () => ({ id: 'teacher', capacity: 20 }) };
  db.subject = { findFirst: async () => ({ id: 'subject', code: 'MATH' }) };
  db.teacherAvailability = { findMany: async () => [] };
  db.timetableSettings = { findUnique: async () => null };
  db.schedulingConflict = { deleteMany: async () => {}, create: async () => {} };
  db.timetableAudit = { create: async ({ data }) => writes.push(data.action) };
  return writes;
}
test('partial editing preserves omitted details, excludes itself from bookings and records an audit', async () => {
  const writes = prepare();
  const saved = await updateEntry({
    ...scope,
    entryId: 'entry',
    data: { timeSlotId: 'two', notes: 'Moved' },
  });
  assert.equal(saved.subjectId, 'subject');
  assert.equal(saved.duration, 1);
  assert.equal(writes[0].timeSlotId, 'two');
  assert.equal(writes[1], 'ENTRY_UPDATED');
});
test('edits cannot target another timetable or modify published timetables', async () => {
  let writes = prepare();
  await assert.rejects(
    updateEntry({ ...scope, entryId: 'missing', data: { notes: 'x' } }),
    /not found/
  );
  assert.equal(writes.length, 0);
  writes = prepare([lesson], 'PUBLISHED');
  await assert.rejects(
    updateEntry({ ...scope, entryId: 'entry', data: { notes: 'x' } }),
    /not editable/
  );
  assert.equal(writes.length, 0);
});
test('manual placement rejects overlap with the second period of a double lesson', async () => {
  const writes = prepare([{ ...lesson, duration: 2, kind: 'DOUBLE' }]);
  await assert.rejects(
    addEntry({ ...scope, data: { ...lesson, id: undefined, timeSlotId: 'two' } }),
    /overlaps/
  );
  assert.equal(writes.length, 0);
});
test('workload and cross-school subject checks reject changes before writes', async () => {
  const writes = prepare();
  db.timetableSettings.findUnique = async () => ({ maxTeacherPeriodsDay: 1 });
  await assert.rejects(
    addEntry({ ...scope, data: { ...lesson, id: undefined, timeSlotId: 'two' } }),
    /workload/
  );
  db.subject.findFirst = async () => null;
  await assert.rejects(
    updateEntry({ ...scope, entryId: 'entry', data: { subjectId: 'foreign' } }),
    /Subject does not belong/
  );
  assert.equal(writes.length, 0);
});
test('PATCH accepts only editable fields and preserves omitted defaults', () => {
  const params = {
    id: '12345678-1234-1234-1234-123456789012',
    entryId: '12345678-1234-1234-1234-123456789013',
  };
  assert.deepEqual(entryUpdateSchema.parse({ params, body: { notes: 'Changed' } }).body, {
    notes: 'Changed',
  });
  assert.equal(
    entryUpdateSchema.safeParse({ params, body: { tenantId: 'foreign' } }).success,
    false
  );
  assert.equal(entryUpdateSchema.safeParse({ params, body: {} }).success, false);
});
