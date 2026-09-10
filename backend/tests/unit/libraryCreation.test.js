import test from 'node:test';
import assert from 'node:assert/strict';
import * as validators from '../../src/application/validators/libraryValidators.js';

const db = { $on() {} };
globalThis.__prisma = db;
const service = await import('../../src/application/services/libraryService.js');
const ownership = { tenantId: 'tenant', schoolId: 'school' };
const forged = {
  tenantId: 'foreign',
  schoolId: 'foreign',
  libraryId: 'foreign',
  bookId: 'foreign',
  id: 'forged',
  status: 'LOST',
  active: false,
  returnedAt: new Date(),
};

function fixture({ library = true, book = true, available = true, failLoan = false } = {}) {
  const committed = [];
  db.$transaction = async (work) => {
    const pending = [];
    const create = async ({ data }) => {
      pending.push(data);
      return data;
    };
    const result = await work({
      library: {
        findFirst: async ({ where }) => {
          assert.deepEqual(where, { id: 'library', ...ownership, active: true });
          return library ? { id: 'library' } : null;
        },
      },
      libraryBook: {
        create,
        findFirst: async ({ where }) => {
          assert.deepEqual(where, {
            id: 'book',
            libraryId: 'library',
            ...ownership,
            status: 'ACTIVE',
          });
          return book ? { id: 'book' } : null;
        },
      },
      libraryCopy: {
        create,
        updateMany: async ({ where, data }) => {
          assert.deepEqual(where, {
            id: 'copy',
            libraryId: 'library',
            ...ownership,
            status: 'AVAILABLE',
            book: { is: { ...ownership, libraryId: 'library', status: 'ACTIVE' } },
          });
          assert.deepEqual(data, { status: 'BORROWED' });
          if (available) pending.push(data);
          return { count: available ? 1 : 0 };
        },
      },
      libraryLoan: {
        create: async (args) => {
          if (failLoan) throw new Error('Loan insert failed');
          return create(args);
        },
      },
    });
    committed.push(...pending);
    return result;
  };
  return committed;
}

test('library creation preserves scope and initial state using only supported fields', async () => {
  db.library = { create: async ({ data }) => data };
  assert.deepEqual(await service.createLibrary(ownership, { ...forged, name: 'Main' }), {
    ...ownership,
    name: 'Main',
    active: true,
  });
});

test('book and copy creation validate transaction-owned references and ignore override fields', async () => {
  const bookWrites = fixture();
  await service.addBook(ownership, 'library', {
    ...forged,
    title: 'Title',
    author: 'Author',
    isbn: '123',
    category: 'Science',
  });
  assert.deepEqual(bookWrites, [
    {
      ...ownership,
      libraryId: 'library',
      title: 'Title',
      author: 'Author',
      isbn: '123',
      category: 'Science',
      status: 'ACTIVE',
    },
  ]);
  const copyWrites = fixture();
  await service.addCopy(ownership, 'library', 'book', { ...forged, barcode: 'COPY-1' });
  assert.deepEqual(copyWrites, [
    { ...ownership, libraryId: 'library', bookId: 'book', barcode: 'COPY-1', status: 'AVAILABLE' },
  ]);
});

test('missing, foreign or inactive libraries cannot receive books, copies or loans', async () => {
  for (const operation of [
    () => service.addBook(ownership, 'library', {}),
    () => service.addCopy(ownership, 'library', 'book', {}),
    () => service.borrow(ownership, 'library', {}),
  ]) {
    const writes = fixture({ library: false });
    await assert.rejects(operation, /Active library not found/);
    assert.deepEqual(writes, []);
  }
});

test('copies cannot be added to missing, foreign, wrong-library or inactive books', async () => {
  const writes = fixture({ book: false });
  await assert.rejects(service.addCopy(ownership, 'library', 'book', {}), /Active book not found/);
  assert.deepEqual(writes, []);
});

test('borrowing binds the claimed copy and loan to server ownership and initial state', async () => {
  const writes = fixture();
  const dueAt = new Date('2026-10-01');
  await service.borrow(ownership, 'library', {
    ...forged,
    copyId: 'copy',
    borrowerId: 'borrower',
    dueAt,
  });
  assert.deepEqual(writes, [
    { status: 'BORROWED' },
    {
      ...ownership,
      libraryId: 'library',
      copyId: 'copy',
      borrowerId: 'borrower',
      dueAt,
      status: 'BORROWED',
    },
  ]);
});

test('unavailable or ineligible copies and failed loan inserts leave no committed circulation writes', async () => {
  for (const options of [{ available: false }, { failLoan: true }]) {
    const writes = fixture(options);
    await assert.rejects(
      service.borrow(ownership, 'library', { copyId: 'copy' }),
      /Copy is unavailable|Loan insert failed/
    );
    assert.deepEqual(writes, []);
  }
});

test('library request schemas reject undeclared query and identifier fields', () => {
  const id = '00000000-0000-4000-8000-000000000001';
  assert.equal(
    validators.bookQuerySchema.safeParse({ params: { libraryId: id }, query: { q: 'Science' } })
      .success,
    true
  );
  assert.equal(
    validators.bookQuerySchema.safeParse({
      params: { libraryId: id },
      query: { q: 'Science', extra: true },
    }).success,
    false
  );
  for (const name of [
    'libraryParamsSchema',
    'bookQuerySchema',
    'bookCreateSchema',
    'copyCreateSchema',
    'loanCreateSchema',
    'loanParamsSchema',
  ]) {
    assert.equal(
      validators[name].shape.params.safeParse({
        libraryId: id,
        ...(name === 'copyCreateSchema' ? { bookId: id } : {}),
        ...(name === 'loanParamsSchema' ? { loanId: id } : {}),
        extra: true,
      }).success,
      false
    );
  }
});
