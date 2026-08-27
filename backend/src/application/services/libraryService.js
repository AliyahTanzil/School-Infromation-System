import prisma from '../../infrastructure/orm/prismaClient.js';

export async function getLibraryOverview({ tenantId, schoolId, libraryId }) {
  const library = await prisma.library.findFirst({
    where: { id: libraryId, tenantId, schoolId },
    include: { policy: true, locations: { include: { shelves: true } } },
  });
  if (!library) throw new Error('Library not found');

  const [books, copies, members, activeLoans, overdueLoans, openFines, reservations] =
    await Promise.all([
      prisma.book.count({ where: { libraryId, status: 'ACTIVE' } }),
      prisma.bookCopy.groupBy({
        where: { book: { libraryId } },
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.libraryMember.count({ where: { libraryId, active: true } }),
      prisma.borrowTransaction.count({ where: { libraryId, status: 'BORROWED' } }),
      prisma.borrowTransaction.count({ where: { libraryId, status: 'OVERDUE' } }),
      prisma.fine.aggregate({ where: { libraryId, status: 'OPEN' }, _sum: { amount: true } }),
      prisma.reservation.count({ where: { libraryId, status: 'ACTIVE' } }),
    ]);

  return {
    library,
    stats: {
      books,
      copies,
      members,
      activeLoans,
      overdueLoans,
      openFineTotal: openFines._sum.amount || 0,
      reservations,
    },
    copyStatus: copies,
  };
}

export async function searchBooks({ libraryId, query = '', page = 1, pageSize = 12 }) {
  const where = {
    libraryId,
    status: 'ACTIVE',
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { isbn13: { contains: query } },
            { isbn10: { contains: query } },
          ],
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    prisma.book.findMany({
      where,
      include: { copies: { select: { status: true } }, authors: { include: { author: true } } },
      orderBy: { title: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.book.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function listLoans({ libraryId, status }) {
  return prisma.borrowTransaction.findMany({
    where: { libraryId, ...(status ? { status } : {}) },
    include: { copy: { include: { book: true } }, member: true },
    orderBy: { dueAt: 'asc' },
    take: 50,
  });
}
