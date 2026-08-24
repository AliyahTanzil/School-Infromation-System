import type { Server } from 'node:http';
import { unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createApp } from './app.js';
import { assertProductionConfig, config } from './foundation/config.js';
import { disconnectPrisma } from './foundation/prisma.js';
import { logger } from './foundation/logger.js';

const portFile = resolve(process.cwd(), '.sais-port');

export const startServer = (): Server => {
  assertProductionConfig();
  try {
    unlinkSync(portFile);
  } catch {
    // No stale readiness file is safe to remove.
  }
  const app = createApp();
  const server = app.listen(config.port, '0.0.0.0', () => {
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : config.port;
    writeFileSync(portFile, String(port));
    logger.info('server listening', { port });
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info('shutdown requested', { signal });
    server.close(async () => {
      try {
        unlinkSync(portFile);
      } catch {
        // The readiness file may already be absent.
      }
      await disconnectPrisma();
      process.exitCode = 0;
    });
  };

  process.once('SIGTERM', () => void shutdown('SIGTERM'));
  process.once('SIGINT', () => void shutdown('SIGINT'));
  return server;
};
