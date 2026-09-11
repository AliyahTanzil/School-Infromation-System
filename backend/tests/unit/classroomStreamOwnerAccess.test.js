import test from 'node:test';
import assert from 'node:assert/strict';

const db = { $on() {} };
globalThis.__prisma = db;
const controller =
  await import('../../src/presentation/http/controllers/classroomStreamController.js');
const { default: router } =
  await import('../../src/presentation/http/routes/classroomStreamRoutes.js');
const { default: authenticate } = await import('../../src/middleware/auth/authenticate.js');
const { default: schoolContext } = await import('../../src/middleware/auth/teacherContext.js');
const scope = { tenantId: 'tenant', schoolId: 'school' };
const owner = { id: 'actor', roles: [], platformRole: 'OWNER' };

function fixture({ membership, owns = false, missing = false, missingPost = false } = {}) {
  const reads = [];
  const writes = [];
  db.digitalClassroom = {
    findFirst: async ({ where, include }) => {
      assert.deepEqual(where, { id: 'classroom', ...scope, status: 'ACTIVE' });
      assert.deepEqual(include.memberships.where, { userId: 'actor', status: 'ACTIVE' });
      return missing
        ? null
        : {
            ownerId: owns ? 'actor' : 'another',
            memberships: membership ? [{ role: membership }] : [],
          };
    },
  };
  const findMany = async ({ where }) => {
    reads.push(where);
    assert.deepEqual(where, { ...scope, classroomId: 'classroom', status: 'PUBLISHED' });
    return [];
  };
  const create = async ({ data }) => {
    writes.push(data);
    return data;
  };
  db.classroomAnnouncement = { findMany, create };
  db.classroomStreamPost = {
    findMany,
    create,
    findFirst: async ({ where }) => {
      assert.deepEqual(where, { id: 'post', ...scope, status: 'PUBLISHED' });
      return missingPost ? null : { classroomId: 'classroom' };
    },
  };
  db.classroomStreamComment = { create };
  return { reads, writes };
}

async function invoke(name, user = owner, status = 'PUBLISHED') {
  let failure;
  let result;
  await controller[name](
    {
      user,
      schoolContext: scope,
      params: { classroomId: 'classroom', postId: 'post' },
      body: {
        title: 'Notice',
        body: 'Message',
        attachments: [],
        status,
        tenantId: 'foreign',
        schoolId: 'foreign',
        classroomId: 'foreign',
        authorId: 'victim',
        postId: 'foreign',
        platformRole: 'OWNER',
        roles: ['SCHOOL_ADMIN'],
      },
    },
    {
      status() {
        return this;
      },
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

test('stream routes authenticate and resolve school context before operations', () => {
  assert.deepEqual(
    router.stack.filter((layer) => !layer.route).map((layer) => layer.handle),
    [authenticate, schoolContext]
  );
});

test('persisted owners can read, announce, post and comment without classroom membership', async () => {
  const { reads, writes } = fixture();
  await invoke('list');
  await invoke('announce');
  await invoke('post');
  await invoke('comment');
  assert.equal(reads.length, 2);
  assert.equal(writes.length, 3);
  assert.ok(writes[0].publishedAt instanceof Date);
  assert.deepEqual(writes[0], {
    ...scope,
    classroomId: 'classroom',
    authorId: 'actor',
    title: 'Notice',
    body: 'Message',
    status: 'PUBLISHED',
    publishedAt: writes[0].publishedAt,
  });
  assert.deepEqual(writes[1], {
    ...scope,
    classroomId: 'classroom',
    authorId: 'actor',
    body: 'Message',
    attachments: [],
  });
  assert.deepEqual(writes[2], { ...scope, postId: 'post', authorId: 'actor', body: 'Message' });
});

test('owner draft announcements retain an empty publication timestamp', async () => {
  fixture();
  const result = await invoke('announce', owner, 'DRAFT');
  assert.equal(result.status, 'DRAFT');
  assert.equal(result.publishedAt, null);
});

test('missing scoped active classrooms reject every owner operation before content access', async () => {
  for (const name of ['list', 'announce', 'post', 'comment']) {
    const { reads, writes } = fixture({ missing: true });
    await assert.rejects(invoke(name), /Digital classroom not found/);
    assert.deepEqual(reads, []);
    assert.deepEqual(writes, []);
  }
  const { writes } = fixture({ missingPost: true });
  await assert.rejects(invoke('comment'), /stream post not found/);
  assert.deepEqual(writes, []);
});

test('request owner claims cannot grant stream access to nonmembers', async () => {
  for (const user of [
    { id: 'actor', roles: ['STUDENT'] },
    { id: 'actor', roles: ['TEACHER'] },
    { id: 'actor', roles: [], accountType: 'APPLICATION_MANAGER' },
  ]) {
    for (const name of ['list', 'announce', 'post', 'comment']) {
      const { reads, writes } = fixture();
      await assert.rejects(invoke(name, user), /not a member/);
      assert.deepEqual(reads, []);
      assert.deepEqual(writes, []);
    }
  }
});

test('student members may participate but cannot publish announcements', async () => {
  const { writes } = fixture({ membership: 'STUDENT' });
  const student = { id: 'actor', roles: ['STUDENT'] };
  await invoke('list', student);
  await invoke('post', student);
  await invoke('comment', student);
  await assert.rejects(invoke('announce', student), /Only classroom teachers/);
  assert.equal(writes.length, 2);
  await assert.rejects(
    invoke('announce', { id: 'actor', roles: ['TEACHER'] }),
    /Only classroom teachers/
  );
});

test('teacher members, classroom owners and existing administrators retain announcement access', async () => {
  for (const [options, roles] of [
    [{ membership: 'TEACHER' }, ['TEACHER']],
    [{ owns: true }, ['TEACHER']],
    [{}, ['SCHOOL_ADMIN']],
    [{}, ['PLATFORM_ADMIN']],
  ]) {
    const { writes } = fixture(options);
    await invoke('announce', { id: 'actor', roles });
    assert.equal(writes.length, 1);
  }
});
