import test from 'node:test';
import assert from 'node:assert/strict';

const db = { $on() {} };
globalThis.__prisma = db;
const controller = await import('../../src/presentation/http/controllers/attendanceController.js');
const { default: router } = await import('../../src/presentation/http/routes/attendanceRoutes.js');
const { default: authenticate } = await import('../../src/middleware/auth/authenticate.js');
const { default: schoolContext } = await import('../../src/middleware/auth/teacherContext.js');
const { default: guard } =
  await import('../../src/middleware/auth/authorizeSchoolAdminOrTeacher.js');

const scope = { tenantId: 'tenant', schoolId: 'school' };
const owner = { id: 'actor', platformRole: 'OWNER', roles: [] };
const forged = {
  tenantId: 'foreign',
  schoolId: 'foreign',
  actorId: 'forged',
  platformRole: 'OWNER',
  roles: ['SCHOOL_ADMIN'],
  id: 'foreign',
};
const creation = { classId: 'class', title: 'Morning', sessionDate: new Date('2026-09-10') };
const bodies = {
  create: creation,
  changeStatus: { status: 'LOCKED' },
  markBulk: { records: [{ studentId: 'student', status: 'PRESENT' }] },
};

function fixture({ assigned = false, status = 'OPEN', missing = false } = {}) {
  const writes = [];
  const reads = [];
  const session = { id: 'session', classId: 'class', status, records: [] };
  const scoped = (where) => {
    assert.equal(where.tenantId, scope.tenantId);
    assert.equal(where.schoolId, scope.schoolId);
  };
  db.teacher = {
    findFirst: async ({ where }) => {
      scoped(where);
      assert.equal(where.userId, 'actor');
      assert.equal(where.status, 'ACTIVE');
      assert.equal(where.deletedAt, null);
      reads.push(['teacher', where]);
      return { id: 'teacher' };
    },
  };
  db.classTeacher = {
    findMany: async ({ where }) => {
      scoped(where.class);
      return assigned ? [{ classId: 'class' }] : [];
    },
  };
  db.teacherTeachingAssignment = {
    findMany: async ({ where }) => {
      scoped(where);
      return [];
    },
  };
  db.class = {
    findFirst: async ({ where }) => {
      scoped(where);
      return missing ? null : { id: 'class' };
    },
    findMany: async ({ where }) => {
      scoped(where);
      reads.push(['options', where]);
      return [];
    },
  };
  db.attendanceSession = {
    findFirst: async ({ where }) => {
      scoped(where);
      assert.equal(where.id, 'session');
      return missing ? null : session;
    },
    findMany: async ({ where }) => {
      scoped(where);
      reads.push(['list', where]);
      return [];
    },
    count: async ({ where }) => {
      scoped(where);
      return 0;
    },
    create: async ({ data }) => {
      writes.push(['create', data]);
      return session;
    },
    findUnique: async () => session,
    update: async ({ where, data }) => {
      assert.equal(where.id, 'session');
      writes.push(['status', data]);
      return { ...session, ...data };
    },
  };
  db.classEnrollment = {
    findMany: async ({ where }) => {
      scoped(where);
      return [];
    },
  };
  db.attendanceRecord = {
    update: async ({ where, data }) => {
      assert.deepEqual(where, {
        sessionId_studentId: { sessionId: 'session', studentId: 'student' },
      });
      assert.equal(data.markedById, 'actor');
      writes.push(['mark', data]);
    },
  };
  db.attendanceAudit = {
    create: async ({ data }) => {
      scoped(data);
      assert.equal(data.actorId, 'actor');
      writes.push(['audit', data]);
    },
  };
  db.$transaction = async (work) => work(db);
  return { reads, writes };
}

async function invoke(name, user = owner, extra = {}) {
  let response;
  await controller[name](
    {
      user,
      schoolContext: scope,
      params: { id: 'session' },
      body: { ...bodies[name], ...extra },
      query: extra,
    },
    {
      status() {
        return this;
      },
      json(data) {
        response = data;
      },
    }
  );
  return response;
}

test('attendance routes admit owners and teachers after authentication and school resolution', () => {
  assert.deepEqual(
    router.stack.filter((layer) => !layer.route).map((layer) => layer.handle),
    [authenticate, schoolContext, guard]
  );
  assert.equal(
    router.stack.findIndex((layer) => layer.route),
    3
  );
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
    {},
    { roles: ['STUDENT'] },
    { roles: ['PARENT'] },
    { roles: ['OWNER'] },
    { accountType: 'APPLICATION_MANAGER' },
  ]) {
    assert.throws(
      () =>
        guard({ user, body: forged, query: forged }, {}, () =>
          assert.fail('Access must be denied')
        ),
      user ? /permission/ : /Authentication required/
    );
  }
});

for (const name of ['options', 'list', 'create', 'get', 'changeStatus', 'markBulk']) {
  test(`owner attendance ${name} preserves scope without requiring a teacher identity`, async () => {
    const { reads, writes } = fixture();
    await invoke(name, owner, {
      ...forged,
      platformRole: 'MEMBER',
      roles: [],
      createdById: 'forged',
    });
    assert.equal(
      reads.some(([kind]) => kind === 'teacher'),
      false
    );
    for (const [kind, where] of reads)
      if (kind === 'options' || kind === 'list') assert.equal(where.id?.in, undefined);
    if (name === 'create')
      assert.deepEqual(writes[0], [
        'create',
        { ...scope, createdById: 'actor', ...creation, periodId: undefined },
      ]);
    if (name === 'changeStatus' || name === 'markBulk')
      assert.equal(
        writes.some(([kind]) => kind === 'audit'),
        true
      );
  });
}

test('forged owner context cannot broaden teacher attendance lists or options', async () => {
  const { reads } = fixture();
  for (const name of ['list', 'options'])
    await invoke(name, { id: 'actor', roles: ['TEACHER'] }, forged);
  assert.deepEqual(reads.find(([kind]) => kind === 'list')[1].classId, { in: [] });
  assert.deepEqual(reads.find(([kind]) => kind === 'options')[1].id, { in: [] });
});

test('unassigned teachers cannot read or mutate sessions using forged owner context', async () => {
  const { writes } = fixture();
  for (const name of ['create', 'get', 'changeStatus', 'markBulk'])
    await assert.rejects(invoke(name, { id: 'actor', roles: ['TEACHER'] }, forged), /not assigned/);
  assert.deepEqual(writes, []);
});

test('assigned teachers retain attendance reads and marking', async () => {
  const { writes } = fixture({ assigned: true });
  await invoke('get', { id: 'actor', roles: ['TEACHER'] });
  await invoke('markBulk', { id: 'actor', roles: ['TEACHER'] });
  assert.equal(
    writes.some(([kind]) => kind === 'mark'),
    true
  );
});

test('owner access preserves locked-session and lifecycle restrictions', async () => {
  const { writes } = fixture({ status: 'LOCKED' });
  await assert.rejects(invoke('markBulk'), /not open/);
  await assert.rejects(
    invoke('changeStatus', owner, { status: 'OPEN' }),
    /Invalid attendance session transition/
  );
  assert.deepEqual(writes, []);
});

test('owner access cannot use missing or out-of-scope classes and sessions', async () => {
  const { writes } = fixture({ missing: true });
  for (const name of ['create', 'get', 'changeStatus', 'markBulk'])
    await assert.rejects(invoke(name), /not found/);
  assert.deepEqual(writes, []);
});
