import prisma from '../orm/prismaClient.js';

const db = (tx) => tx ?? prisma;

export function list({ search, groupKey } = {}, tx) {
  return db(tx).permission.findMany({
    where: {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { code: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(groupKey ? { permissionGroup: { key: groupKey, deletedAt: null } } : {}),
    },
    include: { permissionGroup: true },
    orderBy: [{ permissionGroup: { sortOrder: 'asc' } }, { code: 'asc' }],
  });
}

export function findById(id, tx) {
  return db(tx).permission.findFirst({
    where: { id, deletedAt: null },
    include: { permissionGroup: true },
  });
}

export function findByCode(code, tx) {
  return db(tx).permission.findFirst({ where: { code, deletedAt: null } });
}

export function upsert(data, tx) {
  return db(tx).permission.upsert({
    where: { code: data.code },
    update: {
      name: data.name,
      description: data.description,
      isSystem: data.isSystem ?? false,
      permissionGroupId: data.permissionGroupId,
    },
    create: data,
  });
}

export default { list, findById, findByCode, upsert };
