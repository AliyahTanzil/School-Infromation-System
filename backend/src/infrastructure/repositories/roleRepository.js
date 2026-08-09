import prisma from '../orm/prismaClient.js';

const db = (tx) => tx ?? prisma;
const roleInclude = {
  rolePermissions: { include: { permission: true } },
  userRoles: { where: { revokedAt: null } },
};

export function list({ search } = {}, tx) {
  return db(tx).role.findMany({
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
    },
    include: roleInclude,
    orderBy: { code: 'asc' },
  });
}
export function findById(id, tx) {
  return db(tx).role.findFirst({ where: { id, deletedAt: null }, include: roleInclude });
}
export function findByCode(code, tx) {
  return db(tx).role.findFirst({ where: { code, deletedAt: null }, include: roleInclude });
}
export function create(data, tx) {
  return db(tx).role.create({ data });
}
export function update(id, data, tx) {
  return db(tx).role.update({ where: { id }, data });
}
export function softDelete(id, tx) {
  return db(tx).role.update({ where: { id }, data: { deletedAt: new Date() } });
}
export function assignPermission(roleId, permissionId, grantedById, tx) {
  return db(tx).rolePermission.upsert({
    where: { roleId_permissionId: { roleId, permissionId } },
    update: { grantedById },
    create: { roleId, permissionId, grantedById },
  });
}
export function removePermission(roleId, permissionId, tx) {
  return db(tx).rolePermission.delete({ where: { roleId_permissionId: { roleId, permissionId } } });
}

export default {
  list,
  findById,
  findByCode,
  create,
  update,
  softDelete,
  assignPermission,
  removePermission,
};
