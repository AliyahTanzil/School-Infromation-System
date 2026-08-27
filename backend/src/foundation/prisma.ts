// Reuse the domain-layer singleton so health, authentication, and application
// routes share one pool instead of creating competing Prisma clients.
// @ts-expect-error Legacy JavaScript singleton is the canonical Prisma client during migration.
import prismaClient from '../infrastructure/orm/prismaClient.js';

export const prisma = prismaClient;

export const disconnectPrisma = async (): Promise<void> => {
  await prisma.$disconnect();
};
