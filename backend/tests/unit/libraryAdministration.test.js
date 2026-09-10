import test from 'node:test';
import assert from 'node:assert/strict';

const fail = () => assert.fail('Unexpected persistence access');
const db = { $on() {} };
globalThis.__prisma = db;
const service = await import('../../src/application/services/libraryService.js');
const ownership = { tenantId: 'tenant', schoolId: 'school' };

function fixture({ missing = false, claimed = 1, released = 1, failure } = {}) {
  const committed = [];
  const attempted = [];
  const error = new Error('Persistence unavailable');
  db.$transaction = async (work) => {
    const pending = [];
    const result = await work({
      libraryLoan: {
        findFirst: async ({ where }) => {
          assert.deepEqual(where, {
            id: 'loan',
            libraryId: 'library',
            ...ownership,
            status: 'BORROWED',
          });
          return missing
            ? null
            : {
                id: 'loan',
                copyId: 'copy',
                libraryId: 'library',
                ...ownership,
                status: 'BORROWED',
              };
        },
        updateMany: async ({ where, data }) => {
          assert.deepEqual(where, {
            id: 'loan',
            copyId: 'copy',
            libraryId: 'library',
            ...ownership,
            status: 'BORROWED',
          });
          assert.equal(data.status, 'RETURNED');
          assert.ok(data.returnedAt instanceof Date);
          attempted.push('loan');
          if (failure === 'loan') throw error;
          pending.push({ loan: data });
          return { count: claimed };
        },
      },
      libraryCopy: {
        updateMany: async ({ where, data }) => {
          assert.deepEqual(where, {
            id: 'copy',
            libraryId: 'library',
            ...ownership,
            status: 'BORROWED',
          });
          assert.deepEqual(data, { status: 'AVAILABLE' });
          attempted.push('copy');
          if (failure === 'copy') throw error;
          pending.push({ copy: data });
          return { count: released };
        },
      },
    });
    if (failure === 'commit') throw error;
    committed.push(...pending);
    return result;
  };
  return { committed, attempted, error };
}

test('every library operation refuses missing ownership before database access', async () => {
  db.$transaction = fail;
  db.library = { create: fail, findFirst: fail };
  db.libraryBook = { create: fail, findFirst: fail, findMany: fail };
  db.libraryLoan = { findMany: fail };
  for (const scope of [undefined, {}, { tenantId: 'tenant' }, { schoolId: 'school' }]) {
    for (const operation of [
      () => service.createLibrary(scope, {}),
      () => service.overview(scope, 'library'),
      () => service.searchBooks(scope, 'library'),
      () => service.addBook(scope, 'library', {}),
      () => service.addCopy(scope, 'library', 'book', {}),
      () => service.listLoans(scope, 'library'),
      () => service.borrow(scope, 'library', {}),
      () => service.returnLoan(scope, 'library', 'loan'),
    ])
      await assert.rejects(async () => operation(), /School context is required/);
  }
});

test('return claims the scoped active loan before atomically releasing its borrowed copy', async () => {
  const { committed, attempted } = fixture();
  const result = await service.returnLoan(ownership, 'library', 'loan');
  assert.deepEqual(attempted, ['loan', 'copy']);
  assert.equal(committed.length, 2);
  assert.equal(result.status, 'RETURNED');
  assert.equal(result.returnedAt, committed[0].loan.returnedAt);
});

test('missing or inaccessible active loans do not trigger writes', async () => {
  const { attempted, committed } = fixture({ missing: true });
  await assert.rejects(service.returnLoan(ownership, 'library', 'loan'), /Active loan not found/);
  assert.deepEqual(attempted, []);
  assert.deepEqual(committed, []);
});

test('a stale duplicate return cannot release a copy borrowed again after the original return', async () => {
  // The initial read sees the old BORROWED snapshot, but another return has
  // committed and the copy has been borrowed again before the conditional write.
  const { attempted, committed } = fixture({ claimed: 0 });
  await assert.rejects(service.returnLoan(ownership, 'library', 'loan'), /Loan changed/);
  assert.deepEqual(attempted, ['loan']);
  assert.deepEqual(committed, []);
});

test('unavailable or foreign copies roll back the claimed return', async () => {
  const { committed } = fixture({ released: 0 });
  await assert.rejects(
    service.returnLoan(ownership, 'library', 'loan'),
    /outside the active library/
  );
  assert.deepEqual(committed, []);
});

test('loan, copy and commit errors leave neither transition committed', async () => {
  for (const failure of ['loan', 'copy', 'commit']) {
    const { committed, error } = fixture({ failure });
    await assert.rejects(
      service.returnLoan(ownership, 'library', 'loan'),
      (actual) => actual === error
    );
    assert.deepEqual(committed, []);
  }
});
