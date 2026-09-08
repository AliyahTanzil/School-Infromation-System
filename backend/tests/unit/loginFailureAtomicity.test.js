import assert from 'node:assert/strict';
import test from 'node:test';
import bcrypt from 'bcryptjs';

process.env.JWT_ACCESS_SECRET ??= 'test-access-secret';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret';

const passwordHash = bcrypt.hashSync('CorrectPassword123!', 4);
const db = { $on() {} };
globalThis.__prisma = db;
const { login } = await import('../../src/application/services/authService.js');

function fixture(failure) {
  let state = {
    user: {
      id: 'user-active',
      email: 'active@example.com',
      passwordHash,
      status: 'ACTIVE',
      failedLoginCount: 4,
      lockedUntil: null,
    },
    attempts: [],
    audits: [],
  };

  db.loginAttempt = { count: async () => 0 };
  db.user = { findFirst: async () => state.user };
  db.$transaction = async (work, options) => {
    assert.equal(options.isolationLevel, 'Serializable');
    const draft = globalThis.structuredClone(state);
    const tx = {
      user: {
        findFirst: async () => draft.user,
        update: async ({ data }) => {
          if (failure === 'user') throw Error('user write failed');
          draft.user.failedLoginCount += data.failedLoginCount.increment;
          if (data.lockedUntil) {
            draft.user.lockedUntil = data.lockedUntil;
            draft.user.status = data.status;
          }
          return draft.user;
        },
      },
      loginAttempt: {
        create: async ({ data }) => {
          if (failure === 'attempt') throw Error('attempt write failed');
          draft.attempts.push(data);
          return data;
        },
      },
      auditLogin: {
        create: async ({ data }) => {
          if (failure === 'audit') throw Error('audit write failed');
          draft.audits.push(data);
          return data;
        },
      },
    };
    const result = await work(tx);
    state = draft;
    return result;
  };
  return () => state;
}

const attemptLogin = () =>
  login({
    email: 'active@example.com',
    password: 'WrongPassword123!',
    context: { ipAddress: '127.0.0.1', userAgent: 'security-test' },
  });

test('failed-password lockout, attempt telemetry and audit commit together', async () => {
  const state = fixture();
  await assert.rejects(attemptLogin(), /Invalid email or password/);
  assert.equal(state().user.failedLoginCount, 5);
  assert.equal(state().user.status, 'LOCKED');
  assert.ok(state().user.lockedUntil instanceof Date);
  assert.equal(state().attempts[0].failureReason, 'invalid_password');
  assert.equal(state().audits[0].event, 'ACCOUNT_LOCKED');
});

for (const failure of ['user', 'attempt', 'audit']) {
  test(`failed-password handling rolls back on ${failure} persistence failure`, async () => {
    const state = fixture(failure);
    await assert.rejects(attemptLogin(), new RegExp(`${failure} write failed`));
    assert.equal(state().user.failedLoginCount, 4);
    assert.equal(state().user.status, 'ACTIVE');
    assert.deepEqual(state().attempts, []);
    assert.deepEqual(state().audits, []);
  });
}
