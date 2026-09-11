import test from 'node:test';
import assert from 'node:assert/strict';

const db = { $on() {} };
globalThis.__prisma = db;
const { globalSearch } = await import('../../src/application/services/searchService.js');
const { search } = await import('../../src/presentation/http/controllers/searchController.js');
const { default: router } = await import('../../src/presentation/http/routes/searchRoutes.js');
const { default: authenticate } = await import('../../src/middleware/auth/authenticate.js');
const { default: schoolContext } = await import('../../src/middleware/auth/singleSchoolContext.js');
const scope = { tenantId: 'tenant', schoolId: 'school' };
const owner = { id: 'actor', roles: [], platformRole: 'OWNER' };

function fixture({ classrooms = true } = {}) {
  const calls = [];
  let classroomCalls = 0;
  db.digitalClassroom = {
    findMany: async (args) => {
      calls.push(['classroom', args.where]);
      classroomCalls++;
      return classroomCalls === 1 && classrooms
        ? [{ id: 'room', ownerId: 'other', memberships: [] }]
        : [];
    },
  };
  for (const model of [
    'assignment',
    'digitalMaterial',
    'classroomAnnouncement',
    'classroomStreamPost',
    'subject',
  ]) {
    db[model] = {
      findMany: async ({ where }) => {
        calls.push([model, where]);
        return [];
      },
    };
  }
  return calls;
}

async function invoke(user = owner, q = 'math') {
  let result;
  await search(
    {
      user,
      schoolContext: scope,
      query: {
        q,
        platformRole: 'OWNER',
        roles: ['SCHOOL_ADMIN'],
        tenantId: 'foreign',
        schoolId: 'foreign',
      },
    },
    {
      json(value) {
        result = value.data;
      },
    }
  );
  return result;
}

test('search routes authenticate and resolve single-school context before search', () => {
  assert.deepEqual(
    router.stack.filter((layer) => !layer.route).map((layer) => layer.handle),
    [authenticate, schoolContext]
  );
});

test('persisted owner search spans scoped classrooms and manages assignment visibility', async () => {
  const calls = fixture();
  await invoke();
  assert.deepEqual(calls[0][1], { ...scope, status: { not: 'ARCHIVED' } });
  assert.equal(calls.length, 7);
  for (const [, where] of calls) {
    assert.equal(where.tenantId, scope.tenantId);
    assert.equal(where.schoolId, scope.schoolId);
  }
  assert.deepEqual(calls[1][1].id, { in: ['room'] });
  for (const model of [
    'assignment',
    'digitalMaterial',
    'classroomAnnouncement',
    'classroomStreamPost',
  ]) {
    const where = calls.find(([name]) => name === model)[1];
    assert.deepEqual(where.classroomId, { in: ['room'] });
  }
  const assignment = calls.find(([name]) => name === 'assignment')[1];
  assert.deepEqual(assignment.AND[0].OR[0], { classroomId: { in: ['room'] } });
  assert.equal(calls.find(([name]) => name === 'digitalMaterial')[1].status, 'ACTIVE');
  assert.equal(calls.find(([name]) => name === 'classroomAnnouncement')[1].status, 'PUBLISHED');
  assert.equal(calls.find(([name]) => name === 'classroomStreamPost')[1].status, 'PUBLISHED');
});

test('forged owner query claims cannot bypass membership or learner assignment filters', async () => {
  for (const user of [
    { id: 'actor', roles: ['STUDENT'] },
    { id: 'actor', roles: ['TEACHER'] },
    { id: 'actor', roles: [], accountType: 'APPLICATION_MANAGER' },
  ]) {
    const calls = fixture();
    await invoke(user);
    assert.deepEqual(calls[0][1].OR, [
      { ownerId: 'actor' },
      { memberships: { some: { userId: 'actor', status: 'ACTIVE' } } },
    ]);
    const visibility = calls.find(([name]) => name === 'assignment')[1].AND[0].OR;
    assert.deepEqual(visibility[0], { classroomId: { in: [] } });
    assert.deepEqual(visibility[1].status, { in: ['PUBLISHED', 'CLOSED'] });
    assert.ok(visibility[1].OR[1].availableAt.lte instanceof Date);
  }
});

test('existing administrators retain scoped search access', async () => {
  for (const roles of [['SCHOOL_ADMIN'], ['PLATFORM_ADMIN']]) {
    const calls = fixture();
    await invoke({ id: 'actor', roles });
    assert.equal(calls[0][1].OR, undefined);
    assert.deepEqual(calls.find(([name]) => name === 'assignment')[1].AND[0].OR[0], {
      classroomId: { in: ['room'] },
    });
  }
});

test('missing tenant, school or actor fails before queries even for owners and blank search', async () => {
  const calls = fixture();
  for (const [context, actor] of [
    [{}, 'actor'],
    [{ tenantId: 'tenant' }, 'actor'],
    [{ schoolId: 'school' }, 'actor'],
    [scope, undefined],
  ]) {
    for (const query of ['', 'math']) {
      await assert.rejects(globalSearch(context, actor, owner, query, db), /scope required/);
    }
  }
  assert.deepEqual(calls, []);
});

test('empty searches and users without accessible classrooms do not query classroom content', async () => {
  const emptyCalls = fixture();
  assert.equal((await invoke(owner, '   ')).totalResults, 0);
  assert.deepEqual(emptyCalls, []);
  const calls = fixture({ classrooms: false });
  assert.equal((await invoke()).totalResults, 0);
  assert.deepEqual(
    calls.map(([name]) => name),
    ['classroom', 'classroom', 'subject']
  );
});
