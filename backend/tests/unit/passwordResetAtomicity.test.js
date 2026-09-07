import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
const db = { $on() {} };
globalThis.__prisma = db;
const { resetPassword } = await import('../../src/application/services/authService.js');
const { default: passwords } = await import('../../src/infrastructure/hash/passwordService.js');
mock.method(passwords, 'hashPassword', async () => 'new-password-hash');

function fixture({ failure, unavailable = false, lostRace = false } = {}) {
  let state = {
    password: 'old-password-hash',
    used: false,
    invalidated: false,
    tokens: false,
    sessions: false,
    audits: [],
  };
  db.passwordResetToken = {
    findUnique: async () =>
      unavailable
        ? null
        : {
            id: 'reset',
            userId: 'owner',
            usedAt: state.used ? new Date() : null,
            expiresAt: new Date(Date.now() + 60000),
          },
  };
  db.$transaction = async (work) => {
    const draft = globalThis.structuredClone(state);
    await work({
      passwordResetToken: {
        updateMany: async ({ where }) => {
          if (where.id) {
            assert.equal(where.id, 'reset');
            assert.equal(where.usedAt, null);
            assert.ok(where.expiresAt.gt instanceof Date);
            if (lostRace || draft.used) return { count: 0 };
            draft.used = true;
            return { count: 1 };
          }
          assert.equal(where.userId, 'owner');
          if (failure === 'invalidate') throw Error('invalidate failed');
          draft.invalidated = true;
          return { count: 1 };
        },
      },
      user: {
        update: async ({ where, data }) => {
          assert.equal(where.id, 'owner');
          if (failure === 'password') throw Error('password failed');
          draft.password = data.passwordHash;
        },
      },
      refreshToken: {
        updateMany: async ({ where, data }) => {
          assert.equal(where.userId, 'owner');
          assert.equal(data.revokeReason, 'password_reset');
          if (failure === 'tokens') throw Error('tokens failed');
          draft.tokens = true;
        },
      },
      userSession: {
        updateMany: async ({ where }) => {
          assert.equal(where.userId, 'owner');
          if (failure === 'sessions') throw Error('sessions failed');
          draft.sessions = true;
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
const reset = () => resetPassword({ token: 'reset-secret', password: 'replacement' });

test('reset commits replacement, invalidates other links and revokes all account sessions', async () => {
  const state = fixture();
  await reset();
  assert.equal(state().password, 'new-password-hash');
  for (const key of ['used', 'invalidated', 'tokens', 'sessions']) assert.equal(state()[key], true);
  assert.equal(state().audits[0].event, 'PASSWORD_RESET_COMPLETED');
  await assert.rejects(reset(), /invalid or has expired/);
  assert.equal(state().audits.length, 1);
});

for (const failure of ['password', 'invalidate', 'tokens', 'sessions', 'audit']) {
  test(`reset rolls back token consumption and password on ${failure} failure`, async () => {
    const state = fixture({ failure });
    const before = globalThis.structuredClone(state());
    await assert.rejects(reset(), new RegExp(`${failure} failed`));
    assert.deepEqual(state(), before);
  });
}

for (const options of [{ unavailable: true }, { lostRace: true }]) {
  test(`invalid or competing reset cannot replace credentials (${JSON.stringify(options)})`, async () => {
    const state = fixture(options);
    const before = globalThis.structuredClone(state());
    await assert.rejects(reset(), /invalid or has expired/);
    assert.deepEqual(state(), before);
  });
}
