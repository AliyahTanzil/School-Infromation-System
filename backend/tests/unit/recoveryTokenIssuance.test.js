import assert from 'node:assert/strict';
import test, { mock } from 'node:test';

const db = { $on() {} };
globalThis.__prisma = db;
const { forgotPassword, resendVerification } =
  await import('../../src/application/services/authService.js');
const { default: emailService } = await import('../../src/infrastructure/email/emailService.js');
const { hashToken } = await import('../../src/shared/utils/tokenUtils.js');

for (const [operation, table, mailMethod] of [
  [forgotPassword, 'passwordResetToken', 'sendPasswordResetEmail'],
  [resendVerification, 'emailVerificationToken', 'sendVerificationEmail'],
]) {
  for (const failure of [null, 'invalidate', 'create', 'commit']) {
    test(`${table} replacement ${failure ? `rolls back on ${failure} failure` : 'commits before email delivery'}`, async (t) => {
      let state = [{ id: 'old', userId: 'user', usedAt: null }];
      const before = structuredClone(state);
      let committed = false;
      const deliveries = [];
      db.user = { findFirst: async () => ({ id: 'user', email: 'user@example.test' }) };
      db.auditLogin = { create: async () => ({}) };
      db.$transaction = async (work) => {
        const draft = structuredClone(state);
        await work({
          [table]: {
            updateMany: async ({ where, data }) => {
              assert.deepEqual(where, { userId: 'user', usedAt: null });
              assert.ok(data.usedAt instanceof Date);
              if (failure === 'invalidate') throw new Error('invalidate failed');
              draft[0].usedAt = data.usedAt;
              return { count: 1 };
            },
            create: async ({ data }) => {
              if (failure === 'create') throw new Error('create failed');
              assert.equal(data.userId, 'user');
              assert.ok(data.expiresAt > new Date());
              assert.equal(data.requestedIp, '127.0.0.1');
              assert.equal(data.userAgent, 'test-client');
              draft.push(data);
              return data;
            },
          },
        });
        if (failure === 'commit') throw new Error('commit failed');
        state = draft;
        committed = true;
      };
      const mail = mock.method(emailService, mailMethod, async (payload) => {
        assert.equal(committed, true);
        deliveries.push(payload);
      });
      t.after(() => mail.mock.restore());
      const invoke = () =>
        operation({
          email: 'user@example.test',
          context: { ipAddress: '127.0.0.1', userAgent: 'test-client' },
        });
      if (failure) {
        await assert.rejects(invoke(), new RegExp(`${failure} failed`));
        assert.deepEqual(state, before);
        assert.equal(deliveries.length, 0);
      } else {
        await invoke();
        assert.ok(state[0].usedAt instanceof Date);
        assert.equal(state.length, 2);
        assert.equal(deliveries.length, 1);
        assert.equal(deliveries[0].to, 'user@example.test');
        assert.equal(state[1].tokenHash, hashToken(deliveries[0].token));
        assert.equal(JSON.stringify(state).includes(deliveries[0].token), false);
      }
    });
  }
}
