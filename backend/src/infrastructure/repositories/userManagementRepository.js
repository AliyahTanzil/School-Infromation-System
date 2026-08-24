import prisma from '../orm/prismaClient.js';

const baseInclude = {
  profile: true,
  preference: true,
  roles: { where: { revokedAt: null }, include: { role: true } },
};

const db = (tx) => tx ?? prisma;
const whereNotDeleted = (where = {}) => ({ ...where, deletedAt: null });

export function list(
  {
    search,
    status,
    roleCode,
    pageSize = 25,
    cursor,
    includeDeleted = false,
    sort = 'createdAt',
    direction = 'desc',
  } = {},
  tx
) {
  const allowedSorts = new Set(['createdAt', 'updatedAt', 'email', 'status']);
  const orderField = allowedSorts.has(sort) ? sort : 'createdAt';
  const where = {
    ...(includeDeleted ? {} : { deletedAt: null }),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search.toLowerCase(), mode: 'insensitive' } },
            { profile: { is: { firstName: { contains: search, mode: 'insensitive' } } } },
            { profile: { is: { lastName: { contains: search, mode: 'insensitive' } } } },
          ],
        }
      : {}),
    ...(roleCode
      ? { userRoles: { some: { revokedAt: null, role: { code: roleCode, deletedAt: null } } } }
      : {}),
  };
  return db(tx).user.findMany({
    where,
    take: Math.min(Math.max(pageSize, 1), 100) + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: [{ [orderField]: direction === 'asc' ? 'asc' : 'desc' }, { id: 'desc' }],
    include: baseInclude,
  });
}

export function findById(id, { includeDeleted = false } = {}, tx) {
  return db(tx).user.findFirst({
    where: includeDeleted ? { id } : whereNotDeleted({ id }),
    include: baseInclude,
  });
}

export function create(data, tx) {
  return db(tx).user.create({ data, include: baseInclude });
}

export function update(id, data, tx) {
  return db(tx).user.update({ where: { id }, data, include: baseInclude });
}

export function updateStatus(id, status, tx) {
  return db(tx).user.update({ where: { id }, data: { status }, include: baseInclude });
}

export function softDelete(id, tx) {
  return db(tx).user.update({
    where: { id },
    data: { deletedAt: new Date() },
    include: baseInclude,
  });
}

export function restore(id, tx) {
  return db(tx).user.update({ where: { id }, data: { deletedAt: null }, include: baseInclude });
}

export default { list, findById, create, update, updateStatus, softDelete, restore };
