import assert from 'node:assert/strict';
import test from 'node:test';

process.env.JWT_ACCESS_SECRET ??= 'test-access-secret';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret';
process.env.MAX_FAILED_LOGINS_PER_IP = '20';

let userLookups = 0;
const db = {
  $on() {},
  loginAttempt: {
    count: async ({ where }) => (where.ipAddress ? 20 : 0),
  },
  user: {
    findFirst: async () => {
      userLookups += 1;
      return null;
    },
  },
};
globalThis.__prisma = db;

const { login } = await import('../../src/application/services/authService.js');

test('login enforces the persisted per-IP failure limit before credential lookup', async () => {
  await assert.rejects(
    login({
      email: 'target@example.com',
      password: 'WrongPassword123!',
      context: { ipAddress: '203.0.113.10', userAgent: 'security-test' },
    }),
    (error) => error.statusCode === 429 && /Too many failed attempts/.test(error.message)
  );
  assert.equal(userLookups, 0);
});
