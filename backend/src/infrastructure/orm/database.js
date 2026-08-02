/**
 * Database connection health utility.
 *
 * Used by the /health endpoint and integration test setup to confirm
 * the database is reachable before accepting traffic or running tests.
 */

import prisma from './prismaClient.js';
import logger from '../logger/index.js';

/**
 * Pings the database with a cheap raw query.
 * Resolves to `true` when healthy, throws on failure.
 *
 * @returns {Promise<boolean>}
 */
export async function checkDatabaseConnection() {
  await prisma.$queryRaw`SELECT 1`;
  logger.info('Database connection healthy');
  return true;
}

/**
 * Gracefully disconnects Prisma.
 * Call this on SIGTERM / SIGINT so the process exits cleanly.
 *
 * @returns {Promise<void>}
 */
export async function disconnectDatabase() {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}
