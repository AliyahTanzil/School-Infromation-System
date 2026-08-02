import { PrismaClient } from '@prisma/client';
import logger from '../logger/index.js';

/**
 * PrismaClient singleton.
 *
 * In development, Node's module cache is busted on every hot-reload which
 * would otherwise create a new PrismaClient (and new DB connection pool)
 * on each change.  We attach one shared instance to `globalThis` so that
 * the same client is reused across reloads.
 *
 * In production `globalThis.__prisma` is never set, so a fresh client is
 * created exactly once per process lifetime.
 */

const globalForPrisma = /** @type {{ __prisma?: PrismaClient }} */ (globalThis);

const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'info' },
      { emit: 'event', level: 'warn' },
      { emit: 'event', level: 'error' },
    ],
  });

// Forward Prisma log events into Winston so all log output is unified.
prisma.$on('query', (e) => {
  logger.debug('Prisma query', { query: e.query, duration: `${e.duration}ms` });
});

prisma.$on('info', (e) => {
  logger.info('Prisma info', { message: e.message });
});

prisma.$on('warn', (e) => {
  logger.warn('Prisma warn', { message: e.message });
});

prisma.$on('error', (e) => {
  logger.error('Prisma error', { message: e.message });
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma;
}

export default prisma;
