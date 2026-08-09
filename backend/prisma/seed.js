/**
 * Prisma seed entry point.
 *
 * Run with:  npm run db:seed   (calls `node prisma/seed.js`)
 *
 * This file is intentionally thin in the infrastructure phase.
 * Business-domain seeders (users, roles, etc.) will be imported here
 * as each module is built and registered in the `seeders` array below.
 */

import { PrismaClient } from '@prisma/client';
import logger from '../src/infrastructure/logger/index.js';

const prisma = new PrismaClient();

// ─── Register module seeders here as they are built ───────────────────────────
import { seedRbac } from './seeders/rbac.seeder.js';
import { seedSchools } from './seeders/school.seeder.js';
import { seedStudents } from './seeders/student.seeder.js';
const seeders = [seedRbac, seedSchools, seedStudents];

async function main() {
  logger.info('Seeding database...');

  for (const seeder of seeders) {
    await seeder(prisma);
  }

  logger.info(`Seeding complete. ${seeders.length} seeder(s) ran.`);
}

main()
  .catch((err) => {
    logger.error('Seed failed', { error: err.message });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
