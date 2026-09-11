import test from 'node:test';
import assert from 'node:assert/strict';

const db = { $on() {} };
globalThis.__prisma = db;
const controller =
  await import('../../src/presentation/http/controllers/classroomCalendarController.js');
const { default: router } =
  await import('../../src/presentation/http/routes/classroomCalendarRoutes.js');
const { default: authenticate } = await import('../../src/middleware/auth/authenticate.js');
const { default: schoolContext } = await import('../../src/middleware/auth/teacherContext.js');
const scope = { tenantId: 'tenant', schoolId: 'school' };
const start = new Date('2026-09-07T00:00:00Z');
const end = new Date('2026-09-07T23:59:59Z');
const owner = { id: 'actor', roles: [], platformRole: 'OWNER' };

function fixture({ missing = false, member = false, owns = false, linkedClass = true } = {}) {
  const reads = [];
  db.digitalClassroom = {
    findFirst: async ({ where, include }) => {
      assert.deepEqual(where, { id: 'classroom', ...scope, status: 'ACTIVE' });
      assert.deepEqual(include.memberships.where, { userId: 'actor', status: 'ACTIVE' });
      return missing
        ? null
        : {
            ownerId: owns ? 'actor' : 'another',
            memberships: member ? [{ role: 'STUDENT' }] : [],
            classId: linkedClass ? 'class' : null,
          };
    },
  };
  db.assignment = {
    findMany: async ({ where }) => {
      reads.push('assignments');
      assert.deepEqual(where, {
        ...scope,
        classroomId: 'classroom',
        status: { in: ['PUBLISHED', 'CLOSED'] },
        OR: [{ availableAt: { gte: start, lte: end } }, { dueAt: { gte: start, lte: end } }],
      });
      return [{ id: 'work', title: 'Homework', availableAt: start, dueAt: end }];
    },
  };
  db.timetable = {
    findFirst: async ({ where }) => {
      reads.push('timetable');
      assert.deepEqual(where, { ...scope, status: 'PUBLISHED' });
      return { id: 'timetable' };
    },
  };
  db.scheduleEntry = {
    findMany: async ({ where }) => {
      assert.deepEqual(where, { ...scope, timetableId: 'timetable', classId: 'class' });
      return [{ id: 'lesson', timeSlotId: 'slot', subjectCode: 'MATH' }];
    },
  };
  db.timetableSlot = {
    findMany: async ({ where }) => {
      assert.deepEqual(where, { ...scope, timetableId: 'timetable' });
      return [{ id: 'slot', weekday: 1, startTime: '09:00', isBreak: false }];
    },
  };
  return reads;
}

async function invoke(user = owner, validated = false) {
  let failure;
  let result;
  const query = { classroomId: 'classroom', start, end };
  await controller.list(
    {
      user,
      schoolContext: scope,
      query: { ...query, platformRole: 'OWNER', roles: ['SCHOOL_ADMIN'], tenantId: 'foreign' },
      ...(validated ? { validatedQuery: query } : {}),
    },
    {
      json(value) {
        result = value.data;
      },
    },
    (error) => {
      failure = error;
    }
  );
  if (failure) throw failure;
  return result;
}

test('calendar routes authenticate and resolve school context before reading events', () => {
  const middleware = router.stack.filter((layer) => !layer.route).map((layer) => layer.handle);
  assert.deepEqual(middleware, [authenticate, schoolContext]);
});

test('persisted owners read scoped published events without classroom membership', async () => {
  fixture();
  const events = await invoke();
  assert.deepEqual(
    events.map((event) => event.type),
    ['ASSIGNMENT_AVAILABLE', 'LESSON', 'ASSIGNMENT_DUE']
  );
  assert.equal(events[1].startsAt.toISOString(), '2026-09-07T09:00:00.000Z');
  assert.deepEqual(await invoke(owner, true), events);
});

test('owner access cannot read missing, foreign or inactive classrooms', async () => {
  const reads = fixture({ missing: true });
  await assert.rejects(invoke(), /Digital classroom not found/);
  assert.deepEqual(reads, []);
});

test('request owner claims cannot bypass classroom membership', async () => {
  for (const user of [
    { id: 'actor', roles: [] },
    { id: 'actor', roles: ['TEACHER'] },
    { id: 'actor', roles: ['STUDENT'] },
    { id: 'actor', roles: [], accountType: 'APPLICATION_MANAGER' },
  ]) {
    const reads = fixture();
    await assert.rejects(invoke(user), /not a member/);
    assert.deepEqual(reads, []);
  }
});

test('administrators, classroom owners and active members retain calendar access', async () => {
  for (const roles of [['PLATFORM_ADMIN'], ['SCHOOL_ADMIN']]) {
    fixture();
    assert.equal((await invoke({ id: 'actor', roles })).length, 3);
  }
  for (const options of [{ owns: true }, { member: true }]) {
    fixture(options);
    assert.equal((await invoke({ id: 'actor', roles: ['STUDENT'] })).length, 3);
  }
});

test('unlinked classrooms return assignment events without querying school timetables', async () => {
  const reads = fixture({ linkedClass: false });
  assert.equal((await invoke()).length, 2);
  assert.deepEqual(reads, ['assignments']);
});
