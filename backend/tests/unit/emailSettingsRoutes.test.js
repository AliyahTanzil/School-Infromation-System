import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import express from 'express';
import request from 'supertest';
import config from '../../src/config/index.js';
const db = {
  $on() {},
  school: {
    findMany: async () => [{ id: 'school', tenantId: '11111111-1111-4111-8111-111111111111' }],
  },
  tenantSetting: { findUnique: async () => null },
};
globalThis.__prisma = db;
const { default: router } =
  await import('../../src/presentation/http/routes/emailSettingsRoutes.js');
const { default: sessions } =
  await import('../../src/infrastructure/repositories/sessionRepository.js');
const { default: access } = await import('../../src/application/services/accessContextService.js');
const { default: permissions } =
  await import('../../src/application/services/authorizationService.js');
const { signAccessToken } = await import('../../src/infrastructure/auth/tokenService.js');
const app = express();
app.use(express.json());
app.use('/settings/email', router);
app.use((error, _req, res, next) => {
  if (res.headersSent) return next(error);
  return res.status(error.statusCode || 500).json({ code: error.code });
});

test('email setup denies anonymous, unauthorized and cross-school access before reading SMTP settings', async (t) => {
  const secret = config.auth.accessTokenSecret;
  config.auth.accessTokenSecret = 'test-access-key-with-at-least-32-characters';
  t.after(() => {
    config.auth.accessTokenSecret = secret;
    mock.restoreAll();
  });
  const read = mock.method(db.tenantSetting, 'findUnique', async () => null);
  const tenantId = '11111111-1111-4111-8111-111111111111';
  let identity = { tenantId, roles: ['STUDENT'], platformRole: null };
  let allowed = false;
  mock.method(sessions, 'findActiveById', async () => ({ userId: 'user' }));
  mock.method(access, 'resolveAccessContext', async () => identity);
  mock.method(permissions, 'can', async () => allowed);
  const token = signAccessToken({ sub: 'user', email: 'user@example.com', sessionId: 'session' });
  for (const method of ['get', 'put']) {
    assert.equal((await request(app)[method]('/settings/email')).status, 401);
    assert.equal(
      (await request(app)[method]('/settings/email').auth(token, { type: 'bearer' })).status,
      403
    );
  }
  identity = { tenantId: '22222222-2222-4222-8222-222222222222', roles: ['SCHOOL_ADMIN'] };
  allowed = true;
  assert.equal(
    (await request(app).get('/settings/email').auth(token, { type: 'bearer' })).status,
    403
  );
  assert.equal(read.mock.callCount(), 0);
  identity = { tenantId, roles: ['SCHOOL_ADMIN'] };
  const admin = await request(app).get('/settings/email').auth(token, { type: 'bearer' });
  assert.equal(admin.status, 200);
  assert.equal(admin.headers['cache-control'], 'no-store');
  assert.equal(admin.body.data.password, undefined);
  identity = { tenantId: null, platformRole: 'OWNER', roles: [] };
  allowed = false;
  assert.equal(
    (await request(app).get('/settings/email').auth(token, { type: 'bearer' })).status,
    200
  );
});
