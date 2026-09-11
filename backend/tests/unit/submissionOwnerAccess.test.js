import test from 'node:test';
import assert from 'node:assert/strict';

const db = { $on() {} };
globalThis.__prisma = db;
const controller = await import('../../src/presentation/http/controllers/submissionController.js');
const { default: router } = await import('../../src/presentation/http/routes/submissionRoutes.js');
const { default: authenticate } = await import('../../src/middleware/auth/authenticate.js');
const { default: schoolContext } = await import('../../src/middleware/auth/teacherContext.js');
const scope = { tenantId: 'tenant', schoolId: 'school' };
const owner = { id: 'actor', roles: [], platformRole: 'OWNER' };
const student = { id: 'actor', roles: ['STUDENT'] };

function fixture({ membership, missing = false, submission = true, status = 'PUBLISHED' } = {}) {
  const reads = [];
  const writes = [];
  db.assignment = {
    findFirst: async ({ where, include }) => {
      assert.deepEqual(where, { id: 'assignment', ...scope, status: { not: 'ARCHIVED' } });
      assert.deepEqual(include.classroom.include.memberships.where, {
        userId: 'actor',
        status: 'ACTIVE',
      });
      return missing
        ? null
        : {
            id: 'assignment',
            classroomId: 'classroom',
            status,
            classroom: {
              ownerId: 'another',
              memberships: membership ? [{ role: membership }] : [],
            },
          };
    },
  };
  db.studentSubmission = {
    findMany: async ({ where }) => {
      reads.push(where);
      return [];
    },
    findFirst: async ({ where }) => {
      assert.deepEqual(where, { id: 'submission', ...scope, studentId: 'actor' });
      return submission
        ? { assignmentId: 'assignment', status: 'SUBMITTED', assignment: { status } }
        : null;
    },
    findUnique: async ({ where }) => {
      if (where.id) return { id: where.id };
      assert.deepEqual(where.tenantId_schoolId_assignmentId_studentId, {
        ...scope,
        assignmentId: 'assignment',
        studentId: 'actor',
      });
      return null;
    },
    create: async ({ data }) => {
      writes.push(data);
      return { id: 'submission', ...data };
    },
    update: async (args) => {
      writes.push(args);
      return args.data;
    },
  };
  db.submissionVersion = {
    create: async ({ data }) => {
      writes.push(data);
      return data;
    },
  };
  db.$transaction = async (callback, options) => {
    assert.equal(options.isolationLevel, 'Serializable');
    return callback(db);
  };
  return { reads, writes };
}

async function invoke(name, user = owner, query = { assignmentId: 'assignment' }) {
  let failure;
  await controller[name](
    {
      user,
      schoolContext: scope,
      params: { id: 'submission' },
      query: { ...query, platformRole: 'OWNER', roles: ['SCHOOL_ADMIN'] },
      body: {
        assignmentId: 'assignment',
        body: 'Work',
        attachments: [],
        status: 'DRAFT',
        platformRole: 'OWNER',
        roles: ['SCHOOL_ADMIN'],
        studentId: 'victim',
        tenantId: 'other',
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

test('submission guard follows authentication and school context and accepts persisted owners', () => {
  const middleware = router.stack.filter((layer) => !layer.route).map((layer) => layer.handle);
  assert.deepEqual(middleware.slice(0, 2), [authenticate, schoolContext]);
  assert.equal(middleware.length, 3);
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
});

test('owners review scoped assignment submissions without classroom membership', async () => {
  const { reads } = fixture();
  await invoke('list');
  assert.deepEqual(reads, [{ ...scope, assignmentId: 'assignment' }]);
  await assert.rejects(invoke('list', owner, {}), /assignmentId is required/);
  fixture({ missing: true });
  await assert.rejects(invoke('list'), /Assignment not found/);
});

test('student lists remain personal despite forged owner and administrator fields', async () => {
  const { reads } = fixture({ membership: 'STUDENT' });
  await invoke('list', student);
  await invoke('list', student, {});
  assert.deepEqual(reads, [
    { ...scope, studentId: 'actor', assignmentId: 'assignment' },
    { ...scope, studentId: 'actor' },
  ]);
});

test('teacher review requires active classroom teacher membership', async () => {
  const teacher = { id: 'actor', roles: ['TEACHER'] };
  fixture();
  await assert.rejects(invoke('list', teacher), /not a member/);
  fixture({ membership: 'STUDENT' });
  await assert.rejects(invoke('list', teacher), /Only classroom teachers/);
  const { reads } = fixture({ membership: 'TEACHER' });
  await invoke('list', teacher);
  assert.deepEqual(reads, [{ ...scope, assignmentId: 'assignment' }]);
});

test('owner review privilege does not bypass student membership or retraction ownership', async () => {
  const { writes } = fixture();
  await assert.rejects(invoke('save'), /active student classroom membership/);
  await assert.rejects(invoke('updateStatus'), /active student classroom membership/);
  assert.equal(writes.length, 0);
  fixture({ submission: false });
  await assert.rejects(invoke('updateStatus'), /Submission not found/);
});

test('student version writes and retractions preserve authenticated identity and lifecycle', async () => {
  const { writes } = fixture({ membership: 'STUDENT' });
  await invoke('save', student);
  assert.deepEqual(writes[0], {
    ...scope,
    assignmentId: 'assignment',
    studentId: 'actor',
    status: 'DRAFT',
    submittedAt: null,
  });
  assert.deepEqual(writes[1], {
    ...scope,
    submissionId: 'submission',
    version: 1,
    body: 'Work',
    attachments: [],
  });
  await invoke('updateStatus', student);
  assert.deepEqual(writes[2], {
    where: { id: 'submission' },
    data: { status: 'DRAFT', submittedAt: null },
  });
  fixture({ membership: 'STUDENT', status: 'CLOSED' });
  await assert.rejects(invoke('save', student), /Only published assignments/);
  await assert.rejects(invoke('updateStatus', student), /no longer accepts retractions/);
});
