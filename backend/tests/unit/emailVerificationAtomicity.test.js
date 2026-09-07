import assert from 'node:assert/strict';
import test from 'node:test';
const db = { $on() {} };
globalThis.__prisma = db;
const { verifyEmail } = await import('../../src/application/services/authService.js');
function fixture({
  status = 'PENDING_VERIFICATION',
  failure,
  lostRace = false,
  deleted = false,
} = {}) {
  let state = {
    user: { id: 'owner', email: 'owner@example.com', status, emailVerifiedAt: null },
    used: false,
    audits: [],
  };
  db.$transaction = async (work) => {
    const draft = globalThis.structuredClone(state);
    const result = await work({
      emailVerificationToken: {
        findUnique: async () => ({
          id: 'link',
          userId: 'owner',
          usedAt: draft.used ? new Date() : null,
          expiresAt: new Date(Date.now() + 60000),
        }),
        updateMany: async ({ where }) => {
          assert.equal(where.usedAt, null);
          if (where.id) {
            assert.ok(where.expiresAt.gt instanceof Date);
            if (lostRace) return { count: 0 };
          } else assert.equal(where.userId, 'owner');
          draft.used = true;
          return { count: 1 };
        },
      },
      user: {
        updateMany: async ({ where, data }) => {
          assert.equal(where.id, 'owner');
          assert.equal(where.deletedAt, null);
          if (deleted) return { count: 0 };
          if (failure === 'user') throw Error('user failed');
          Object.assign(draft.user, data);
          return { count: 1 };
        },
        findFirst: async () => draft.user,
      },
      auditLogin: {
        create: async ({ data }) => {
          if (failure === 'audit') throw Error('audit failed');
          draft.audits.push(data);
        },
      },
      userRole: {
        findMany: async () => {
          if (failure === 'roles') throw Error('roles failed');
          return [];
        },
      },
    });
    state = draft;
    return result;
  };
  return () => state;
}
const verify = () => verifyEmail({ token: 'verification-link' });
for (const status of ['PENDING_VERIFICATION', 'INVITED', 'SUSPENDED', 'LOCKED', 'ACTIVE']) {
  test(`email verification preserves ${status} account lifecycle`, async () => {
    const state = fixture({ status });
    const result = await verify();
    assert.equal(state().user.status, status);
    assert.equal(result.user.status, status);
    assert.ok(state().user.emailVerifiedAt instanceof Date);
    assert.equal(state().audits[0].event, 'EMAIL_VERIFIED');
    await assert.rejects(verify(), /invalid or has expired/);
    assert.equal(state().audits.length, 1);
  });
}
for (const failure of ['user', 'audit', 'roles']) {
  test(`verification rolls back on ${failure} failure`, async () => {
    const state = fixture({ failure });
    const before = globalThis.structuredClone(state());
    await assert.rejects(verify(), new RegExp(`${failure} failed`));
    assert.deepEqual(state(), before);
  });
}
for (const options of [{ lostRace: true }, { deleted: true }]) {
  test(`verification rejects competing consumption or deleted accounts (${JSON.stringify(options)})`, async () => {
    const state = fixture(options);
    const before = globalThis.structuredClone(state());
    await assert.rejects(verify(), /invalid or has expired/);
    assert.deepEqual(state(), before);
  });
}
