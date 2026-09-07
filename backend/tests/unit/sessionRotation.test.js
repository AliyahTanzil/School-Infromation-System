import test from 'node:test';
import assert from 'node:assert/strict';
const db = { $on() {} };
globalThis.__prisma = db;
const { rotate } = await import('../../src/application/services/sessionService.js');
const { hashRefreshToken } = await import('../../src/infrastructure/auth/tokenService.js');

function fixture({
  replay = false,
  lostRace = false,
  failure,
  expired = false,
  foreign = false,
} = {}) {
  let state = { consumed: replay, sessionRevoked: false, children: [], audits: [] };
  db.$transaction = async (work) => {
    const draft = globalThis.structuredClone(state);
    const result = await work({
      refreshToken: {
        findUnique: async ({ where }) => {
          assert.equal(where.tokenHash, hashRefreshToken('original'));
          return {
            id: 'parent',
            userId: 'user',
            sessionId: 'session',
            revokedAt: draft.consumed ? new Date() : null,
            expiresAt: new Date(Date.now() + (expired ? -60000 : 60000)),
          };
        },
        updateMany: async ({ where }) => {
          if (where.id) {
            assert.equal(where.revokedAt, null);
            if (lostRace || draft.consumed) return { count: 0 };
            draft.consumed = true;
            return { count: 1 };
          }
          assert.equal(where.sessionId, 'session');
          draft.consumed = true;
          draft.children.forEach((child) => {
            child.revoked = true;
          });
          return { count: 1 };
        },
        create: async ({ data }) => {
          if (failure === 'create') throw Error('create failed');
          draft.children.push(data);
        },
      },
      userSession: {
        findFirst: async () =>
          draft.sessionRevoked ? null : { id: 'session', userId: foreign ? 'other' : 'user' },
        update: async () => {
          if (failure === 'touch') throw Error('touch failed');
        },
        updateMany: async ({ where }) => {
          assert.equal(where.id, 'session');
          draft.sessionRevoked = true;
          return { count: 1 };
        },
      },
      user: {
        findFirst: async () => ({ id: 'user', email: 'user@example.com', status: 'ACTIVE' }),
      },
      userRole: { findMany: async () => [{ role: { code: 'TEACHER' } }] },
      auditLogin: {
        create: async ({ data }) => {
          if (failure === 'audit') throw Error('audit failed');
          draft.audits.push(data);
        },
      },
    });
    state = draft;
    return result;
  };
  return () => state;
}

test('rotation commits one hashed successor and a refresh audit', async () => {
  const state = fixture();
  const result = await rotate({ refreshToken: 'original' });
  assert.ok(result.accessToken);
  assert.notEqual(result.refreshToken, 'original');
  assert.equal(state().children.length, 1);
  assert.equal(state().children[0].tokenHash, hashRefreshToken(result.refreshToken));
  assert.equal(state().children[0].parentTokenId, 'parent');
  assert.equal(state().audits[0].event, 'TOKEN_REFRESHED');
});

for (const options of [{ replay: true }, { lostRace: true }]) {
  test(`replay revocation commits before rejection (${JSON.stringify(options)})`, async () => {
    const state = fixture(options);
    await assert.rejects(rotate({ refreshToken: 'original' }), /already been used/);
    assert.equal(state().sessionRevoked, true);
    assert.equal(state().children.length, 0);
    assert.equal(state().audits[0].event, 'SESSION_REVOKED');
  });
}

test('replaying a consumed token revokes its committed successor', async () => {
  const state = fixture();
  await rotate({ refreshToken: 'original' });
  await assert.rejects(rotate({ refreshToken: 'original' }), /already been used/);
  assert.equal(state().children.length, 1);
  assert.equal(state().children[0].revoked, true);
  assert.equal(state().sessionRevoked, true);
});

for (const failure of ['create', 'touch', 'audit']) {
  test(`rotation rolls back consumption on ${failure} failure`, async () => {
    const state = fixture({ failure });
    await assert.rejects(rotate({ refreshToken: 'original' }), new RegExp(`${failure} failed`));
    assert.equal(state().consumed, false);
    assert.equal(state().children.length, 0);
    assert.equal(state().audits.length, 0);
  });
}

for (const options of [{ expired: true }, { foreign: true }]) {
  test(`invalid refresh context cannot issue tokens (${JSON.stringify(options)})`, async () => {
    const state = fixture(options);
    await assert.rejects(rotate({ refreshToken: 'original' }));
    assert.equal(state().consumed, false);
    assert.equal(state().children.length, 0);
  });
}
