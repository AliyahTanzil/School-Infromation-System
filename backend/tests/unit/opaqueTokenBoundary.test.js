import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import request from 'supertest';
import config from '../../src/config/index.js';
import {
  resetPasswordSchema,
  verifyEmailSchema,
  refreshSchema,
} from '../../src/application/validators/authValidators.js';
import { generateOpaqueToken } from '../../src/shared/utils/tokenUtils.js';

const prisma = { $on() {}, async $transaction() {} };
globalThis.__prisma = prisma;
const { default: resetTokens } =
  await import('../../src/infrastructure/repositories/passwordResetTokenRepository.js');
const { default: authService } = await import('../../src/application/services/authService.js');
const { default: sessionService } =
  await import('../../src/application/services/sessionService.js');
const { createApp } = await import('../../src/foundation/app.js');

const invalidTokens = [
  undefined,
  null,
  '',
  '   ',
  42,
  {},
  [],
  Buffer.from('token'),
  'x'.repeat(513),
];

test('opaque token services reject malformed input before database access', async (t) => {
  const transaction = mock.method(prisma, '$transaction', async () => {
    assert.fail('Invalid tokens must not start a transaction');
  });
  const lookup = mock.method(resetTokens, 'findByHash', async () => {
    assert.fail('Invalid tokens must not look up a reset link');
  });
  t.after(() => {
    transaction.mock.restore();
    lookup.mock.restore();
  });
  for (const token of invalidTokens) {
    for (const call of [
      () => authService.resetPassword({ token, password: 'replacement' }),
      () => authService.verifyEmail({ token }),
      () => sessionService.rotate({ refreshToken: token }),
    ]) {
      await assert.rejects(call(), { statusCode: 401, code: 'AUTHENTICATION_ERROR' });
    }
  }
  assert.equal(transaction.mock.callCount(), 0);
  assert.equal(lookup.mock.callCount(), 0);
});

test('token request schemas bound input before trimming and accept generated tokens', () => {
  for (const [schema, field] of [
    [resetPasswordSchema, 'token'],
    [verifyEmailSchema, 'token'],
    [refreshSchema, 'refreshToken'],
  ]) {
    for (const token of [
      ...invalidTokens.filter((value) => value !== undefined),
      `${' '.repeat(512)}x`,
    ]) {
      assert.equal(
        schema.safeParse({ body: { [field]: token, password: 'replacement' } }).success,
        false
      );
    }
    for (const token of [generateOpaqueToken(48), 'x'.repeat(512)]) {
      assert.equal(
        schema.safeParse({ body: { [field]: token, password: 'replacement' } }).success,
        true
      );
    }
  }
  assert.equal(refreshSchema.safeParse({ body: {} }).success, true);
});

test('active refresh routes reject JSON cookies and oversized cookies with safe 401 responses', async (t) => {
  const transaction = mock.method(prisma, '$transaction', async () => {
    assert.fail('Malformed cookies must not access persistence');
  });
  t.after(() => transaction.mock.restore());
  const app = createApp();
  for (const path of ['/api/auth/refresh', '/api/v1/auth/refresh']) {
    for (const token of ['j:{"private-token":"secret"}', 'j:["private-token"]', 'x'.repeat(513)]) {
      const response = await request(app)
        .post(path)
        .set('Cookie', `${config.auth.refreshCookieName}=${encodeURIComponent(token)}`)
        .send({});
      assert.equal(response.status, 401);
      assert.equal(response.body.error.code, 'AUTHENTICATION_ERROR');
      assert.doesNotMatch(JSON.stringify(response.body), /private-token|secret|TypeError|stack/);
    }
  }
  assert.equal(transaction.mock.callCount(), 0);
});
