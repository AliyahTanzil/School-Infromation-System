import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { changePasswordSchema } from '../../src/application/validators/authValidators.js';
import { changePassword } from '../../src/presentation/http/controllers/authController.js';
import authService from '../../src/application/services/authService.js';

test('password change rejects ownership fields and unsupported body properties', () => {
  const body = { currentPassword: 'current', newPassword: 'replacement' };
  assert.equal(changePasswordSchema.safeParse({ body }).success, true);
  for (const key of ['userId', 'sessionId', 'context', 'passwordHash', 'unexpected']) {
    assert.equal(
      changePasswordSchema.safeParse({ body: { ...body, [key]: 'forged' } }).success,
      false
    );
  }
});

test('password change bounds both passwords without trimming their contents', () => {
  for (const field of ['currentPassword', 'newPassword']) {
    for (const value of ['', 'x'.repeat(129), null, 42]) {
      const body = { currentPassword: 'current', newPassword: 'replacement', [field]: value };
      assert.equal(changePasswordSchema.safeParse({ body }).success, false);
    }
    const body = {
      currentPassword: 'current',
      newPassword: 'replacement',
      [field]: 'x'.repeat(128),
    };
    assert.equal(changePasswordSchema.safeParse({ body }).success, true);
  }
  const body = { currentPassword: ' current ', newPassword: ' replacement ' };
  assert.deepEqual(changePasswordSchema.parse({ body }).body, body);
});

test('password controller preserves authenticated identity even without validation middleware', async (t) => {
  let received;
  const service = mock.method(authService, 'changePassword', async (data) => {
    received = data;
  });
  t.after(() => service.mock.restore());
  let status;
  let payload;
  await changePassword(
    {
      user: { id: 'authenticated-user' },
      auth: { sessionId: 'authenticated-session' },
      ip: '127.0.0.1',
      get: () => undefined,
      body: {
        currentPassword: 'current',
        newPassword: 'replacement',
        userId: 'forged-user',
        sessionId: 'forged-session',
        context: { ipAddress: 'forged-ip' },
        passwordHash: 'forged-hash',
      },
    },
    {
      status(value) {
        status = value;
        return this;
      },
      json(value) {
        payload = value;
      },
    }
  );
  assert.equal(received.userId, 'authenticated-user');
  assert.equal(received.sessionId, 'authenticated-session');
  assert.equal(received.context.ipAddress, '127.0.0.1');
  assert.equal(received.currentPassword, 'current');
  assert.equal(received.newPassword, 'replacement');
  assert.equal(received.passwordHash, undefined);
  assert.equal(status, 200);
  assert.equal(payload.success, true);
});
