import type { Server } from 'node:http';
import { createApp } from './app.js';
import { assertProductionConfig, config } from './foundation/config.js';
import { disconnectPrisma } from './foundation/prisma.js';
import { logger } from './foundation/logger.js';

export const startServer = (): Server => {
  assertProductionConfig();
  const app = createApp();
  const server = app.listen(config.port, '0.0.0.0', () => {
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : config.port;
    logger.info('server listening', { port });
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info('shutdown requested', { signal });
    server.close(async () => {
      await disconnectPrisma();
      process.exitCode = 0;
    });
  };

  process.once('SIGTERM', () => void shutdown('SIGTERM'));
  process.once('SIGINT', () => void shutdown('SIGINT'));
  return server;
};
