import prisma from '../orm/prismaClient.js';

const db = (tx) => tx ?? prisma;
export const list = ({ tenantId, search, page = 1, pageSize = 25 } = {}, tx) => {
  const take = Math.min(Math.max(Number(pageSize) || 25, 1), 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
  const where = {
    tenantId,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  return Promise.all([
    db(tx).school.findMany({ where, orderBy: { name: 'asc' }, skip, take }),
    db(tx).school.count({ where }),
  ]).then(([items, total]) => ({
    items,
    total,
    page: Math.floor(skip / take) + 1,
    pageSize: take,
  }));
};
export const find = (id, tenantId, tx) => db(tx).school.findFirst({ where: { id, tenantId } });
export const create = (data, tx) => db(tx).school.create({ data });
export const update = (id, tenantId, data, tx) =>
  db(tx).school.update({ where: { id, tenantId }, data });
export const remove = (id, tenantId, tx) =>
  db(tx).school.update({
    where: { id, tenantId },
    data: { deletedAt: new Date(), status: 'DELETED' },
  });
export const findChild = (model, id, schoolId, tx) =>
  db(tx)[model].findFirst({ where: { id, schoolId, deletedAt: null } });
export const listChildren = (model, schoolId, tx) =>
  db(tx)[model].findMany({
    where: { schoolId, deletedAt: null },
    orderBy: model === 'gradeLevel' ? { displayOrder: 'asc' } : { name: 'asc' },
  });
export const createChild = (model, data, tx) => db(tx)[model].create({ data });
export const updateChild = (model, id, schoolId, data, tx) =>
  db(tx)[model].updateMany({ where: { id, schoolId, deletedAt: null }, data });
export const deleteChild = (model, id, schoolId, tx) =>
  db(tx)[model].updateMany({
    where: { id, schoolId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
export const assignAdmin = (data, tx) =>
  db(tx).schoolAdministrator.upsert({
    where: { schoolId_userId: { schoolId: data.schoolId, userId: data.userId } },
    create: data,
    update: { revokedAt: null, endsAt: data.endsAt, isPrimary: data.isPrimary },
  });
export const listAdmins = (schoolId, tx) =>
  db(tx).schoolAdministrator.findMany({
    where: { schoolId, revokedAt: null },
    include: { user: { include: { profile: true } } },
  });
export const revokeAdmin = (schoolId, userId, tx) =>
  db(tx).schoolAdministrator.updateMany({
    where: { schoolId, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
export default {
  list,
  find,
  create,
  update,
  remove,
  findChild,
  listChildren,
  createChild,
  updateChild,
  deleteChild,
  assignAdmin,
  listAdmins,
  revokeAdmin,
};
