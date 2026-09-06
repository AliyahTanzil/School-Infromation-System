import assert from 'node:assert/strict';
import test from 'node:test';
import {
  evaluateTeacherAvailability,
  detectTimetableConflicts,
  getEntryTeachingSlots,
} from '../../src/domain/timetableEngine.js';
import {
  teacherAvailabilitySchema,
  teacherAvailabilityUpdateSchema,
} from '../../src/application/validators/timetableValidators.js';

const slot = { id: 'slot', weekday: 1, startTime: '08:00', endTime: '09:00', isBreak: false };
const second = { ...slot, id: 'second', startTime: '09:00', endTime: '10:00' };
const rule = {
  id: 'rule',
  teacherId: 'teacher',
  dayOfWeek: 1,
  startsAt: '08:00',
  endsAt: '10:00',
  kind: 'AVAILABLE',
  isRecurring: true,
  priority: 0,
};
const entry = {
  id: 'entry',
  timeSlotId: 'slot',
  teacherId: 'teacher',
  kind: 'LESSON',
  duration: 1,
};

test('availability defaults open; AVAILABLE rules restrict the whole week and must cover the entire lesson', () => {
  assert.equal(evaluateTeacherAvailability(slot).available, true);
  assert.equal(evaluateTeacherAvailability(slot, [rule]).available, true);
  assert.equal(evaluateTeacherAvailability({ ...slot, weekday: 2 }, [rule]).available, false);
  assert.equal(
    evaluateTeacherAvailability(slot, [{ ...rule, startsAt: '08:30' }]).available,
    false
  );
  assert.equal(
    evaluateTeacherAvailability(slot, [
      { ...rule, endsAt: '08:30' },
      { ...rule, startsAt: '08:30' },
    ]).available,
    true
  );
  assert.equal(
    evaluateTeacherAvailability(slot, [
      { ...rule, endsAt: '08:20' },
      { ...rule, startsAt: '08:30' },
    ]).available,
    false
  );
});

test('unavailability wins over preferences and availability; touching endpoints do not overlap', () => {
  const blocked = { ...rule, kind: 'UNAVAILABLE', startsAt: '08:30', endsAt: '08:45' };
  assert.deepEqual(
    evaluateTeacherAvailability(slot, [
      rule,
      blocked,
      { ...rule, kind: 'PREFERRED', priority: 100 },
    ]),
    { available: false, preference: 0 }
  );
  assert.equal(
    evaluateTeacherAvailability(slot, [{ ...blocked, startsAt: '09:00', endsAt: '10:00' }])
      .available,
    true
  );
  assert.deepEqual(
    evaluateTeacherAvailability(slot, [{ ...rule, kind: 'PREFERRED', priority: 8 }]),
    { available: true, preference: 8 }
  );
  assert.equal(
    evaluateTeacherAvailability(slot, [{ ...blocked, isRecurring: false }]).available,
    true
  );
});

test('multi-period availability includes the second slot and cannot cross breaks or day boundaries', () => {
  const lesson = { ...entry, duration: 2 };
  assert.equal(getEntryTeachingSlots(lesson, [slot, second]).length, 2);
  assert.throws(
    () => getEntryTeachingSlots(lesson, [slot, { ...second, isBreak: true }]),
    /adjacent/
  );
  assert.throws(() => getEntryTeachingSlots(lesson, [slot, { ...second, weekday: 2 }]), /adjacent/);
  const conflicts = detectTimetableConflicts([lesson], [slot, second], {
    teacherAvailability: [{ ...rule, kind: 'UNAVAILABLE', startsAt: '09:30' }],
  });
  assert.equal(conflicts[0].code, 'TEACHER_UNAVAILABLE');
  assert.equal(conflicts[0].severity, 'HARD');
  assert.equal(
    detectTimetableConflicts([lesson], [slot, second], {
      teacherAvailability: [{ ...rule, teacherId: 'other', kind: 'UNAVAILABLE' }],
    }).length,
    0
  );
});

test('schemas reject invalid days, times, kinds, one-off rules, empty patches and invalid IDs', () => {
  const teacherId = '00000000-0000-4000-8000-000000000001';
  for (const change of [
    { dayOfWeek: 0 },
    { startsAt: '24:00' },
    { kind: 'UNKNOWN' },
    { isRecurring: false },
    { priority: -1 },
  ]) {
    assert.equal(
      teacherAvailabilitySchema.safeParse({ params: { teacherId }, body: { ...rule, ...change } })
        .success,
      false
    );
  }
  assert.equal(
    teacherAvailabilitySchema.safeParse({ params: { teacherId: 'bad' }, body: rule }).success,
    false
  );
  assert.equal(
    teacherAvailabilityUpdateSchema.safeParse({ params: { teacherId, id: teacherId }, body: {} })
      .success,
    false
  );
  assert.deepEqual(
    teacherAvailabilityUpdateSchema.parse({
      params: { teacherId, id: teacherId },
      body: { priority: 5 },
    }).body,
    { priority: 5 }
  );
});

