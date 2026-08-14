import { prisma } from '../src/foundation/prisma.js';

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Development seed cannot run in production');
  }
  await prisma.databaseSentinel.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  console.info('[sais-backend] database foundation seed completed without business records');
}

main()
  .catch((error) => {
    console.error('[sais-backend] database foundation seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
