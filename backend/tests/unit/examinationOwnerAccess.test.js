import test from 'node:test';
import assert from 'node:assert/strict';

const db = { $on() {} };
globalThis.__prisma = db;
const { default: examinationRouter } =
  await import('../../src/presentation/http/routes/examinationRoutes.js');
const { default: resultRouter } =
  await import('../../src/presentation/http/routes/resultRoutes.js');
const controller = await import('../../src/presentation/http/controllers/examinationController.js');
const { default: authenticate } = await import('../../src/middleware/auth/authenticate.js');
const { default: schoolContext } = await import('../../src/middleware/auth/teacherContext.js');

for (const [name, router] of [
  ['examination', examinationRouter],
  ['result', resultRouter],
]) {
  test(`${name} route guards admit owners while preserving teacher lifecycle restrictions`, () => {
    assert.deepEqual(
      router.stack.filter((layer) => !layer.route).map((layer) => layer.handle),
      [authenticate, schoolContext]
    );
    const firstRoute = router.stack.findIndex((layer) => layer.route);
    assert.equal(firstRoute, 2);
    for (const { route } of router.stack.filter((layer) => layer.route)) {
      const guard = route.stack[0].handle;
      const teacherAllowed =
        route.methods.get || (name === 'examination' && route.path === '/:id/marks');
      for (const user of [
        { platformRole: 'OWNER', roles: [] },
        { roles: ['SCHOOL_ADMIN'] },
        { roles: ['PLATFORM_ADMIN'] },
      ]) {
        let calls = 0;
        guard({ user }, {}, () => calls++);
        assert.equal(calls, 1, route.path);
      }
      let calls = 0;
      const teacherRequest = () => guard({ user: { roles: ['TEACHER'] } }, {}, () => calls++);
      if (teacherAllowed) {
        teacherRequest();
        assert.equal(calls, 1, route.path);
      } else {
        assert.throws(teacherRequest, /permission/);
        assert.equal(calls, 0);
      }
      for (const user of [
        undefined,
        {},
        { roles: ['STUDENT'] },
        { roles: ['PARENT'] },
        { accountType: 'APPLICATION_MANAGER' },
        { roles: ['OWNER'] },
      ]) {
        assert.throws(
          () =>
            guard(
              { user, body: { platformRole: 'OWNER' }, query: { platformRole: 'OWNER' } },
              {},
              () => assert.fail('Access must be denied')
            ),
          user ? /permission/ : /Authentication required/
        );
      }
    }
  });
}

const context = { tenantId: 'tenant', schoolId: 'school' };
const input = { candidateId: 'candidate', subjectCode: 'MATH', score: 75, maxScore: 100 };
function fixture({
  status = 'MARKING',
  candidate = true,
  scheduled = true,
  assigned = false,
} = {}) {
  const writes = [];
  const queries = [];
  db.examination = {
    findFirst: async ({ where }) => {
      assert.deepEqual(where, { id: 'exam', ...context });
      return { id: 'exam', status };
    },
  };
  for (const [model, rows] of [
    ['examinationCandidate', candidate ? [{ id: 'candidate', classId: 'class' }] : []],
    ['examinationSchedule', scheduled ? [{ subjectCode: 'MATH', classId: 'class' }] : []],
    ['examinationMark', []],
    ['examinationAudit', []],
  ])
    db[model] = {
      findMany: async ({ where }) => {
        assert.deepEqual(where, { ...context, examinationId: 'exam' });
        return rows;
      },
    };
  db.examinationMark.upsert = async (args) => {
    writes.push(args);
    return args.create;
  };
  db.teacher = {
    findFirst: async ({ where }) => {
      queries.push('teacher');
      assert.deepEqual(where, { userId: 'actor', ...context, status: 'ACTIVE', deletedAt: null });
      return { id: 'teacher' };
    },
  };
  db.teacherTeachingAssignment = {
    findFirst: async ({ where }) => {
      queries.push('assignment');
      assert.deepEqual(where, {
        ...context,
        teacherId: 'teacher',
        classId: 'class',
        status: 'ACTIVE',
        subject: { code: 'MATH', ...context, deletedAt: null },
      });
      return assigned ? { id: 'assignment' } : null;
    },
  };
  return { writes, queries };
}
const request = (user, body = input) =>
  controller.upsertMark(
    {
      params: { id: 'exam' },
      schoolContext: context,
      body,
      user: { id: 'actor', ...user },
    },
    { json() {} }
  );

test('mark controller passes authenticated owner identity through to scoped persistence', async () => {
  const { writes, queries } = fixture();
  await request({ platformRole: 'OWNER', roles: [] });
  assert.deepEqual(queries, []);
  assert.equal(writes.length, 1);
  assert.deepEqual(writes[0].create, {
    ...context,
    examinationId: 'exam',
    candidateId: 'candidate',
    subjectCode: 'MATH',
    marks: 75,
    recordedById: 'actor',
  });
});

test('forged owner input cannot bypass the teacher assignment requirement', async () => {
  const { writes, queries } = fixture();
  await assert.rejects(
    request({ roles: ['TEACHER'] }, { ...input, platformRole: 'OWNER', roles: ['SCHOOL_ADMIN'] }),
    /not assigned/
  );
  assert.deepEqual(writes, []);
  assert.deepEqual(queries, ['teacher', 'assignment']);
});

test('assigned teachers retain scoped mark entry', async () => {
  const { writes, queries } = fixture({ assigned: true });
  await request({ roles: ['TEACHER'] });
  assert.equal(writes.length, 1);
  assert.deepEqual(queries, ['teacher', 'assignment']);
});

for (const [label, options, error] of [
  ['locked exams', { status: 'LOCKED' }, /locked/],
  ['missing candidates', { candidate: false }, /Candidate not found/],
  ['unscheduled subjects', { scheduled: false }, /not scheduled/],
])
  test(`owner access does not bypass ${label}`, async () => {
    const { writes } = fixture(options);
    await assert.rejects(request({ platformRole: 'OWNER', roles: [] }), error);
    assert.deepEqual(writes, []);
  });
