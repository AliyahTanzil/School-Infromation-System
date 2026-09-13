import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import express from 'express';
import request from 'supertest';
import router from '../../src/presentation/http/routes/authRoutes.js';
import authenticate from '../../src/middleware/auth/authenticate.js';
import sessionService from '../../src/application/services/sessionService.js';
import { sessionIdParamSchema } from '../../src/application/validators/authValidators.js';
import { errorHandler } from '../../src/foundation/middleware.js';

const sessionId = '11111111-1111-4111-8111-111111111111';
const route = router.stack.find((layer) => layer.route?.path === '/sessions/:id').route;

test('session deletion authenticates before validating the identifier', async () => {
  assert.equal(route.stack[0].handle, authenticate);
  const app = express();
  app.use(router);
  app.use(errorHandler);
  const response = await request(app).delete('/sessions/not-a-uuid');
  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, 'AUTHENTICATION_ERROR');
});

test('authenticated session deletion validates IDs before invoking the service', async (t) => {
  const calls = [];
  const revoke = mock.method(sessionService, 'revoke', async (data) => {
    calls.push(data);
  });
  t.after(() => revoke.mock.restore());
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { id: 'authenticated-owner' };
    req.auth = { sessionId: 'current-device' };
    next();
  });
  // Exercise the actual mounted validation/controller chain after authentication.
  app.delete('/sessions/:id', ...route.stack.slice(1).map((layer) => layer.handle));
  app.use(errorHandler);
  for (const id of ['not-a-uuid', '123', '%20']) {
    const response = await request(app).delete(`/sessions/${id}`);
    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  }
  assert.equal(calls.length, 0);
  const response = await request(app).delete(`/sessions/${sessionId}`).send({
    userId: 'forged-owner',
    sessionId: 'forged-device',
    reason: 'forged-reason',
  });
  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].userId, 'authenticated-owner');
  assert.equal(calls[0].sessionId, sessionId);
  assert.equal(calls[0].reason, 'user_revoked');
});

test('session identifier schema rejects undeclared parameter fields', () => {
  assert.equal(sessionIdParamSchema.safeParse({ params: { id: sessionId } }).success, true);
  assert.equal(
    sessionIdParamSchema.safeParse({ params: { id: sessionId, userId: 'forged' } }).success,
    false
  );
});
