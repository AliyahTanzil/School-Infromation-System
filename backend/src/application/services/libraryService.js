import prisma from '../../infrastructure/orm/prismaClient.js';
import ConflictError from '../../shared/errors/ConflictError.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';
const owned = ({ tenantId, schoolId } = {}) => {
  if (!tenantId || !schoolId) throw new AuthorizationError('School context is required');
  return { tenantId, schoolId };
};
function readScope(scope, libraryId) {
  const ownership = owned(scope);
  const library = { id: libraryId, ...ownership };
  const books = { ...ownership, libraryId, library: { is: library } };
  const copies = { ...books, book: { is: books } };
  const loans = { ...books, copy: { is: copies } };
  return { library, books, copies, loans };
}
export const createLibrary = (scope, data) =>
  prisma.library.create({ data: { ...owned(scope), name: data.name, active: true } });
async function requireLibrary(tx, ownership, libraryId) {
  const library = await tx.library.findFirst({
    where: { id: libraryId, ...ownership, active: true },
  });
  if (!library) throw new NotFoundError('Active library not found');
}
export async function overview(scope, libraryId) {
  const filters = readScope(scope, libraryId);
  const library = await prisma.library.findFirst({ where: filters.library });
  if (!library) throw new NotFoundError('Library not found');
  const [books, copies, available, activeLoans, overdue] = await Promise.all([
    prisma.libraryBook.count({ where: { ...filters.books, status: 'ACTIVE' } }),
    prisma.libraryCopy.count({ where: filters.copies }),
    prisma.libraryCopy.count({ where: { ...filters.copies, status: 'AVAILABLE' } }),
    prisma.libraryLoan.count({ where: { ...filters.loans, status: 'BORROWED' } }),
    prisma.libraryLoan.count({
      where: { ...filters.loans, status: 'BORROWED', dueAt: { lt: new Date() } },
    }),
  ]);
  return { library, stats: { books, copies, available, activeLoans, overdue } };
}
export function searchBooks(scope, libraryId, query = '') {
  const filters = readScope(scope, libraryId);
  return prisma.libraryBook.findMany({
    where: {
      ...filters.books,
      status: 'ACTIVE',
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { author: { contains: query, mode: 'insensitive' } },
              { isbn: { contains: query } },
            ],
          }
        : {}),
    },
    include: {
      copies: { where: filters.copies, select: { id: true, barcode: true, status: true } },
    },
    orderBy: { title: 'asc' },
    take: 100,
  });
}
export async function addBook(scope, libraryId, data) {
  const ownership = owned(scope);
  return prisma.$transaction(async (tx) => {
    await requireLibrary(tx, ownership, libraryId);
    return tx.libraryBook.create({
      data: {
        ...ownership,
        libraryId,
        title: data.title,
        author: data.author,
        isbn: data.isbn,
        category: data.category,
        status: 'ACTIVE',
      },
    });
  });
}
export async function addCopy(scope, libraryId, bookId, data) {
  const ownership = owned(scope);
  return prisma.$transaction(async (tx) => {
    await requireLibrary(tx, ownership, libraryId);
    const book = await tx.libraryBook.findFirst({
      where: { id: bookId, libraryId, ...ownership, status: 'ACTIVE' },
    });
    if (!book) throw new NotFoundError('Active book not found');
    return tx.libraryCopy.create({
      data: { ...ownership, libraryId, bookId, barcode: data.barcode, status: 'AVAILABLE' },
    });
  });
}
export function listLoans(scope, libraryId) {
  const filters = readScope(scope, libraryId);
  return prisma.libraryLoan.findMany({
    where: filters.loans,
    include: { copy: { include: { book: true } } },
    orderBy: { borrowedAt: 'desc' },
    take: 100,
  });
}
export async function borrow(scope, libraryId, data) {
  const ownership = owned(scope);
  return prisma.$transaction(async (tx) => {
    await requireLibrary(tx, ownership, libraryId);
    const changed = await tx.libraryCopy.updateMany({
      where: {
        id: data.copyId,
        libraryId,
        ...ownership,
        status: 'AVAILABLE',
        book: { is: { ...ownership, libraryId, status: 'ACTIVE' } },
      },
      data: { status: 'BORROWED' },
    });
    if (!changed.count) throw new ConflictError('Copy is unavailable');
    return tx.libraryLoan.create({
      data: {
        ...ownership,
        libraryId,
        copyId: data.copyId,
        borrowerId: data.borrowerId,
        dueAt: data.dueAt,
        status: 'BORROWED',
      },
    });
  });
}
export async function returnLoan(scope, libraryId, loanId) {
  const ownership = owned(scope);
  return prisma.$transaction(async (tx) => {
    const loan = await tx.libraryLoan.findFirst({
      where: { id: loanId, libraryId, ...ownership, status: 'BORROWED' },
    });
    if (!loan) throw new NotFoundError('Active loan not found');
    const returnedAt = new Date();
    const claimed = await tx.libraryLoan.updateMany({
      where: { id: loan.id, copyId: loan.copyId, libraryId, ...ownership, status: 'BORROWED' },
      data: { status: 'RETURNED', returnedAt },
    });
    if (!claimed.count) throw new ConflictError('Loan changed; reload before returning');
    const released = await tx.libraryCopy.updateMany({
      where: { id: loan.copyId, libraryId, ...ownership, status: 'BORROWED' },
      data: { status: 'AVAILABLE' },
    });
    if (!released.count)
      throw new ConflictError('Loan copy is unavailable or outside the active library');
    return { ...loan, status: 'RETURNED', returnedAt };
  });
}
