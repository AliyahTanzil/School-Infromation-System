import test from 'node:test';
import assert from 'node:assert/strict';

const db = { $on() {} };
globalThis.__prisma = db;
const service = await import('../../src/application/services/materialService.js');
const controller = await import('../../src/presentation/http/controllers/materialController.js');
const { default: router } = await import('../../src/presentation/http/routes/materialRoutes.js');
const { default: guard } =
  await import('../../src/middleware/auth/authorizeSchoolAdminOrTeacher.js');
const { default: authenticate } = await import('../../src/middleware/auth/authenticate.js');
const { default: schoolContext } = await import('../../src/middleware/auth/teacherContext.js');
const scope = { tenantId: 'tenant', schoolId: 'school' };
const owner = { id: 'actor', roles: [], platformRole: 'OWNER' };

function fixture({ membership, missing = false } = {}) {
  const events = [];
  db.digitalClassroom = {
    findFirst: async ({ where, include }) => {
      events.push('authorize');
      assert.deepEqual(where, { id: 'classroom', ...scope, status: { not: 'ARCHIVED' } });
      assert.deepEqual(include.memberships.where, { userId: 'actor', status: 'ACTIVE' });
      return missing
        ? null
        : { ownerId: 'another', memberships: membership ? [{ role: membership }] : [] };
    },
  };
  db.digitalMaterial = {
    findMany: async ({ where }) => {
      assert.deepEqual(where, { ...scope, classroomId: 'classroom', status: 'ACTIVE' });
      return [];
    },
    findFirst: async ({ where }) => {
      assert.deepEqual(where, { id: 'material', ...scope, status: 'ACTIVE' });
      return { id: 'material', classroomId: 'classroom', pathname: 'private/path' };
    },
    create: async ({ data }) => {
      events.push('persist');
      assert.equal(data.tenantId, 'tenant');
      assert.equal(data.schoolId, 'school');
      assert.equal(data.uploaderId, 'actor');
      assert.equal(data.platformRole, undefined);
      return data;
    },
    update: async ({ where, data }) => {
      assert.deepEqual(where, { id: 'material' });
      assert.deepEqual(data, { status: 'ARCHIVED' });
      events.push('archive');
      return data;
    },
  };
  const upload = controller.createMaterialUploader(async (_path, _buffer, options) => {
    events.push('blob');
    assert.equal(options.access, 'private');
    return { pathname: 'private/path' };
  });
  return { events, upload };
}

async function invoke(handler, user = owner) {
  let failure;
  await handler(
    {
      user,
      schoolContext: scope,
      params: { id: 'material' },
      query: { classroomId: 'classroom', platformRole: 'OWNER' },
      body: {
        classroomId: 'classroom',
        title: 'Lesson',
        platformRole: 'OWNER',
        roles: ['SCHOOL_ADMIN'],
      },
      file: {
        originalname: 'lesson.pdf',
        mimetype: 'application/pdf',
        size: 4,
        buffer: Buffer.from('test'),
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

test('material mutation guards precede uploads and preserve role and school boundaries', () => {
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

test('owner upload checks classroom access before private storage and again before persistence', async () => {
  const { events, upload } = fixture();
  await invoke(upload);
  assert.deepEqual(events, ['authorize', 'blob', 'authorize', 'persist']);
});

test('forged owner claims cannot trigger blob uploads by unauthorized users', async () => {
  for (const membership of [undefined, 'STUDENT']) {
    const { events, upload } = fixture({ membership });
    await assert.rejects(
      invoke(upload, { id: 'actor', roles: ['TEACHER'] }),
      /not a member|Only classroom teachers/
    );
    assert.deepEqual(events, ['authorize']);
  }
});

test('classroom teachers retain material upload access', async () => {
  const { events, upload } = fixture({ membership: 'TEACHER' });
  await invoke(upload, { id: 'actor', roles: ['TEACHER'] });
  assert.deepEqual(events, ['authorize', 'blob', 'authorize', 'persist']);
});

test('owner material lists, download lookup and archival preserve scoped access without membership', async () => {
  const { events } = fixture();
  await invoke(controller.listMaterials);
  assert.equal((await service.getById(scope, 'material', 'actor', owner)).pathname, 'private/path');
  await invoke(controller.archiveMaterial);
  assert.equal(events.filter((event) => event === 'archive').length, 1);
});

test('learner members can read materials but cannot archive them using owner claims', async () => {
  const { events } = fixture({ membership: 'STUDENT' });
  const student = { id: 'actor', roles: ['STUDENT'] };
  await invoke(controller.listMaterials, student);
  await service.getById(scope, 'material', 'actor', student);
  await assert.rejects(invoke(controller.archiveMaterial, student), /Only classroom teachers/);
  assert.equal(events.includes('archive'), false);
});

test('owner access cannot upload to or read an unavailable scoped classroom', async () => {
  const { events, upload } = fixture({ missing: true });
  await assert.rejects(invoke(upload), /not found/);
  await assert.rejects(invoke(controller.listMaterials), /not found/);
  await assert.rejects(service.getById(scope, 'material', 'actor', owner), /not found/);
  assert.equal(events.includes('blob'), false);
});
