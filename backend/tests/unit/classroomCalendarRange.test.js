import test from 'node:test';
import assert from 'node:assert/strict';
import { classroomCalendarQuerySchema } from '../../src/application/validators/classroomCalendarValidators.js';
import validate from '../../src/middleware/validation/validate.js';

const db = { $on() {} };
globalThis.__prisma = db;
const { list } = await import('../../src/application/services/classroomCalendarService.js');
const { list: controller } =
  await import('../../src/presentation/http/controllers/classroomCalendarController.js');
const start = new Date('2026-01-01T00:00:00Z');
const limit = new Date(start.getTime() + 366 * 86400000);
const scope = { tenantId: 'tenant', schoolId: 'school' };
const owner = { platformRole: 'OWNER' };
const classroomId = '00000000-0000-4000-8000-000000000001';

test('calendar request accepts ordered dates up to 366 days inclusive and rejects unsafe ranges', () => {
  const parse = (from, to, extra = {}) =>
    classroomCalendarQuerySchema.safeParse({
      query: { classroomId, start: from, end: to, ...extra },
    });
  assert.equal(parse(start.toISOString(), limit.toISOString()).success, true);
  assert.equal(parse(start, start).success, true);
  for (const [from, to] of [
    [start, new Date(+limit + 1)],
    [limit, start],
    ['bad', limit],
    [start, 'bad'],
  ]) {
    assert.equal(parse(from, to).success, false);
  }
  assert.equal(parse(start, limit, { schoolId: 'foreign' }).success, false);
});

test('service rejects invalid, reversed and excessive ranges before persistence access', async () => {
  let queries = 0;
  db.digitalClassroom = {
    findFirst: async () => {
      queries++;
      throw new Error('Unexpected read');
    },
  };
  for (const [from, to] of [
    [start, new Date(+limit + 1)],
    [limit, start],
    [new Date('bad'), limit],
    [start, new Date('bad')],
    [undefined, limit],
    [start.toISOString(), limit],
  ]) {
    await assert.rejects(list(scope, classroomId, 'actor', owner, from, to), /366 days/);
  }
  assert.equal(queries, 0);
});

function fixture() {
  db.digitalClassroom = {
    findFirst: async () => ({ classId: 'class', ownerId: 'other', memberships: [] }),
  };
  db.assignment = { findMany: async () => [] };
  db.timetable = { findFirst: async () => ({ id: 'timetable' }) };
  db.scheduleEntry = {
    findMany: async () => [{ id: 'lesson', timeSlotId: 'slot', subjectCode: 'MATH' }],
  };
  db.timetableSlot = {
    findMany: async () => [{ id: 'slot', weekday: 1, startTime: '09:00', isBreak: false }],
  };
}

test('lesson expansion includes both timestamp boundaries and excludes lessons outside them', async () => {
  fixture();
  const query = (from, to) =>
    list(scope, classroomId, 'actor', owner, new Date(from), new Date(to));
  const lessonTime = '2026-09-07T09:00:00Z';
  assert.equal((await query(lessonTime, lessonTime)).length, 1);
  assert.deepEqual(await query('2026-09-07T09:00:00.001Z', '2026-09-07T23:59:59Z'), []);
  assert.deepEqual(await query('2026-09-07T00:00:00Z', '2026-09-07T08:59:59.999Z'), []);
  // The end day must be visited even when its time is earlier than the start day's time.
  const events = await query('2026-09-06T18:00:00Z', lessonTime);
  assert.equal(events.length, 1);
  assert.equal(events[0].startsAt.toISOString(), new Date(lessonTime).toISOString());
});

test('maximum allowed range expands a finite year of weekly lessons', async () => {
  fixture();
  const events = await list(scope, classroomId, 'actor', owner, start, limit);
  assert.equal(events.length, 52);
  assert.ok(events.every((event) => event.startsAt >= start && event.startsAt <= limit));
});

test('validated date coercion works with Express getter-only query objects', async () => {
  fixture();
  const req = { user: { id: 'actor', ...owner }, schoolContext: scope };
  Object.defineProperty(req, 'query', {
    get: () => ({ classroomId, start: '2026-09-07T00:00:00Z', end: '2026-09-07T23:59:59Z' }),
  });
  let next = 0;
  validate(classroomCalendarQuerySchema)(req, {}, () => next++);
  assert.equal(next, 1);
  assert.ok(req.validatedQuery.start instanceof Date);
  let result;
  await controller(
    req,
    {
      json(value) {
        result = value.data;
      },
    },
    (error) => {
      throw error;
    }
  );
  assert.equal(result.length, 1);
});
