import assert from 'node:assert/strict';
import test from 'node:test';

const db = { $on() {}, user: {}, userSession: {} };
globalThis.__prisma = db;
const { default: authenticate } = await import('../../src/middleware/auth/authenticate.js');
const { signAccessToken } = await import('../../src/infrastructure/auth/tokenService.js');
const token = signAccessToken({ sub: 'user-a', sessionId: 'session-a', roles: ['PLATFORM_ADMIN'] });
const activeUser = () => ({
  id: 'user-a',
  status: 'ACTIVE',
  tenantId: 'school-tenant',
  accountType: 'TENANT_ADMIN',
  platformRole: null,
  deletedAt: null,
  lockedUntil: null,
  roles: [{ role: { code: 'SCHOOL_ADMIN', deletedAt: null } }],
});

function fixture(user, session = { id: 'session-a', userId: 'user-a' }) {
  db.user.findUnique = async ({ where }) => {
    assert.equal(where.id, 'user-a');
    return user;
  };
  db.userSession.findFirst = async ({ where }) => {
    assert.equal(where.id, 'session-a');
    assert.equal(where.revokedAt, null);
    assert.ok(where.expiresAt.gt instanceof Date);
    return session;
  };
  return { get: () => `Bearer ${token}` };
}

for (const status of ['INVITED', 'PENDING_VERIFICATION', 'SUSPENDED', 'LOCKED', 'DISABLED']) {
  test(`an existing access token cannot authorize a ${status} account`, async () => {
    const req = fixture({ ...activeUser(), status });
    let called = false;
    await assert.rejects(
      authenticate(req, {}, () => {
        called = true;
      }),
      (error) => error.code === 'ACCOUNT_UNAVAILABLE' && error.statusCode === 403
    );
    assert.equal(called, false);
    assert.equal(req.auth, undefined);
  });
}

test('an active temporary lockout blocks an otherwise active account', async () => {
  const req = fixture({ ...activeUser(), lockedUntil: new Date(Date.now() + 60000) });
  await assert.rejects(
    authenticate(req, {}, () => assert.fail('must not authorize')),
    { code: 'ACCOUNT_UNAVAILABLE' }
  );
});

test('an expired temporary lockout allows an active account and uses current database roles', async () => {
  const req = fixture({ ...activeUser(), lockedUntil: new Date(Date.now() - 60000) });
  let called = false;
  await authenticate(req, {}, () => {
    called = true;
  });
  assert.equal(called, true);
  assert.deepEqual(req.user.roles, ['SCHOOL_ADMIN']);
  assert.equal(req.auth.sessionId, 'session-a');
});

test('deleted and missing accounts cannot retain authenticated access', async () => {
  for (const user of [null, { ...activeUser(), deletedAt: new Date() }]) {
    await assert.rejects(
      authenticate(fixture(user), {}, () => assert.fail('must not authorize')),
      { code: 'ACCOUNT_UNAVAILABLE' }
    );
  }
});

test('missing or foreign sessions are rejected before account lookup', async () => {
  for (const session of [null, { id: 'session-a', userId: 'other-user' }]) {
    const req = fixture(activeUser(), session);
    db.user.findUnique = async () => assert.fail('must not resolve account');
    await assert.rejects(
      authenticate(req, {}, () => assert.fail('must not authorize')),
      /Session is no longer valid/
    );
  }
});
