import { prisma } from '../src/foundation/prisma.js';
import { config } from '../src/foundation/config.js';

const main = async (): Promise<void> => {
  console.info(
    JSON.stringify({ environment: config.env, databaseConfigured: Boolean(config.databaseUrl) })
  );
  if (!config.databaseUrl) {
    console.error('DATABASE_URL is not configured');
    process.exitCode = 1;
    return;
  }
  try {
    const result = await prisma.$queryRaw<Array<{ now: Date }>>`SELECT NOW() AS now`;
    console.info(JSON.stringify({ connected: true, serverTime: result[0]?.now?.toISOString() }));
  } catch (error) {
    console.error(
      'Database connectivity failed',
      error instanceof Error ? error.message : 'unknown error'
    );
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

void main();