const db = { $on() {} };
globalThis.__prisma = db;
const service = await import('../../src/application/services/teacherAvailabilityService.js');
const timetable = await import('../../src/application/services/timetableService.js');
const scope = { tenantId: 'tenant', schoolId: 'school' };
function prepare({ rules = [], entries = [] } = {}) {
  const writes = [];
  db.$transaction = async (fn, options) => {
    assert.equal(options.isolationLevel, 'Serializable');
    return fn(db);
  };
  db.teacher = {
    findFirst: async ({ where }) => {
      assert.deepEqual(where, { id: 'teacher', ...scope, deletedAt: null });
      return { id: 'teacher' };
    },
  };
  db.teacherAvailability = {
    findMany: async () => rules,
    findFirst: async ({ where }) =>
      rules.find((item) => item.id === where.id && item.teacherId === where.teacherId) ?? null,
    create: async ({ data }) => {
      writes.push(data);
      return data;
    },
    update: async ({ data }) => {
      writes.push(data);
      return data;
    },
    delete: async () => writes.push('deleted'),
  };
  db.scheduleEntry = {
    findMany: async () => entries,
    create: async ({ data }) => {
      writes.push(data);
      return { id: 'entry', ...data };
    },
  };
  db.timetable = {
    findFirst: async () => ({ id: 'table', status: 'REVIEW', version: 1 }),
    update: async () => writes.push('status'),
  };
  db.timetableSlot = { findMany: async () => [slot, second] };
  db.schedulingConflict = {
    findMany: async () => [],
    deleteMany: async () => {},
    create: async () => {},
  };
  db.timetableAudit = { create: async () => {} };
  return writes;
}

test('CRUD validates teacher scope, merges partial updates, and scopes availability IDs to their teacher', async () => {
  const writes = prepare({ rules: [rule] });
  assert.deepEqual(await service.listTeacherAvailability(scope, 'teacher'), [rule]);
  await service.createTeacherAvailability({
    ...scope,
    teacherId: 'teacher',
    dayOfWeek: 2,
    startsAt: '10:00',
    endsAt: '12:00',
  });
  assert.equal(writes[0].kind, 'AVAILABLE');
  await service.updateTeacherAvailability({
    ...scope,
    teacherId: 'teacher',
    id: 'rule',
    priority: 6,
  });
  assert.equal(writes[1].startsAt, '08:00');
  assert.equal(writes[1].priority, 6);
  await service.removeTeacherAvailability({ ...scope, teacherId: 'teacher', id: 'rule' });
  await assert.rejects(
    service.updateTeacherAvailability({
      ...scope,
      teacherId: 'teacher',
      id: 'missing',
      priority: 2,
    }),
    /not found/
  );
  db.teacher.findFirst = async () => null;
  await assert.rejects(
    service.listTeacherAvailability(scope, 'teacher'),
    /not found in this school/
  );
  await assert.rejects(
    service.createTeacherAvailability({ ...scope, teacherId: 'teacher', ...rule }),
    /not found in this school/
  );
});

test('availability changes reject inverted ranges and changes invalidating non-archived lessons', async () => {
  const writes = prepare({ entries: [{ ...entry, timetable: { slots: [slot, second] } }] });
  await assert.rejects(
    service.createTeacherAvailability({
      ...scope,
      teacherId: 'teacher',
      ...rule,
      startsAt: '11:00',
    }),
    /valid start and end/
  );
  await assert.rejects(
    service.createTeacherAvailability({
      ...scope,
      teacherId: 'teacher',
      ...rule,
      kind: 'UNAVAILABLE',
    }),
    /unavailable/
  );
  assert.equal(writes.length, 0);
  prepare({
    rules: [rule, { ...rule, id: 'other', dayOfWeek: 2 }],
    entries: [{ ...entry, timetable: { slots: [slot] } }],
  });
  await assert.rejects(
    service.removeTeacherAvailability({ ...scope, teacherId: 'teacher', id: 'rule' }),
    /unavailable/
  );
});

test('manual entry and publication recheck current availability before any write', async () => {
  const writes = prepare({ rules: [{ ...rule, kind: 'UNAVAILABLE' }], entries: [entry] });
  await assert.rejects(
    timetable.addEntry({ ...scope, timetableId: 'table', actorId: 'admin', data: entry }),
    /unavailable/
  );
  await assert.rejects(
    timetable.changeStatus({
      ...scope,
      timetableId: 'table',
      actorId: 'admin',
      status: 'PUBLISHED',
    }),
    /unavailable/
  );
  assert.equal(writes.length, 0);
  prepare();
  const result = await timetable.addEntry({
    ...scope,
    timetableId: 'table',
    actorId: 'admin',
    data: entry,
  });
  assert.equal(result.teacherId, 'teacher');
});

test('concurrent availability mutations return a retryable validation message', async () => {
  prepare();
  db.$transaction = async () => {
    throw Object.assign(new Error(), { code: 'P2034' });
  };
  await assert.rejects(
    service.createTeacherAvailability({ ...scope, teacherId: 'teacher', ...rule }),
    /retry this request/
  );
});
