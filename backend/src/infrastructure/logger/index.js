import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import config from '../../config/index.js';

const { combine, timestamp, errors, json, colorize, printf } = format;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '../../../');
const logDirectory = path.resolve(backendRoot, config.log.dir);

// Ensure log directory exists before file transports start writing.
fs.mkdirSync(logDirectory, { recursive: true });

const consoleFormat = combine(
  colorize({ all: true }),
  timestamp(),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metadata = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    const errorStack = stack ? `\n${stack}` : '';
    return `${ts} [${level}] ${message}${metadata}${errorStack}`;
  })
);

const fileFormat = combine(timestamp(), errors({ stack: true }), json());

const loggerTransports = [
  // Console logging (always enabled) for local dev and container logs.
  new transports.Console({
    level: config.log.level,
    format: config.env === 'production' ? fileFormat : consoleFormat,
  }),

  // Daily rotated application logs (info and above).
  new DailyRotateFile({
    level: 'info',
    dirname: logDirectory,
    filename: 'application-%DATE%.log',
    datePattern: config.log.datePattern,
    zippedArchive: config.log.zippedArchive,
    maxSize: config.log.maxSize,
    maxFiles: config.log.maxFiles,
    format: fileFormat,
  }),

  // Daily rotated request logs.
  new DailyRotateFile({
    level: 'info',
    dirname: logDirectory,
    filename: 'request-%DATE%.log',
    datePattern: config.log.datePattern,
    zippedArchive: config.log.zippedArchive,
    maxSize: config.log.maxSize,
    maxFiles: config.log.maxFiles,
    format: fileFormat,
  }),

  // Daily rotated error-only logs.
  new DailyRotateFile({
    level: 'error',
    dirname: logDirectory,
    filename: 'error-%DATE%.log',
    datePattern: config.log.datePattern,
    zippedArchive: config.log.zippedArchive,
    maxSize: config.log.maxSize,
    maxFiles: config.log.maxFiles,
    format: fileFormat,
  }),
];

const logger = createLogger({
  level: config.log.level,
  defaultMeta: { service: 'sais-backend', environment: config.env },
  transports: loggerTransports,
  // Keep process alive long enough to flush logs; app-level lifecycle controls shutdown.
  exitOnError: false,
  // Unhandled exception logging (separate rotated file + console).
  exceptionHandlers: [
    new transports.Console({ format: consoleFormat }),
    new DailyRotateFile({
      dirname: logDirectory,
      filename: 'exceptions-%DATE%.log',
      datePattern: config.log.datePattern,
      zippedArchive: config.log.zippedArchive,
      maxSize: config.log.maxSize,
      maxFiles: config.log.maxFiles,
      format: fileFormat,
    }),
  ],
  // Unhandled rejection logging (separate rotated file + console).
  rejectionHandlers: [
    new transports.Console({ format: consoleFormat }),
    new DailyRotateFile({
      dirname: logDirectory,
      filename: 'rejections-%DATE%.log',
      datePattern: config.log.datePattern,
      zippedArchive: config.log.zippedArchive,
      maxSize: config.log.maxSize,
      maxFiles: config.log.maxFiles,
      format: fileFormat,
    }),
  ],
});

export default logger;
