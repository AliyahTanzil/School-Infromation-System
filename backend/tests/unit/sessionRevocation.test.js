import assert from 'node:assert/strict';
import test from 'node:test';

const db = { $on() {} };
globalThis.__prisma = db;
const { revoke, revokeAll } = await import('../../src/application/services/sessionService.js');

function fixture(failure) {
  let state = {
    sessions: [
      { id: 'one', userId: 'owner', revokedAt: null },
      { id: 'two', userId: 'owner', revokedAt: null },
      { id: 'foreign', userId: 'other', revokedAt: null },
    ],
    tokens: [
      { sessionId: 'one', userId: 'owner', revokedAt: null },
      { sessionId: 'two', userId: 'owner', revokedAt: null },
      { sessionId: 'foreign', userId: 'other', revokedAt: null },
    ],
    audits: [],
  };
  // Only the transaction client exposes delegates: any write outside it fails.
  db.$transaction = async (work) => {
    const draft = globalThis.structuredClone(state);
    const matches = (item, where) =>
      Object.entries(where).every(([key, value]) => item[key] === value);
    const update =
      (collection, stage) =>
      async ({ where, data }) => {
        if (failure === stage) throw new Error(`${stage} failed`);
        const items = draft[collection].filter((item) => matches(item, where));
        items.forEach((item) => Object.assign(item, data));
        return { count: items.length };
      };
    await work({
      userSession: {
        findFirst: async ({ where }) =>
          draft.sessions.find((s) => s.id === where.id && !s.revokedAt) ?? null,
        updateMany: update('sessions', 'session'),
      },
      refreshToken: { updateMany: update('tokens', 'token') },
      auditLogin: {
        create: async ({ data }) => {
          if (failure === 'audit') throw new Error('audit failed');
          draft.audits.push(data);
        },
      },
    });
    state = draft;
  };
  return () => state;
}

test('single-device sign-out commits tokens, session and audit for only the owned device', async () => {
  const state = fixture();
  await revoke({ sessionId: 'one', userId: 'owner', reason: 'user_revoked' });
  assert.ok(state().sessions[0].revokedAt);
  assert.ok(state().tokens[0].revokedAt);
  assert.equal(state().sessions[0].revokeReason, 'user_revoked');
  assert.equal(state().tokens[0].revokeReason, 'user_revoked');
  assert.equal(state().sessions[1].revokedAt, null);
  assert.equal(state().sessions[2].revokedAt, null);
  assert.equal(state().audits.length, 1);
  assert.equal(state().audits[0].event, 'LOGGED_OUT');
  assert.equal(state().audits[0].sessionId, 'one');
});

test('all-device sign-out changes only the authenticated account records', async () => {
  const state = fixture();
  await revokeAll({ userId: 'owner' });
  for (const collection of ['sessions', 'tokens']) {
    assert.ok(state()[collection][0].revokedAt);
    assert.ok(state()[collection][1].revokedAt);
    assert.equal(state()[collection][2].revokedAt, null);
  }
  assert.equal(state().audits.length, 1);
  assert.equal(state().audits[0].event, 'LOGGED_OUT_ALL');
  assert.equal(state().audits[0].userId, 'owner');
});

test('foreign and missing sessions produce no revocation or audit', async () => {
  for (const sessionId of ['foreign', 'missing']) {
    const state = fixture();
    const before = globalThis.structuredClone(state());
    await assert.rejects(revoke({ sessionId, userId: 'owner' }), /Session not found/);
    assert.deepEqual(state(), before);
  }
});

for (const operation of ['single', 'all']) {
  for (const stage of ['token', 'session', 'audit']) {
    test(`${operation}-device sign-out rejects and rolls back when ${stage} persistence fails`, async () => {
      const state = fixture(stage);
      const before = globalThis.structuredClone(state());
      const action =
        operation === 'single'
          ? revoke({ sessionId: 'one', userId: 'owner' })
          : revokeAll({ userId: 'owner' });
      await assert.rejects(action, new RegExp(`${stage} failed`));
      assert.deepEqual(state(), before);
    });
  }
}
