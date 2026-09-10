import test from 'node:test';
import assert from 'node:assert/strict';

const db = { $on() {} };
globalThis.__prisma = db;
const service = await import('../../src/application/services/libraryService.js');
const ownership = { tenantId: 'tenant', schoolId: 'school' };
const library = { id: 'library', ...ownership, active: false };
const book = {
  id: 'book',
  ...ownership,
  libraryId: 'library',
  library,
  status: 'ACTIVE',
  title: 'Science',
  author: 'Author',
  isbn: '123',
};
const copy = {
  id: 'copy',
  ...ownership,
  libraryId: 'library',
  library,
  book,
  barcode: 'COPY',
  status: 'AVAILABLE',
};
const loan = {
  id: 'loan',
  ...ownership,
  libraryId: 'library',
  library,
  copy,
  status: 'BORROWED',
  dueAt: new Date(0),
};

// Evaluate the subset of Prisma predicates used by these reads against deliberately
// inconsistent relation fixtures. This is query-contract coverage, not a live DB test.
function matches(record, where) {
  if (!record) return false;
  return Object.entries(where).every(([key, value]) => {
    if (key === 'OR') return value.some((condition) => matches(record, condition));
    if (value && typeof value === 'object') {
      if ('is' in value) return matches(record[key], value.is);
      if ('lt' in value) return record[key] < value.lt;
      if ('contains' in value)
        return String(record[key]).toLowerCase().includes(value.contains.toLowerCase());
      assert.fail(`Unexpected query predicate: ${key}`);
    }
    return record[key] === value;
  });
}

function fixture({ books = [book], copies = [copy], loans = [loan] } = {}) {
  db.library = { findFirst: async ({ where }) => (matches(library, where) ? library : null) };
  db.libraryBook = {
    count: async ({ where }) => books.filter((row) => matches(row, where)).length,
    findMany: async ({ where, include, orderBy, take }) => {
      assert.deepEqual(orderBy, { title: 'asc' });
      assert.equal(take, 100);
      assert.deepEqual(include.copies.select, { id: true, barcode: true, status: true });
      return books
        .filter((row) => matches(row, where))
        .map((row) => ({
          ...row,
          copies: copies.filter(
            (entry) => entry.book.id === row.id && matches(entry, include.copies.where)
          ),
        }));
    },
  };
  db.libraryCopy = {
    count: async ({ where }) => copies.filter((row) => matches(row, where)).length,
  };
  db.libraryLoan = {
    count: async ({ where }) => loans.filter((row) => matches(row, where)).length,
    findMany: async ({ where, include, take, orderBy }) => {
      assert.equal(take, 100);
      assert.deepEqual(orderBy, { borrowedAt: 'desc' });
      assert.deepEqual(include, { copy: { include: { book: true } } });
      return loans.filter((row) => matches(row, where));
    },
  };
}

test('catalog excludes mismatched book, library and nested copy ownership', async () => {
  for (const field of ['tenantId', 'schoolId', 'libraryId']) {
    const badBook = { ...book, [field]: 'foreign' };
    const badCopy = { ...copy, [field]: 'foreign' };
    fixture({ books: [book, badBook], copies: [copy, badCopy] });
    const result = await service.searchBooks(ownership, 'library', 'SCI');
    assert.equal(result.length, 1);
    assert.deepEqual(result[0].copies, [copy]);
  }
  fixture({ books: [{ ...book, library: { ...library, schoolId: 'foreign' } }] });
  assert.deepEqual(await service.searchBooks(ownership, 'library'), []);
});

test('loan listing excludes foreign records anywhere in its library-copy-book chain', async () => {
  for (const field of ['tenantId', 'schoolId', 'libraryId']) {
    const cases = [
      { ...loan, [field]: 'foreign' },
      { ...loan, copy: { ...copy, [field]: 'foreign' } },
      { ...loan, copy: { ...copy, book: { ...book, [field]: 'foreign' } } },
    ];
    fixture({ loans: [loan, ...cases] });
    assert.deepEqual(await service.listLoans(ownership, 'library'), [loan]);
  }
  const foreignLibrary = { ...library, tenantId: 'foreign' };
  fixture({
    loans: [
      { ...loan, library: foreignLibrary },
      { ...loan, copy: { ...copy, library: foreignLibrary } },
      { ...loan, copy: { ...copy, book: { ...book, library: foreignLibrary } } },
    ],
  });
  assert.deepEqual(await service.listLoans(ownership, 'library'), []);
});

test('overview counts exclude inconsistent relationships using the catalog and circulation scope', async () => {
  const badBook = { ...book, tenantId: 'foreign' };
  const badCopy = { ...copy, book: badBook };
  fixture({
    books: [book, badBook],
    copies: [copy, badCopy],
    loans: [loan, { ...loan, copy: badCopy }],
  });
  const result = await service.overview(ownership, 'library');
  assert.deepEqual(result.stats, { books: 1, copies: 1, available: 1, activeLoans: 1, overdue: 1 });
});

test('owned historical circulation remains visible for inactive libraries and archived books', async () => {
  const archived = { ...book, status: 'ARCHIVED' };
  const returned = { ...loan, status: 'RETURNED', copy: { ...copy, book: archived } };
  fixture({ books: [archived], copies: [returned.copy], loans: [returned] });
  assert.deepEqual(await service.listLoans(ownership, 'library'), [returned]);
  assert.deepEqual(await service.searchBooks(ownership, 'library'), []);
  assert.deepEqual((await service.overview(ownership, 'library')).stats, {
    books: 0,
    copies: 1,
    available: 1,
    activeLoans: 0,
    overdue: 0,
  });
});

test('foreign library requests expose no catalog, loans or dashboard metrics', async () => {
  fixture();
  assert.deepEqual(await service.searchBooks(ownership, 'foreign'), []);
  assert.deepEqual(await service.listLoans(ownership, 'foreign'), []);
  db.libraryBook.count = () => assert.fail('Must reject before counting');
  await assert.rejects(service.overview(ownership, 'foreign'), /Library not found/);
});
