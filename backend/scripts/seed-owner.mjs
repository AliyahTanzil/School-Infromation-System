import { PrismaClient } from '@prisma/client';

import { seedApplicationOwner } from '../prisma/seeders/applicationOwner.seeder.js';

if (process.env.NODE_ENV === 'production') {
  throw new Error('Owner seeding is disabled when NODE_ENV=production');
}

const prisma = new PrismaClient();

try {
  await seedApplicationOwner(prisma);
} finally {
  await prisma.$disconnect();
}
