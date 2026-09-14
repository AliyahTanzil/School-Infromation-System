import assert from 'node:assert/strict';
import test from 'node:test';
import { ensureTeacherAccount } from '../../src/application/services/teacherAccountService.js';

const user = {
  id: 'user',
  tenantId: 'tenant',
  accountType: 'TEACHER',
  status: 'ACTIVE',
  firstName: 'Real',
  lastName: 'Teacher',
  email: 'teacher@example.test',
};
function database({ linked = null, matches = [], school = true, count = 1 } = {}) {
  const writes = [];
  return {
    writes,
    school: {
      findFirst: async ({ where }) => {
        assert.deepEqual(where, { id: 'school', tenantId: 'tenant' });
        return school ? { id: 'school' } : null;
      },
    },
    teacher: {
      findUnique: async () => linked,
      findMany: async ({ where }) => {
        assert.equal(where.schoolId, 'school');
        assert.equal(where.tenantId, 'tenant');
        return matches;
      },
      create: async ({ data }) => {
        writes.push(data);
        return { id: 'teacher', ...data };
      },
      updateMany: async (args) => {
        writes.push(args);
        return { count };
      },
    },
  };
}
test('creates a linked school teacher from the account identity without credentials or employment guesses', async () => {
  const db = database();
  const result = await ensureTeacherAccount(db, user, 'school');
  assert.equal(result.action, 'created');
  assert.deepEqual(db.writes[0], {
    tenantId: 'tenant',
    schoolId: 'school',
    userId: 'user',
    employeeNumber: 'T-user',
    status: 'ACTIVE',
    profile: { create: { firstName: 'Real', lastName: 'Teacher', email: user.email } },
  });
});
test('pending accounts get applicant profiles', async () => {
  const db = database();
  await ensureTeacherAccount(db, { ...user, status: 'PENDING_VERIFICATION' }, 'school');
  assert.equal(db.writes[0].status, 'APPLICANT');
});
test('existing links preserve teacher lifecycle and never write on rerun', async () => {
  const db = database({
    linked: {
      id: 'teacher',
      tenantId: 'tenant',
      schoolId: 'school',
      status: 'SUSPENDED',
      deletedAt: new Date(),
    },
  });
  assert.equal((await ensureTeacherAccount(db, user, 'school')).action, 'existing');
  assert.deepEqual(db.writes, []);
});
test('links an unambiguous unlinked profile without replacing its details', async () => {
  const db = database({ matches: [{ id: 'teacher', userId: null, status: 'ON_LEAVE' }] });
  assert.equal((await ensureTeacherAccount(db, user, 'school')).action, 'linked');
  assert.deepEqual(db.writes, [
    {
      where: {
        id: 'teacher',
        tenantId: 'tenant',
        schoolId: 'school',
        userId: null,
        deletedAt: null,
      },
      data: { userId: 'user' },
    },
  ]);
});
test('rejects foreign ownership, ambiguous matches and deleted profiles', async () => {
  for (const options of [
    { school: false },
    { linked: { tenantId: 'other', schoolId: 'school' } },
    { linked: { tenantId: 'tenant', schoolId: 'other' } },
    { matches: [{}, {}] },
    { matches: [{ userId: 'other' }] },
    { matches: [{ deletedAt: new Date() }] },
  ]) {
    const db = database(options);
    await assert.rejects(ensureTeacherAccount(db, user, 'school'));
    assert.deepEqual(db.writes, []);
  }
  for (const invalid of [
    null,
    { ...user, tenantId: null },
    { ...user, accountType: 'STAFF' },
    { ...user, deletedAt: new Date() },
  ]) {
    await assert.rejects(ensureTeacherAccount({}, invalid, 'school'));
  }
});
test('rejects competing profile linking', async () => {
  const db = database({ matches: [{ id: 'teacher' }], count: 0 });
  await assert.rejects(ensureTeacherAccount(db, user, 'school'), /changed during linking/);
});
