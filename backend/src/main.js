import app from './app.js';
import config from './config/index.js';
import logger from './infrastructure/logger/index.js';
import { disconnectDatabase } from './infrastructure/orm/database.js';

let currentPort = config.port;
const server = app.listen(currentPort, () => {
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : config.port;
  logger.info(`SAIS backend running at http://localhost:${port} [${config.env}]`);
});

server.on('error', (error) => {
  if (error.code !== 'EADDRINUSE') {
    logger.error(`Unable to start SAIS backend: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const nextPort = currentPort + 1;
  logger.warn(`Port ${currentPort} is already in use; retrying on ${nextPort}.`);
  currentPort = nextPort;
  server.close(() => server.listen(currentPort));
});

async function shutdown(signal) {
  logger.info(`${signal} received; starting graceful shutdown.`);
  server.close(async () => {
    await disconnectDatabase();
    logger.info('HTTP server closed.');
    process.exit(0);
  });
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
