import assert from 'node:assert/strict';
import test from 'node:test';

process.env.JWT_ACCESS_SECRET ??= 'test-access-secret';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret';

const db = { $on() {} };
globalThis.__prisma = db;
const { issueSession } = await import('../../src/application/services/sessionService.js');
const { hashRefreshToken, verifyAccessToken } =
  await import('../../src/infrastructure/auth/tokenService.js');
const input = {
  user: { id: 'user', email: 'user@example.com' },
  context: {
    deviceFingerprint: 'device',
    deviceType: 'desktop',
    ipAddress: '127.0.0.1',
    userAgent: 'test',
  },
  deviceName: 'My laptop',
};
function fixture(failure) {
  let state = { sessions: [], tokens: [], devices: [], success: [] };
  db.$transaction = async (work) => {
    const draft = globalThis.structuredClone(state);
    const result = await work({
      success: draft.success,
      userSession: {
        create: async ({ data }) => {
          if (failure === 'session') throw Error('session failed');
          const record = { id: 'new-session', ...data };
          draft.sessions.push(record);
          return record;
        },
      },
      userRole: {
        findMany: async ({ where }) => {
          assert.equal(where.userId, 'user');
          if (failure === 'roles') throw Error('roles failed');
          return [{ role: { code: 'TEACHER' } }];
        },
      },
      refreshToken: {
        create: async ({ data }) => {
          if (failure === 'token') throw Error('token failed');
          draft.tokens.push(data);
        },
      },
      trustedDevice: {
        upsert: async ({ where, create }) => {
          assert.deepEqual(where.userId_fingerprint, { userId: 'user', fingerprint: 'device' });
          if (failure === 'device') throw Error('device failed');
          draft.devices.push(create);
        },
      },
    });
    if (failure === 'commit') throw Error('commit failed');
    state = draft;
    return result;
  };
  return () => state;
}

test('session issuance commits linked records and returns matching token claims', async () => {
  const state = fixture();
  const result = await issueSession(input);
  assert.equal(state().sessions.length, 1);
  assert.equal(state().tokens.length, 1);
  assert.equal(state().devices.length, 1);
  assert.equal(state().sessions[0].deviceName, 'My laptop');
  assert.equal(state().tokens[0].sessionId, result.session.id);
  assert.equal(state().tokens[0].parentTokenId, null);
  assert.equal(state().tokens[0].tokenHash, hashRefreshToken(result.refreshToken));
  assert.equal(JSON.stringify(state()).includes(result.refreshToken), false);
  const claims = verifyAccessToken(result.accessToken);
  assert.equal(claims.sub, 'user');
  assert.equal(claims.sessionId, result.session.id);
  assert.deepEqual(claims.roles, ['TEACHER']);
});

test('session issuance commits caller success records in the same transaction', async () => {
  const state = fixture();
  const result = await issueSession({
    ...input,
    onIssued: async ({ tx, session, roles }) => {
      assert.equal(session.id, 'new-session');
      assert.deepEqual(roles, ['TEACHER']);
      tx.success.push({ sessionId: session.id });
    },
  });
  assert.equal(result.session.id, 'new-session');
  assert.deepEqual(state().success, [{ sessionId: 'new-session' }]);
});

test('session issuance rolls everything back when caller success recording fails', async () => {
  const state = fixture();
  await assert.rejects(
    issueSession({
      ...input,
      onIssued: async () => {
        throw Error('success audit failed');
      },
    }),
    /success audit failed/
  );
  assert.deepEqual(state(), { sessions: [], tokens: [], devices: [], success: [] });
});

for (const failure of ['session', 'roles', 'token', 'device', 'commit']) {
  test(`session issuance returns no credentials and rolls back on ${failure} failure`, async () => {
    const state = fixture(failure);
    await assert.rejects(issueSession(input), new RegExp(`${failure} failed`));
    assert.deepEqual(state(), { sessions: [], tokens: [], devices: [], success: [] });
  });
}
