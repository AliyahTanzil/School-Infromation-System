import assert from 'node:assert/strict';
import test from 'node:test';
import { globalSearch } from '../../src/application/services/searchService.js';
import { list } from '../../src/application/services/assignmentService.js';

const scope = { tenantId: 'tenant-1', schoolId: 'school-1' };
const member = (role, status = 'ACTIVE') => ({ userId: 'user-1', role, status });
const room = (id, role = 'STUDENT') => ({
  id,
  ownerId: 'owner-1',
  memberships: [member(role)],
});
const work = (id, status, overrides = {}) => ({
  id,
  title: 'Math exercise',
  ...scope,
  classroomId: 'room-1',
  status,
  availableAt: null,
  ...overrides,
});
const assignments = [
  work('draft', 'DRAFT'),
  work('published', 'PUBLISHED'),
  work('closed', 'CLOSED'),
  work('archived', 'ARCHIVED'),
  work('future', 'PUBLISHED', { availableAt: new Date('2999-01-01') }),
  work('past', 'PUBLISHED', { availableAt: new Date('2000-01-01') }),
  work('other-school', 'PUBLISHED', { schoolId: 'school-2' }),
  work('other-tenant', 'PUBLISHED', { tenantId: 'tenant-2' }),
  work('other-classroom', 'PUBLISHED', { classroomId: 'room-2' }),
];

// Evaluate the Prisma predicates against fixtures, including nested AND/OR,
// so an accidentally broadened search query changes the returned records.
function matches(record, where) {
  return Object.entries(where).every(([key, value]) => {
    if (key === 'AND') return value.every((clause) => matches(record, clause));
    if (key === 'OR') return value.some((clause) => matches(record, clause));
    const actual = record[key];
    if (value === null || typeof value !== 'object') return actual === value;
    if ('in' in value) return value.in.includes(actual);
    if ('not' in value) return actual !== value.not;
    if ('lte' in value) return actual != null && actual <= value.lte;
    if ('contains' in value)
      return String(actual ?? '')
        .toLowerCase()
        .includes(value.contains.toLowerCase());
    throw new Error(`Unsupported fixture predicate: ${key}`);
  });
}

function database(t, classrooms = [room('room-1')], rows = assignments) {
  let calls = 0;
  return {
    digitalClassroom: {
      findMany: t.mock.fn(async () => (++calls === 1 ? classrooms : [])),
      findFirst: async () => classrooms[0] ?? null,
    },
    assignment: {
      findMany: t.mock.fn(async ({ where }) => rows.filter((item) => matches(item, where))),
    },
    digitalMaterial: { findMany: async () => [] },
    classroomAnnouncement: { findMany: async () => [] },
    classroomStreamPost: { findMany: async () => [] },
    subject: { findMany: async () => [] },
  };
}

test('student search excludes draft, archived, future and out-of-scope assignments', async (t) => {
  const db = database(t);
  const result = await globalSearch(scope, 'user-1', ['STUDENT'], 'math', db);
  assert.deepEqual(
    result.assignments.map((item) => item.id),
    ['published', 'closed', 'past']
  );
  assert.equal(result.totalResults, 3);
  assert.deepEqual(db.digitalClassroom.findMany.mock.calls[0].arguments[0].where, {
    ...scope,
    status: { not: 'ARCHIVED' },
    OR: [{ ownerId: 'user-1' }, { memberships: { some: { userId: 'user-1', status: 'ACTIVE' } } }],
  });
});

test('draft access follows classroom ownership and active teaching membership', async (t) => {
  for (const classroom of [{ ...room('room-1'), ownerId: 'user-1' }, room('room-1', 'TEACHER')]) {
    const result = await globalSearch(
      scope,
      'user-1',
      ['TEACHER'],
      'math',
      database(t, [classroom])
    );
    assert.ok(result.assignments.some((item) => item.id === 'draft'));
    assert.ok(result.assignments.some((item) => item.id === 'future'));
    assert.ok(
      result.assignments.every(
        (item) => item.schoolId === scope.schoolId && item.tenantId === scope.tenantId
      )
    );
  }
  const result = await globalSearch(scope, 'user-1', ['TEACHER'], 'math', database(t));
  assert.deepEqual(
    result.assignments.map((item) => item.id),
    ['published', 'closed', 'past']
  );
});

test('teaching one classroom does not expose drafts in another accessible classroom', async (t) => {
  const rows = [...assignments, work('second-draft', 'DRAFT', { classroomId: 'room-2' })];
  const db = database(t, [room('room-1', 'TEACHER'), room('room-2')], rows);
  const result = await globalSearch(scope, 'user-1', ['TEACHER'], 'math', db);
  assert.ok(result.assignments.some((item) => item.id === 'draft'));
  assert.ok(!result.assignments.some((item) => item.id === 'second-draft'));
});

test('administrators retain scoped draft access and users without classrooms receive no assignments', async (t) => {
  const admin = await globalSearch(scope, 'user-1', ['SCHOOL_ADMIN'], 'math', database(t));
  assert.ok(admin.assignments.some((item) => item.id === 'draft'));
  const db = database(t, []);
  const result = await globalSearch(scope, 'user-1', ['STUDENT'], 'math', db);
  assert.deepEqual(result.assignments, []);
  assert.equal(db.assignment.findMany.mock.callCount(), 0);
  await assert.rejects(globalSearch({}, 'user-1', [], 'math', db), /scope required/);
});

test('direct assignment lists enforce availability even with an explicit draft or archived filter', async (t) => {
  const db = database(t);
  const visible = await list(scope, 'room-1', 'user-1', ['STUDENT'], undefined, db);
  assert.deepEqual(
    visible.map((item) => item.id),
    ['published', 'closed', 'past']
  );
  for (const status of ['DRAFT', 'ARCHIVED']) {
    assert.deepEqual(await list(scope, 'room-1', 'user-1', ['STUDENT'], status, db), []);
  }
  const staff = database(t, [room('room-1', 'TEACHER')]);
  assert.deepEqual(
    (await list(scope, 'room-1', 'user-1', ['TEACHER'], 'DRAFT', staff)).map((item) => item.id),
    ['draft']
  );
});
