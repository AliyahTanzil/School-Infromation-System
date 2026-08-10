import prisma from '../../infrastructure/orm/prismaClient.js';

export async function getOverview({ schoolId }) {
  const [assets, maintenance, inventory, lowStock, warehouses, openOrders] = await Promise.all([
    prisma.asset.count({ where: { schoolId, status: { not: 'DISPOSED' } } }),
    prisma.assetMaintenance.count({
      where: { asset: { schoolId }, status: { in: ['OPEN', 'IN_PROGRESS'] } },
    }),
    prisma.inventoryItem.count({ where: { schoolId, active: true } }),
    prisma.inventoryItem.count({ where: { schoolId, active: true, reorderLevel: { gt: 0 } } }),
    prisma.warehouse.count({ where: { schoolId, active: true } }),
    prisma.purchaseOrder.count({
      where: { schoolId, status: { in: ['SUBMITTED', 'APPROVED', 'PARTIAL'] } },
    }),
  ]);
  return { assets, maintenance, inventory, lowStock, warehouses, openOrders };
}

export async function listAssets({ schoolId, query = '' }) {
  return prisma.asset.findMany({
    where: {
      schoolId,
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
    include: {
      category: true,
      location: true,
      assignments: { where: { returnedAt: null }, take: 1 },
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });
}

export async function listInventory({ schoolId, query = '' }) {
  return prisma.inventoryItem.findMany({
    where: {
      schoolId,
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
    include: { unit: true, category: true, batches: { select: { quantity: true } } },
    orderBy: { name: 'asc' },
    take: 50,
  });
}
