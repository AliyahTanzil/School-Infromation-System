import assert from 'node:assert/strict';
import test from 'node:test';
import bcrypt from 'bcryptjs';

process.env.JWT_ACCESS_SECRET ??= 'test-access-secret';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret';

const attempts = [];
let selectedUser = null;
const db = {
  $on() {},
  loginAttempt: {
    count: async () => 0,
    create: async ({ data }) => {
      attempts.push(data);
      return data;
    },
  },
  user: {
    findFirst: async () => selectedUser,
  },
};
globalThis.__prisma = db;

const { login } = await import('../../src/application/services/authService.js');
const passwordHash = bcrypt.hashSync('CorrectPassword123!', 4);
const context = { ipAddress: '127.0.0.1', userAgent: 'security-test' };

function user(status, extra = {}) {
  return {
    id: `user-${status.toLowerCase()}`,
    email: `${status.toLowerCase()}@example.com`,
    passwordHash,
    status,
    failedLoginCount: 0,
    lockedUntil: null,
    ...extra,
  };
}

async function expectGenericRejection(email) {
  await assert.rejects(
    login({ email, password: 'CorrectPassword123!', context }),
    (error) => error.message === 'Invalid email or password'
  );
}

test('login does not reveal whether an account exists or its lifecycle state', async () => {
  attempts.length = 0;
  const cases = [
    { account: null, email: 'missing@example.com', reason: 'user_not_found' },
    { account: user('SUSPENDED'), email: 'suspended@example.com', reason: 'account_suspended' },
    {
      account: user('PENDING_VERIFICATION'),
      email: 'pending@example.com',
      reason: 'account_pending_activation',
    },
    {
      account: user('ACTIVE', { lockedUntil: new Date(Date.now() + 60_000) }),
      email: 'locked@example.com',
      reason: 'account_locked',
    },
  ];

  for (const entry of cases) {
    selectedUser = entry.account;
    await expectGenericRejection(entry.email);
  }

  assert.deepEqual(
    attempts.map(({ failureReason }) => failureReason),
    cases.map(({ reason }) => reason)
  );
});
