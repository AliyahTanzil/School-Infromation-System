import 'dotenv/config';

const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  db: {
    url: process.env.DATABASE_URL ?? '',
  },
  redis: {
    url: process.env.REDIS_URL ?? '',
  },
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET ?? '',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  log: {
    level: process.env.LOG_LEVEL ?? 'http',
    dir: process.env.LOG_DIR ?? 'logs',
    datePattern: process.env.LOG_DATE_PATTERN ?? 'YYYY-MM-DD',
    maxSize: process.env.LOG_MAX_SIZE ?? '20m',
    maxFiles: process.env.LOG_MAX_FILES ?? '30d',
    zippedArchive: (process.env.LOG_ZIPPED_ARCHIVE ?? 'true').toLowerCase() === 'true',
  },
};

export default config;
