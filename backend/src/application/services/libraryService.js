import prisma from '../../infrastructure/orm/prismaClient.js';
import ConflictError from '../../shared/errors/ConflictError.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';
const owned = ({ tenantId, schoolId } = {}) => {
  if (!tenantId || !schoolId) throw new AuthorizationError('School context is required');
  return { tenantId, schoolId };
};
export const createLibrary = (scope, data) =>
  prisma.library.create({ data: { ...owned(scope), ...data } });
export async function overview(scope, libraryId) {
  const library = await prisma.library.findFirst({ where: { id: libraryId, ...owned(scope) } });
  if (!library) throw new NotFoundError('Library not found');
  const [books, copies, available, activeLoans, overdue] = await Promise.all([
    prisma.libraryBook.count({ where: { ...owned(scope), libraryId, status: 'ACTIVE' } }),
    prisma.libraryCopy.count({ where: { ...owned(scope), libraryId } }),
    prisma.libraryCopy.count({ where: { ...owned(scope), libraryId, status: 'AVAILABLE' } }),
    prisma.libraryLoan.count({ where: { ...owned(scope), libraryId, status: 'BORROWED' } }),
    prisma.libraryLoan.count({
      where: { ...owned(scope), libraryId, status: 'BORROWED', dueAt: { lt: new Date() } },
    }),
  ]);
  return { library, stats: { books, copies, available, activeLoans, overdue } };
}
export const searchBooks = (scope, libraryId, query = '') =>
  prisma.libraryBook.findMany({
    where: {
      ...owned(scope),
      libraryId,
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
    include: { copies: { select: { id: true, barcode: true, status: true } } },
    orderBy: { title: 'asc' },
    take: 100,
  });
export const addBook = (scope, libraryId, data) =>
  prisma.libraryBook.create({ data: { ...owned(scope), libraryId, ...data } });
export async function addCopy(scope, libraryId, bookId, data) {
  const book = await prisma.libraryBook.findFirst({
    where: { id: bookId, libraryId, ...owned(scope) },
  });
  if (!book) throw new NotFoundError('Book not found');
  return prisma.libraryCopy.create({ data: { ...owned(scope), libraryId, bookId, ...data } });
}
export const listLoans = (scope, libraryId) =>
  prisma.libraryLoan.findMany({
    where: { ...owned(scope), libraryId },
    include: { copy: { include: { book: true } } },
    orderBy: { borrowedAt: 'desc' },
    take: 100,
  });
export async function borrow(scope, libraryId, data) {
  const ownership = owned(scope);
  return prisma.$transaction(async (tx) => {
    const changed = await tx.libraryCopy.updateMany({
      where: { id: data.copyId, libraryId, ...ownership, status: 'AVAILABLE' },
      data: { status: 'BORROWED' },
    });
    if (!changed.count) throw new ConflictError('Copy is unavailable');
    return tx.libraryLoan.create({ data: { ...owned(scope), libraryId, ...data } });
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
