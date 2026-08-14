import { prisma } from '../src/foundation/prisma.js';

async function main(): Promise<void> {
  await prisma.databaseSentinel.create({ data: {} });
  console.info('[sais-backend] database foundation seed completed');
}

main()
  .catch((error) => {
    console.error('[sais-backend] database foundation seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
