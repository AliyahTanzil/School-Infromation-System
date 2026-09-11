import test from 'node:test';
import assert from 'node:assert/strict';

const db = { $on() {} };
globalThis.__prisma = db;
const controller = await import('../../src/presentation/http/controllers/quizController.js');
const { default: router } = await import('../../src/presentation/http/routes/quizRoutes.js');
const { default: guard } =
  await import('../../src/middleware/auth/authorizeSchoolAdminOrTeacher.js');
const { default: authenticate } = await import('../../src/middleware/auth/authenticate.js');
const { default: schoolContext } = await import('../../src/middleware/auth/teacherContext.js');
const scope = { tenantId: 'tenant', schoolId: 'school' };
const owner = { id: 'actor', roles: [], platformRole: 'OWNER' };

function fixture({ membership, status = 'DRAFT', missing = false } = {}) {
  const reads = [];
  const writes = [];
  db.digitalClassroom = {
    findFirst: async ({ where, include }) => {
      assert.deepEqual(where, { id: 'classroom', ...scope, status: 'ACTIVE' });
      assert.deepEqual(include.memberships.where, { userId: 'actor', status: 'ACTIVE' });
      return missing
        ? null
        : { ownerId: 'another', memberships: membership ? [{ role: membership }] : [] };
    },
  };
  db.quiz = {
    findFirst: async ({ where }) => {
      assert.deepEqual(where, { id: 'quiz', ...scope });
      return { id: 'quiz', classroomId: 'classroom', status, maxAttempts: 1, durationMinutes: 30 };
    },
    findMany: async (args) => {
      reads.push(args);
      return [];
    },
    findUnique: async (args) => {
      reads.push(args);
      return {};
    },
    create: async (args) => {
      writes.push(args);
      return args.data;
    },
    update: async (args) => {
      writes.push(args);
      return args.data;
    },
  };
  db.quizQuestion = {
    count: async () => 1,
    create: async (args) => {
      writes.push(args);
      return args.data;
    },
  };
  db.quizAttempt = {
    count: async () => 0,
    create: async (args) => {
      writes.push(args);
      return args.data;
    },
    findFirst: async ({ where }) => {
      assert.deepEqual(where, { id: 'attempt', studentId: 'actor', ...scope });
      return null;
    },
  };
  return { reads, writes };
}

async function invoke(name, user = owner) {
  let failure;
  const bodies = {
    create: { classroomId: 'classroom', title: 'Quiz' },
    addQuestion: { type: 'SHORT_ANSWER', prompt: 'Question', correctAnswer: 'Answer', points: 1 },
    changeStatus: { status: 'PUBLISHED' },
  };
  await controller[name](
    {
      user,
      schoolContext: scope,
      params: { id: 'quiz', attemptId: 'attempt' },
      query: { classroomId: 'classroom', platformRole: 'OWNER', roles: ['SCHOOL_ADMIN'] },
      body: bodies[name] ?? { platformRole: 'OWNER', roles: ['SCHOOL_ADMIN'] },
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

test('quiz route guards preserve context order and allow owners without expanding learner management', () => {
  const middleware = router.stack.filter((layer) => !layer.route).map((layer) => layer.handle);
  assert.deepEqual(middleware.slice(0, 2), [authenticate, schoolContext]);
  const access = middleware[2];
  for (const user of [
    owner,
    { roles: ['STUDENT'] },
    { roles: ['TEACHER'] },
    { roles: ['SCHOOL_ADMIN'] },
    { roles: ['PLATFORM_ADMIN'] },
  ]) {
    let calls = 0;
    access({ user }, {}, () => calls++);
    assert.equal(calls, 1);
  }
  for (const user of [
    undefined,
    { roles: ['PARENT'] },
    { roles: [] },
    { accountType: 'APPLICATION_MANAGER' },
  ]) {
    assert.throws(
      () => access({ user, body: { platformRole: 'OWNER' } }, {}, () => assert.fail()),
      /permission|Authentication/
    );
  }
  const management = router.stack.filter(
    ({ route }) =>
      route && ['/', '/:id/questions', '/:id/status'].includes(route.path) && !route.methods.get
  );
  assert.equal(management.length, 3);
  for (const { route } of management) assert.equal(route.stack[0].handle, guard);
  assert.throws(
    () => guard({ user: { roles: ['STUDENT'] } }, {}, () => assert.fail()),
    /permission/
  );
});

test('owner controller paths retain scoped staff reads and allow quiz administration', async () => {
  const { reads, writes } = fixture();
  for (const name of ['list', 'details', 'create', 'addQuestion', 'changeStatus'])
    await invoke(name);
  assert.deepEqual(reads[0].where, {
    ...scope,
    classroomId: 'classroom',
    status: { not: 'ARCHIVED' },
  });
  assert.equal(reads[1].include.questions.select.correctAnswer, true);
  assert.equal(reads[1].include.attempts.where, undefined);
  assert.equal(writes.length, 3);
  assert.deepEqual(writes[0].data, {
    ...scope,
    classroomId: 'classroom',
    title: 'Quiz',
    authorId: 'actor',
  });
});

test('student reads hide draft quizzes and answer keys despite forged query claims', async () => {
  const student = { id: 'actor', roles: ['STUDENT'] };
  let result = fixture({ membership: 'STUDENT' });
  await invoke('list', student);
  assert.equal(result.reads[0].where.status, 'PUBLISHED');
  await assert.rejects(invoke('details', student), /Quiz not found/);
  result = fixture({ membership: 'STUDENT', status: 'PUBLISHED' });
  await invoke('details', student);
  assert.equal(result.reads[0].include.questions.select.correctAnswer, undefined);
  assert.deepEqual(result.reads[0].include.attempts.where, { studentId: 'actor' });
});

test('teachers require classroom membership and students cannot manage quizzes', async () => {
  fixture();
  await assert.rejects(invoke('create', { id: 'actor', roles: ['TEACHER'] }), /not a member/);
  const { writes } = fixture({ membership: 'STUDENT' });
  for (const name of ['create', 'addQuestion', 'changeStatus']) {
    await assert.rejects(
      invoke(name, { id: 'actor', roles: ['STUDENT'] }),
      /Only classroom teachers/
    );
  }
  assert.equal(writes.length, 0);
  fixture({ membership: 'TEACHER' });
  await invoke('create', { id: 'actor', roles: ['TEACHER'] });
});

test('owner access preserves missing classroom and quiz lifecycle restrictions', async () => {
  fixture({ missing: true });
  await assert.rejects(invoke('create'), /classroom not found/);
  const { writes } = fixture({ status: 'ARCHIVED' });
  await assert.rejects(invoke('addQuestion'), /immutable/);
  await assert.rejects(invoke('changeStatus'), /cannot move/);
  assert.equal(writes.length, 0);
});

test('owners cannot take student attempts or modify another learner attempt', async () => {
  const { writes } = fixture({ status: 'PUBLISHED' });
  await assert.rejects(invoke('startAttempt'), /active student membership/);
  for (const name of ['saveAnswer', 'submitAttempt'])
    await assert.rejects(invoke(name), /attempt not found/);
  assert.equal(writes.length, 0);
  fixture({ membership: 'STUDENT', status: 'PUBLISHED' });
  await invoke('startAttempt', { id: 'actor', roles: ['STUDENT'] });
});
