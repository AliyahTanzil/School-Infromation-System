import { PrismaClient } from '@prisma/client';

import { seedDevelopmentAccounts } from '../prisma/seeders/developmentAccounts.seeder.js';

const prisma = new PrismaClient();

try {
  const result = await seedDevelopmentAccounts(prisma);
  console.info(JSON.stringify({ seeded: true, accounts: result.accounts }));
} finally {
  await prisma.$disconnect();
}
