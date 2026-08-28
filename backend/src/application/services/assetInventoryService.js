import prisma from '../../infrastructure/orm/prismaClient.js';
import ConflictError from '../../shared/errors/ConflictError.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';
const owned = ({ tenantId, schoolId }) => ({ tenantId, schoolId });
export async function getOverview(scope) {
  const [assets, inventory, lowStock] = await Promise.all([
    prisma.asset.count({ where: { ...owned(scope), status: { not: 'DISPOSED' } } }),
    prisma.inventoryItem.count({ where: { ...owned(scope), active: true } }),
    prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM "InventoryItem" WHERE "tenantId"=${scope.tenantId}::uuid AND "schoolId"=${scope.schoolId}::uuid AND active=true AND quantity <= "reorderLevel"`,
  ]);
  return { assets, inventory, lowStock: lowStock[0]?.count ?? 0 };
}
export const listAssets = (scope, query = '') =>
  prisma.asset.findMany({
    where: {
      ...owned(scope),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { assetNumber: { contains: query, mode: 'insensitive' } },
              { serialNumber: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });
export const createAsset = (scope, data) =>
  prisma.asset.create({ data: { ...owned(scope), ...data } });
export async function updateAssetStatus(scope, id, status) {
  const result = await prisma.asset.updateMany({
    where: { id, ...owned(scope) },
    data: { status },
  });
  if (!result.count) throw new NotFoundError('Asset not found');
  return prisma.asset.findFirst({ where: { id, ...owned(scope) } });
}
export const listInventory = (scope, query = '') =>
  prisma.inventoryItem.findMany({
    where: {
      ...owned(scope),
      active: true,
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { sku: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { name: 'asc' },
    take: 100,
  });
export const createInventoryItem = (scope, data) =>
  prisma.inventoryItem.create({ data: { ...owned(scope), ...data } });
export async function moveStock(scope, itemId, input, actorId) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findFirst({
      where: { id: itemId, ...owned(scope), active: true },
    });
    if (!item) throw new NotFoundError('Inventory item not found');
    const delta = input.type === 'RECEIPT' ? input.quantity : -input.quantity;
    const balanceAfter = item.quantity + delta;
    if (balanceAfter < 0) throw new ConflictError('Insufficient stock');
    await tx.inventoryItem.update({ where: { id: item.id }, data: { quantity: balanceAfter } });
    return tx.inventoryMovement.create({
      data: {
        ...owned(scope),
        itemId,
        type: input.type,
        quantity: input.quantity,
        balanceAfter,
        reference: input.reference,
        actorId,
      },
    });
  });
}
