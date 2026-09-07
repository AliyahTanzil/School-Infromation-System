import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
const db = { $on() {} };
globalThis.__prisma = db;
const { changePassword } = await import('../../src/application/services/authService.js');
const { default: passwords } = await import('../../src/infrastructure/hash/passwordService.js');
mock.method(passwords, 'verifyPassword', async (value) => value === 'correct');
mock.method(passwords, 'hashPassword', async () => 'replacement-hash');
function fixture({ failure, stale = false, foreign = false } = {}) {
  let state = {
    hash: 'old-hash',
    resetLinks: true,
    sessions: ['current', 'other'],
    tokens: ['current', 'other'],
    audits: [],
  };
  db.user = { findFirst: async () => ({ id: 'owner', passwordHash: 'old-hash' }) };
  db.$transaction = async (work) => {
    const draft = globalThis.structuredClone(state);
    await work({
      userSession: {
        findFirst: async ({ where }) => {
          assert.equal(where.id, 'current');
          assert.equal(where.revokedAt, null);
          assert.ok(where.expiresAt.gt instanceof Date);
          return { id: 'current', userId: foreign ? 'stranger' : 'owner' };
        },
        updateMany: async ({ where }) => {
          assert.equal(where.userId, 'owner');
          assert.deepEqual(where.id, { not: 'current' });
          if (failure === 'sessions') throw Error('sessions failed');
          draft.sessions = ['current'];
        },
      },
      user: {
        updateMany: async ({ where, data }) => {
          assert.equal(where.id, 'owner');
          assert.equal(where.passwordHash, 'old-hash');
          assert.equal(where.status, 'ACTIVE');
          assert.equal(where.deletedAt, null);
          assert.equal(where.OR[0].lockedUntil, null);
          assert.ok(where.OR[1].lockedUntil.lte instanceof Date);
          if (stale) return { count: 0 };
          if (failure === 'password') throw Error('password failed');
          draft.hash = data.passwordHash;
          return { count: 1 };
        },
      },
      passwordResetToken: {
        updateMany: async ({ where }) => {
          assert.equal(where.userId, 'owner');
          if (failure === 'reset') throw Error('reset failed');
          draft.resetLinks = false;
        },
      },
      refreshToken: {
        updateMany: async ({ where }) => {
          assert.equal(where.userId, 'owner');
          assert.deepEqual(where.sessionId, { not: 'current' });
          if (failure === 'tokens') throw Error('tokens failed');
          draft.tokens = ['current'];
        },
      },
      auditLogin: {
        create: async ({ data }) => {
          if (failure === 'audit') throw Error('audit failed');
          draft.audits.push(data);
        },
      },
    });
    state = draft;
  };
  return () => state;
}
const change = (currentPassword = 'correct') =>
  changePassword({
    userId: 'owner',
    sessionId: 'current',
    currentPassword,
    newPassword: 'new',
  });
test('password change preserves the current device and invalidates other access paths', async () => {
  const state = fixture();
  await change();
  assert.equal(state().hash, 'replacement-hash');
  assert.equal(state().resetLinks, false);
  assert.deepEqual(state().sessions, ['current']);
  assert.deepEqual(state().tokens, ['current']);
  assert.equal(state().audits[0].metadata.via, 'change_password');
});
for (const failure of ['password', 'reset', 'tokens', 'sessions', 'audit']) {
  test(`password change rolls back on ${failure} failure`, async () => {
    const state = fixture({ failure });
    const before = globalThis.structuredClone(state());
    await assert.rejects(change(), new RegExp(`${failure} failed`));
    assert.deepEqual(state(), before);
  });
}
for (const options of [{ stale: true }, { foreign: true }]) {
  test(`password change rejects stale credentials or foreign sessions (${JSON.stringify(options)})`, async () => {
    const state = fixture(options);
    const before = globalThis.structuredClone(state());
    await assert.rejects(change(), /credentials changed|Session is no longer valid/);
    assert.deepEqual(state(), before);
  });
}
test('incorrect current password never starts a transaction', async () => {
  fixture();
  db.$transaction = async () => assert.fail('must not write');
  await assert.rejects(change('wrong'), /Current password is incorrect/);
});
