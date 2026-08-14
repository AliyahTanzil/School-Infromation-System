import { createApp } from './foundation/app.js';
import { assertProductionConfig, config } from './foundation/config.js';
import { disconnectPrisma } from './foundation/prisma.js';

assertProductionConfig();
const app = createApp();
const server = app.listen(config.port, '0.0.0.0', () => {
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : config.port;
  console.info(`[sais-backend] listening on ${port}`);
});

const shutdown = async (signal: string) => {
  console.info(`[sais-backend] ${signal} received; shutting down`);
  server.close(async () => {
    await disconnectPrisma();
    process.exit(0);
  });
};

process.once('SIGTERM', () => void shutdown('SIGTERM'));
process.once('SIGINT', () => void shutdown('SIGINT'));
