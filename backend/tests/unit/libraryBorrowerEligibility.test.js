import test from 'node:test';
import assert from 'node:assert/strict';

const db = { $on() {} };
globalThis.__prisma = db;
const { borrow } = await import('../../src/application/services/libraryService.js');
const scope = { tenantId: 'tenant', schoolId: 'school', actorId: 'actor' };
const input = { copyId: 'copy', borrowerId: 'borrower', dueAt: new Date('2026-12-01') };
const eligible = { id: 'borrower', tenantId: 'tenant', status: 'ACTIVE', deletedAt: null };

function fixture(users, { failLookup = false } = {}) {
  const operations = [];
  const committed = [];
  db.user = { findFirst: () => assert.fail('Borrower lookup must use the transaction client') };
  db.$transaction = async (work) => {
    const pending = [];
    const result = await work({
      library: { findFirst: async () => ({ id: 'library' }) },
      user: {
        findFirst: async ({ where, select }) => {
          operations.push('borrower');
          assert.deepEqual(where, {
            id: input.borrowerId,
            tenantId: scope.tenantId,
            status: 'ACTIVE',
            deletedAt: null,
          });
          assert.deepEqual(select, { id: true });
          if (failLookup) throw new Error('Borrower lookup failed');
          const match = users.find((user) =>
            Object.entries(where).every(([key, value]) => user[key] === value)
          );
          return match ? { id: match.id } : null;
        },
      },
      libraryCopy: {
        updateMany: async () => {
          operations.push('copy');
          pending.push('copy');
          return { count: 1 };
        },
      },
      libraryLoan: {
        create: async ({ data }) => {
          operations.push('loan');
          pending.push('loan');
          assert.equal(data.borrowerId, eligible.id);
          return { ...data, id: 'loan' };
        },
      },
      auditLog: {
        create: async ({ data }) => {
          operations.push('audit');
          pending.push('audit');
          assert.equal(data.metadata.borrowerId, eligible.id);
        },
      },
    });
    committed.push(...pending);
    return result;
  };
  return { operations, committed };
}

test('borrowing verifies the tenant user before claiming a copy and commits that identity with the audit', async () => {
  const { operations, committed } = fixture([eligible]);
  const loan = await borrow(scope, 'library', input);
  assert.equal(loan.borrowerId, eligible.id);
  assert.deepEqual(operations, ['borrower', 'copy', 'loan', 'audit']);
  assert.deepEqual(committed, ['copy', 'loan', 'audit']);
});

for (const [name, users] of [
  ['missing', []],
  ['foreign tenant', [{ ...eligible, tenantId: 'foreign' }]],
  ['deleted', [{ ...eligible, deletedAt: new Date() }]],
  ['suspended', [{ ...eligible, status: 'SUSPENDED' }]],
  ['pending', [{ ...eligible, status: 'PENDING' }]],
  ['different user', [{ ...eligible, id: 'other' }]],
]) {
  test(`${name} borrowers receive the same not-found error with no circulation writes`, async () => {
    const { operations, committed } = fixture(users);
    await assert.rejects(borrow(scope, 'library', input), (error) => {
      assert.equal(error.statusCode, 404);
      assert.equal(error.message, 'Eligible borrower not found');
      return true;
    });
    assert.deepEqual(operations, ['borrower']);
    assert.deepEqual(committed, []);
  });
}

test('missing borrower identifiers cannot broaden the lookup to another tenant user', async () => {
  const { operations, committed } = fixture([eligible]);
  await assert.rejects(
    borrow(scope, 'library', { ...input, borrowerId: undefined }),
    /Eligible borrower not found/
  );
  assert.deepEqual(operations, []);
  assert.deepEqual(committed, []);
});

test('borrower lookup failures propagate before any copy or loan changes', async () => {
  const { operations, committed } = fixture([eligible], { failLookup: true });
  await assert.rejects(borrow(scope, 'library', input), /Borrower lookup failed/);
  assert.deepEqual(operations, ['borrower']);
  assert.deepEqual(committed, []);
});
