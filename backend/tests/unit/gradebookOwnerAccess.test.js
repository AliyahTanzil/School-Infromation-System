import test from 'node:test';
import assert from 'node:assert/strict';

const db = { $on() {} };
globalThis.__prisma = db;
const controller = await import('../../src/presentation/http/controllers/gradebookController.js');
const { default: router } = await import('../../src/presentation/http/routes/gradebookRoutes.js');
const { default: authenticate } = await import('../../src/middleware/auth/authenticate.js');
const { default: schoolContext } = await import('../../src/middleware/auth/teacherContext.js');
const { default: staffGuard } =
  await import('../../src/middleware/auth/authorizeSchoolAdminOrTeacher.js');
const scope = { tenantId: 'tenant', schoolId: 'school' };
const owner = { id: 'actor', roles: [], platformRole: 'OWNER' };
const student = { id: 'actor', roles: ['STUDENT'] };

function fixture({
  membership,
  missing = false,
  gradeStatus = 'DRAFT',
  studentId = 'actor',
  rubricStatus = 'DRAFT',
} = {}) {
  const writes = [];
  const reads = [];
  const assignment = { id: 'assignment', classroomId: 'classroom', rubric: null };
  const submission = { assignmentId: 'assignment', assignment, studentId };
  const assertScope = (where) => {
    assert.equal(where.tenantId, scope.tenantId);
    assert.equal(where.schoolId, scope.schoolId);
  };
  const create = async ({ data }) => {
    writes.push(data);
    return { id: 'grade', ...data };
  };
  const update = async (args) => {
    writes.push(args);
    return args.data;
  };
  const findMany = async ({ where }) => {
    assertScope(where);
    reads.push(where);
    return [];
  };
  db.digitalClassroom = {
    findFirst: async ({ where, include }) => {
      assert.deepEqual(where, { id: 'classroom', ...scope, status: { not: 'ARCHIVED' } });
      assert.deepEqual(include.memberships.where, { userId: 'actor', status: 'ACTIVE' });
      return missing
        ? null
        : { ownerId: 'another', memberships: membership ? [{ role: membership }] : [] };
    },
  };
  db.rubric = {
    findMany,
    create,
    update,
    findFirst: async ({ where }) => {
      assertScope(where);
      return { classroomId: 'classroom', status: rubricStatus };
    },
  };
  db.assignment = {
    update,
    findFirst: async ({ where }) => {
      assertScope(where);
      return assignment;
    },
    findUnique: async () => assignment,
  };
  db.studentSubmission = {
    findMany,
    findFirst: async ({ where }) => {
      assertScope(where);
      return submission;
    },
  };
  db.submissionGrade = {
    update,
    findFirst: async ({ where }) => {
      assertScope(where);
      return { submission, status: gradeStatus };
    },
    findUnique: async () => ({ id: 'grade' }),
    upsert: async (args) => {
      writes.push(args);
      return { id: 'grade' };
    },
  };
  db.rubricScore = { deleteMany: async () => {}, createMany: create };
  db.gradeFeedback = { create };
  db.$transaction = async (callback) => callback(db);
  return { writes, reads };
}

