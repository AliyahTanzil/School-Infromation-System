import app from './app.js';
import config from './config/index.js';
import logger from './infrastructure/logger/index.js';
import { disconnectDatabase } from './infrastructure/orm/database.js';

const server = app.listen(config.port, () => {
  logger.info(`SAIS backend running at http://localhost:${config.port} [${config.env}]`);
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
