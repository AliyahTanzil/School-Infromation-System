import test from 'node:test';
import assert from 'node:assert/strict';

const db = { $on() {} };
globalThis.__prisma = db;
const controller =
  await import('../../src/presentation/http/controllers/digitalClassroomController.js');
const { default: router } =
  await import('../../src/presentation/http/routes/digitalClassroomRoutes.js');
const { default: guard } =
  await import('../../src/middleware/auth/authorizeSchoolAdminOrTeacher.js');
const { default: authenticate } = await import('../../src/middleware/auth/authenticate.js');
const { default: schoolContext } = await import('../../src/middleware/auth/teacherContext.js');
const scope = { tenantId: 'tenant', schoolId: 'school' };
const owner = { id: 'actor', platformRole: 'OWNER', roles: [] };

function fixture({ member = false, ownsClassroom = false, missing = false } = {}) {
  const queries = [];
  const writes = [];
  db.digitalClassroom = {
    findMany: async ({ where }) => {
      queries.push(where);
      return [];
    },
    findFirst: async ({ where, include }) => {
      assert.deepEqual(where, { id: 'classroom', ...scope, status: { not: 'ARCHIVED' } });
      assert.deepEqual(include.memberships.where, { userId: 'actor', status: 'ACTIVE' });
      return missing
        ? null
        : {
            id: 'classroom',
            ownerId: ownsClassroom ? 'actor' : 'classroom-owner',
            memberships: member ? [{}] : [],
          };
    },
    update: async (args) => {
      writes.push(['archive', args]);
      return args.data;
    },
  };
  db.user = {
    findFirst: async ({ where }) => {
      assert.deepEqual(where, { id: 'recipient', tenantId: 'tenant', deletedAt: null });
      return { id: 'recipient' };
    },
  };
  db.digitalClassroomMember = {
    upsert: async (args) => {
      writes.push(['add', args]);
      return args.create;
    },
    updateMany: async (args) => {
      writes.push(['remove', args]);
      return { count: 1 };
    },
  };
  return { queries, writes };
}

async function invoke(name, user = owner, target = 'recipient') {
  let failure;
  const result = await controller[name](
    {
      user,
      schoolContext: scope,
      params: { classroomId: 'classroom', userId: target },
      body: {
        userId: 'recipient',
        role: 'STUDENT',
        platformRole: 'OWNER',
        roles: ['SCHOOL_ADMIN'],
      },
      query: { platformRole: 'OWNER' },
    },
    {
      status() {
        return this;
      },
      json(data) {
        return data;
      },
    },
    (error) => {
      failure = error;
    }
  );
  if (failure) throw failure;
  return result;
}

test('digital classroom mutation guards admit owners and teachers after school resolution', () => {
  assert.deepEqual(
    router.stack.filter((layer) => !layer.route).map((layer) => layer.handle),
    [authenticate, schoolContext]
  );
  assert.equal(
    router.stack.findIndex((layer) => layer.route),
    2
  );
  const mutations = router.stack.filter((layer) => layer.route && !layer.route.methods.get);
  assert.equal(mutations.length, 4);
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

test('owner classroom lists retain school scope without membership filtering', async () => {
  const { queries } = fixture();
  await invoke('list');
  assert.deepEqual(queries[0], { ...scope, status: { not: 'ARCHIVED' } });
});

for (const name of ['details', 'addMember', 'removeMember', 'archive']) {
  test(`owner classroom ${name} works without classroom ownership or membership`, async () => {
    const { writes } = fixture();
    await invoke(name);
    assert.equal(writes.length, name === 'details' ? 0 : 1);
    if (name === 'addMember')
      assert.deepEqual(writes[0][1].create, {
        classroomId: 'classroom',
        ...scope,
        userId: 'recipient',
        role: 'STUDENT',
      });
    if (name === 'removeMember')
      assert.deepEqual(writes[0][1].where, {
        classroomId: 'classroom',
        userId: 'recipient',
        ...scope,
        status: 'ACTIVE',
      });
  });
}

test('ordinary member teachers cannot gain management rights from request ownership claims', async () => {
  const { queries, writes } = fixture({ member: true });
  const teacher = { id: 'actor', roles: ['TEACHER'] };
  await invoke('list', teacher);
  assert.deepEqual(queries[0].OR, [
    { ownerId: 'actor' },
    { memberships: { some: { userId: 'actor', status: 'ACTIVE' } } },
  ]);
  await invoke('details', teacher);
  for (const name of ['addMember', 'removeMember', 'archive'])
    await assert.rejects(invoke(name, teacher), /Only the classroom owner/);
  assert.deepEqual(writes, []);
});

test('classroom-owning teachers retain management access', async () => {
  const { writes } = fixture({ ownsClassroom: true });
  for (const name of ['addMember', 'removeMember', 'archive'])
    await invoke(name, { id: 'actor', roles: ['TEACHER'] });
  assert.equal(writes.length, 3);
});

test('owners cannot remove classroom owners or operate on unavailable scoped classrooms', async () => {
  const { writes } = fixture();
  await assert.rejects(invoke('removeMember', owner, 'classroom-owner'), /owner cannot be removed/);
  assert.deepEqual(writes, []);
  const unavailable = fixture({ missing: true });
  for (const name of ['details', 'addMember', 'removeMember', 'archive'])
    await assert.rejects(invoke(name), /not found/);
  assert.deepEqual(unavailable.writes, []);
});
