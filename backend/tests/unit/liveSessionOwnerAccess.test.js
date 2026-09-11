import test from 'node:test';
import assert from 'node:assert/strict';

const db = { $on() {} };
globalThis.__prisma = db;
const controller =
  await import('../../src/presentation/http/controllers/classroomLiveSessionController.js');
const { default: router } =
  await import('../../src/presentation/http/routes/classroomLiveSessionRoutes.js');
const { default: guard } =
  await import('../../src/middleware/auth/authorizeSchoolAdminOrTeacher.js');
const { default: authenticate } = await import('../../src/middleware/auth/authenticate.js');
const { default: schoolContext } = await import('../../src/middleware/auth/teacherContext.js');
const scope = { tenantId: 'tenant', schoolId: 'school' };
const owner = { id: 'actor', roles: [], platformRole: 'OWNER' };

function fixture({ membership, missing = false, status = 'SCHEDULED' } = {}) {
  const queries = [];
  const writes = [];
  db.digitalClassroom = {
    findFirst: async ({ where, include }) => {
      assert.deepEqual(where, { id: 'classroom', ...scope, status: 'ACTIVE' });
      assert.deepEqual(include.memberships.where, { userId: 'actor', status: 'ACTIVE' });
      return missing
        ? null
        : { ownerId: 'another', memberships: membership ? [{ role: membership }] : [] };
    },
    findMany: async ({ where }) => {
      queries.push(['classrooms', where]);
      return [{ id: 'classroom' }];
    },
  };
  db.classroomLiveSession = {
    findMany: async ({ where }) => {
      queries.push(['sessions', where]);
      return [];
    },
    findFirst: async ({ where }) => {
      assert.deepEqual(where, { id: 'session', ...scope });
      return { id: 'session', classroomId: 'classroom', status };
    },
    create: async ({ data }) => {
      assert.equal(data.hostId, 'actor');
      assert.equal(data.tenantId, 'tenant');
      assert.equal(data.schoolId, 'school');
      assert.equal(data.platformRole, undefined);
      writes.push(data);
      return { ...data, id: 'session' };
    },
    update: async (args) => {
      writes.push(args);
      return args.data;
    },
  };
  db.digitalClassroomMember = {
    findMany: async ({ where }) => {
      assert.deepEqual(where, { classroomId: 'classroom', ...scope, status: 'ACTIVE' });
      return [];
    },
  };
  return { queries, writes };
}

async function invoke(name, user = owner, extra = {}) {
  let failure;
  await controller[name](
    {
      user,
      schoolContext: scope,
      params: { id: 'session' },
      body: {
        classroomId: 'classroom',
        title: 'Lesson',
        status: name === 'create' ? 'SCHEDULED' : 'CANCELLED',
        platformRole: 'OWNER',
        roles: ['SCHOOL_ADMIN'],
        ...extra,
      },
      query: { classroomId: 'classroom', platformRole: 'OWNER' },
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

test('live session routes enforce school context and owner/teacher mutation roles', () => {
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

test('owner session lists and recordings retain school scope without membership filters', async () => {
  const { queries } = fixture();
  await invoke('list');
  await invoke('listRecordings');
  assert.deepEqual(queries, [
    ['sessions', { ...scope, classroomId: 'classroom', status: { not: 'CANCELLED' } }],
    ['classrooms', { ...scope, status: 'ACTIVE' }],
    ['sessions', { ...scope, classroomId: { in: ['classroom'] }, recordingUrl: { not: null } }],
  ]);
});

test('owners can read, create and change scoped sessions without classroom membership', async () => {
  const { writes } = fixture();
  await invoke('get');
  await invoke('create');
  await invoke('updateStatus');
  assert.equal(writes.length, 2);
  assert.deepEqual(writes[1], { where: { id: 'session' }, data: { status: 'CANCELLED' } });
});

test('learner recording queries stay membership restricted and forged owner claims cannot grant management', async () => {
  const { queries, writes } = fixture({ membership: 'STUDENT' });
  const student = { id: 'actor', roles: ['STUDENT'] };
  await invoke('listRecordings', student);
  assert.deepEqual(queries[0][1].OR, [
    { ownerId: 'actor' },
    { memberships: { some: { userId: 'actor', status: 'ACTIVE' } } },
  ]);
  await invoke('get', student);
  for (const name of ['create', 'updateStatus'])
    await assert.rejects(invoke(name, student), /Only classroom teachers/);
  assert.deepEqual(writes, []);
});

test('classroom teacher membership remains necessary for ordinary teacher management', async () => {
  fixture();
  await assert.rejects(invoke('create', { id: 'actor', roles: ['TEACHER'] }), /not a member/);
  const { writes } = fixture({ membership: 'TEACHER' });
  await invoke('create', { id: 'actor', roles: ['TEACHER'] });
  await invoke('updateStatus', { id: 'actor', roles: ['TEACHER'] });
  assert.equal(writes.length, 2);
});

test('owner access preserves unavailable-classroom and terminal lifecycle restrictions', async () => {
  let state = fixture({ missing: true });
  for (const name of ['list', 'get', 'create', 'updateStatus'])
    await assert.rejects(invoke(name), /not found/);
  assert.deepEqual(state.writes, []);
  state = fixture({ status: 'ENDED' });
  await assert.rejects(invoke('updateStatus', owner, { status: 'LIVE' }), /cannot move/);
  assert.deepEqual(state.writes, []);
});
