import test from 'node:test';
import assert from 'node:assert/strict';

const db = { $on() {} };
globalThis.__prisma = db;
const controller = await import('../../src/presentation/http/controllers/assignmentController.js');
const { default: router } = await import('../../src/presentation/http/routes/assignmentRoutes.js');
const { default: guard } =
  await import('../../src/middleware/auth/authorizeSchoolAdminOrTeacher.js');
const { default: authenticate } = await import('../../src/middleware/auth/authenticate.js');
const { default: schoolContext } = await import('../../src/middleware/auth/teacherContext.js');
const scope = { tenantId: 'tenant', schoolId: 'school' };
const owner = { id: 'actor', platformRole: 'OWNER', roles: [] };

function fixture({ membership, missing = false, status = 'DRAFT' } = {}) {
  const writes = [];
  const queries = [];
  db.digitalClassroom = {
    findFirst: async ({ where }) => {
      assert.deepEqual(where, { id: 'classroom', ...scope, status: 'ACTIVE' });
      return missing
        ? null
        : {
            id: 'classroom',
            ownerId: 'another-owner',
            memberships: membership
              ? [{ userId: 'actor', status: 'ACTIVE', role: membership }]
              : [],
          };
    },
  };
  db.assignment = {
    findMany: async ({ where }) => {
      queries.push(where);
      return [];
    },
    create: async ({ data }) => {
      writes.push(data);
      return data;
    },
    findFirst: async ({ where }) => {
      assert.deepEqual(where, { id: 'assignment', ...scope });
      return { id: 'assignment', classroomId: 'classroom', status };
    },
    update: async (args) => {
      writes.push(args);
      return args.data;
    },
  };
  return { writes, queries };
}

async function invoke(name, user = owner, extra = {}) {
  let failure;
  const body =
    name === 'create' ? { classroomId: 'classroom', title: 'Essay' } : { status: 'ARCHIVED' };
  await controller[name](
    {
      user,
      schoolContext: scope,
      params: { id: 'assignment' },
      body: { ...body, ...extra },
      query: { classroomId: 'classroom', status: 'DRAFT', ...extra },
    },
    {
      status() {
        return this;
      },
      json() {},
    },
    (error) => {
      failure = error;
    }
  );
  if (failure) throw failure;
}

test('assignment mutation guards admit owners while rejecting learner and forged identities', () => {
  assert.deepEqual(
    router.stack.filter((layer) => !layer.route).map((layer) => layer.handle),
    [authenticate, schoolContext]
  );
  assert.equal(
    router.stack.findIndex((layer) => layer.route),
    2
  );
  const mutations = router.stack.filter((layer) => layer.route && !layer.route.methods.get);
  assert.equal(mutations.length, 2);
  for (const { route } of mutations) {
    assert.equal(route.stack[0].handle, guard);
    for (const user of [
      owner,
      { roles: ['TEACHER'] },
      { roles: ['SCHOOL_ADMIN'] },
      { roles: ['PLATFORM_ADMIN'] },
    ]) {
      let calls = 0;
      guard({ user }, {}, () => calls++);
      assert.equal(calls, 1);
    }
    for (const user of [
      undefined,
      { roles: ['STUDENT'] },
      { roles: ['PARENT'] },
      { accountType: 'APPLICATION_MANAGER' },
    ]) {
      assert.throws(
        () =>
          guard({ user, body: { platformRole: 'OWNER' } }, {}, () =>
            assert.fail('Access must be denied')
          ),
        user ? /permission/ : /Authentication required/
      );
    }
  }
});

test('owner assignment lists retain school scope and expose drafts without membership', async () => {
  const { queries } = fixture();
  await invoke('list');
  assert.deepEqual(queries[0], { ...scope, classroomId: 'classroom', status: 'DRAFT' });
});

test('owner assignment creation and lifecycle changes retain authenticated author and scoped lookups', async () => {
  const { writes } = fixture();
  await invoke('create');
  assert.deepEqual(writes[0], {
    ...scope,
    classroomId: 'classroom',
    title: 'Essay',
    authorId: 'actor',
  });
  await invoke('updateStatus');
  assert.deepEqual(writes[1], { where: { id: 'assignment' }, data: { status: 'ARCHIVED' } });
});

test('forged owner claims cannot expose learner drafts or permit mutations', async () => {
  const { queries, writes } = fixture({ membership: 'STUDENT' });
  const student = { id: 'actor', roles: ['STUDENT'] };
  const forged = { platformRole: 'OWNER', roles: ['SCHOOL_ADMIN'] };
  await invoke('list', student, forged);
  assert.deepEqual(queries[0].AND[0].status, { in: ['PUBLISHED', 'CLOSED'] });
  assert.ok(queries[0].AND[0].OR[1].availableAt.lte instanceof Date);
  for (const name of ['create', 'updateStatus'])
    await assert.rejects(invoke(name, student, forged), /Only classroom teachers/);
  assert.deepEqual(writes, []);
});

test('teacher membership remains necessary for non-owner classwork management', async () => {
  fixture();
  await assert.rejects(invoke('create', { id: 'actor', roles: ['TEACHER'] }), /not a member/);
  const { writes } = fixture({ membership: 'TEACHER' });
  await invoke('create', { id: 'actor', roles: ['TEACHER'] });
  assert.equal(writes.length, 1);
});

test('owner access preserves active classroom, date and lifecycle checks', async () => {
  let state = fixture({ missing: true });
  for (const name of ['list', 'create', 'updateStatus'])
    await assert.rejects(invoke(name), /not found/);
  assert.deepEqual(state.writes, []);
  state = fixture({ status: 'ARCHIVED' });
  await assert.rejects(invoke('updateStatus', owner, { status: 'PUBLISHED' }), /cannot move/);
  await assert.rejects(
    invoke('create', owner, { availableAt: new Date('2026-09-12'), dueAt: new Date('2026-09-11') }),
    /Due date must be after/
  );
  assert.deepEqual(state.writes, []);
});
