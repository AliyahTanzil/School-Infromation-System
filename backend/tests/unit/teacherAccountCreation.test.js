import assert from 'node:assert/strict';
import test, { mock } from 'node:test';

const db = { $on() {} };
globalThis.__prisma = db;
const { createUser } = await import('../../src/application/services/userManagementService.js');
const { default: passwordService } =
  await import('../../src/infrastructure/hash/passwordService.js');
const { clearSingleSchoolCache } =
  await import('../../src/application/services/singleSchoolContextService.js');

for (const fail of [false, true]) {
  test(`teacher account creation ${fail ? 'rolls back when the profile fails' : 'commits the identity, profile and audit together'}`, async (t) => {
    clearSingleSchoolCache();
    const hash = mock.method(passwordService, 'hashPassword', async () => 'test-hash');
    t.after(() => hash.mock.restore());
    db.user = { findFirst: async () => null };
    db.school = { findMany: async () => [{ id: 'school', tenantId: 'tenant' }] };
    let committed = [];
    db.$transaction = async (work) => {
      const pending = [];
      let user;
      const result = await work({
        user: {
          create: async ({ data }) => {
            user = { id: 'user', ...data };
            pending.push('user');
            return user;
          },
          findFirst: async () => user,
        },
        school: { findFirst: async () => ({ id: 'school', tenantId: 'tenant' }) },
        teacher: {
          findUnique: async () => null,
          findMany: async () => [],
          create: async ({ data }) => {
            assert.equal(data.userId, user.id);
            assert.equal(data.tenantId, user.tenantId);
            if (fail) throw new Error('profile failed');
            pending.push('teacher');
            return data;
          },
        },
        userAudit: {
          create: async () => {
            pending.push('audit');
          },
        },
      });
      committed = pending;
      return result;
    };
    const invoke = () =>
      createUser(
        {
          email: 'teacher@example.test',
          firstName: 'Real',
          lastName: 'Teacher',
          password: 'unused',
          accountType: 'TEACHER',
          status: 'ACTIVE',
        },
        'actor',
        'tenant'
      );
    if (fail) {
      await assert.rejects(invoke(), /profile failed/);
      assert.deepEqual(committed, []);
    } else {
      const result = await invoke();
      assert.equal(result.accountType, 'TEACHER');
      assert.equal(result.passwordHash, undefined);
      assert.deepEqual(committed, ['user', 'teacher', 'audit']);
    }
  });
}
