import { config } from './config.js';

type Fields = Record<string, unknown>;

const write = (level: string, message: string, fields: Fields = {}): void => {
  const entry = { level, message, ...fields, timestamp: new Date().toISOString() };
  if (config.env === 'development') console.info(`[${level}] ${message}`, fields);
  else console.info(JSON.stringify(entry));
};

export const logger = {
  debug: (message: string, fields?: Fields) => write('debug', message, fields),
  info: (message: string, fields?: Fields) => write('info', message, fields),
  warn: (message: string, fields?: Fields) => write('warn', message, fields),
  error: (message: string, fields?: Fields) => write('error', message, fields),
};