async function invoke(name, user = owner, extra = {}) {
  let failure;
  await controller[name](
    {
      user,
      schoolContext: scope,
      params: { id: 'grade', assignmentId: 'assignment', submissionId: 'submission' },
      query: { classroomId: 'classroom', assignmentId: 'assignment', platformRole: 'OWNER' },
      body: {
        classroomId: 'classroom',
        title: 'Rubric',
        criteria: [],
        status: 'PUBLISHED',
        rubricId: 'rubric',
        score: 8,
        maxScore: 10,
        rubricScores: [],
        body: 'Feedback',
        tenantId: 'foreign',
        authorId: 'victim',
        graderId: 'victim',
        platformRole: 'OWNER',
        roles: ['SCHOOL_ADMIN'],
        ...extra,
      },
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

const operations = [
  'listRubrics',
  'createRubric',
  'changeRubricStatus',
  'assignRubric',
  'listGrades',
  'saveGrade',
  'releaseGrade',
  'addFeedback',
];

test('gradebook authenticates and resolves scope, allowing owners while guarding five staff mutations', () => {
  const middleware = router.stack.filter((layer) => !layer.route).map((layer) => layer.handle);
  assert.deepEqual(middleware.slice(0, 2), [authenticate, schoolContext]);
  for (const user of [
    owner,
    student,
    { roles: ['TEACHER'] },
    { roles: ['SCHOOL_ADMIN'] },
    { roles: ['PLATFORM_ADMIN'] },
  ]) {
    let calls = 0;
    middleware[2]({ user }, {}, () => calls++);
    assert.equal(calls, 1);
  }
  for (const user of [
    undefined,
    { roles: [] },
    { roles: ['PARENT'] },
    { accountType: 'APPLICATION_MANAGER' },
  ]) {
    assert.throws(
      () => middleware[2]({ user, body: { platformRole: 'OWNER' } }, {}, () => assert.fail()),
      /permission|Authentication/
    );
  }
  const staffPaths = [
    '/rubrics',
    '/rubrics/:id/status',
    '/assignments/:assignmentId/rubric',
    '/submissions/:submissionId/grade',
    '/grades/:id/release',
  ];
  const mutations = router.stack.filter(
    (layer) =>
      layer.route && !layer.route.methods.get && layer.route.path !== '/grades/:id/feedback'
  );
  assert.deepEqual(
    mutations.map((layer) => layer.route.path),
    staffPaths
  );
  for (const layer of mutations) {
    assert.equal(layer.route.stack[0].handle, staffGuard);
    let calls = 0;
    staffGuard({ user: owner }, {}, () => calls++);
    assert.equal(calls, 1);
    assert.throws(() => staffGuard({ user: student }, {}, () => assert.fail()), /permission/);
  }
});

test('persisted owners can use all eight scoped gradebook controller paths without membership', async () => {
  const { writes, reads } = fixture();
  for (const name of operations) await invoke(name);
  assert.deepEqual(reads, [
    { ...scope, classroomId: 'classroom' },
    { ...scope, assignmentId: 'assignment' },
  ]);
  assert.equal(writes.length, 6);
  assert.equal(writes[0].authorId, 'actor');
  assert.equal(writes[0].tenantId, scope.tenantId);
  assert.equal(writes[3].create.graderId, 'actor');
  assert.equal(writes[3].update.graderId, 'actor');
  assert.equal(writes[3].create.tenantId, scope.tenantId);
  assert.equal(writes[4].data.status, 'RELEASED');
  assert.deepEqual(writes[5], { gradeId: 'grade', authorId: 'actor', body: 'Feedback' });
});

test('owners cannot bypass scoped classroom lookup on any gradebook operation', async () => {
  for (const name of operations) {
    const { writes, reads } = fixture({ missing: true });
    await assert.rejects(invoke(name), /Classroom not found/);
    assert.deepEqual(writes, []);
    assert.deepEqual(reads, []);
  }
});

test('student lists expose only published rubrics and their own released grades despite forged claims', async () => {
  const { reads } = fixture({ membership: 'STUDENT' });
  await invoke('listRubrics', student);
  await invoke('listGrades', student);
  assert.deepEqual(reads, [
    { ...scope, classroomId: 'classroom', status: 'PUBLISHED' },
    {
      ...scope,
      assignmentId: 'assignment',
      studentId: 'actor',
      grade: { is: { status: 'RELEASED' } },
    },
  ]);
});

test('student feedback requires their own released grade', async () => {
  for (const options of [
    { gradeStatus: 'DRAFT' },
    { gradeStatus: 'RELEASED', studentId: 'other' },
  ]) {
    const { writes } = fixture({ membership: 'STUDENT', ...options });
    await assert.rejects(invoke('addFeedback', student), /Feedback is not available/);
    assert.deepEqual(writes, []);
  }
  const { writes } = fixture({ membership: 'STUDENT', gradeStatus: 'RELEASED' });
  await invoke('addFeedback', student);
  assert.deepEqual(writes, [{ gradeId: 'grade', authorId: 'actor', body: 'Feedback' }]);
});

test('teacher management requires classroom teacher membership and rejects student membership', async () => {
  const teacher = { id: 'actor', roles: ['TEACHER'] };
  for (const membership of [undefined, 'STUDENT']) {
    for (const name of operations.filter((item) => item !== 'listRubrics')) {
      const { writes } = fixture({ membership });
      await assert.rejects(invoke(name, teacher), /Only classroom teachers/);
      assert.deepEqual(writes, []);
    }
  }
  fixture({ membership: 'TEACHER' });
  for (const name of operations) await invoke(name, teacher);
});

test('owner access retains archived rubric and score validation rules', async () => {
  const { writes } = fixture({ rubricStatus: 'ARCHIVED' });
  await assert.rejects(invoke('changeRubricStatus'), /Archived rubrics/);
  await assert.rejects(invoke('saveGrade', owner, { score: 11 }), /Score cannot exceed/);
  await assert.rejects(
    invoke('saveGrade', owner, { rubricScores: [{ criterionId: 'foreign', points: 1 }] }),
    /outside the assigned rubric/
  );
  assert.deepEqual(writes, []);
});
