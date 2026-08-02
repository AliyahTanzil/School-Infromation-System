import { createLogger, format, transports } from 'winston';
import config from '../../config/index.js';

const { combine, timestamp, errors, json, colorize, simple } = format;

const developmentFormat = combine(colorize(), simple());
const productionFormat = combine(timestamp(), errors({ stack: true }), json());

const logger = createLogger({
  level: config.log.level,
  format: config.env === 'production' ? productionFormat : developmentFormat,
  defaultMeta: { service: 'sais-backend' },
  transports: [new transports.Console()],
  exceptionHandlers: [new transports.Console()],
  rejectionHandlers: [new transports.Console()],
});

export default logger;
