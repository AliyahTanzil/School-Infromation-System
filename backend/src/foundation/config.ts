import 'dotenv/config';

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const numberFrom = (name: string, fallback: number): number => {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < 0 || value > 65535) {
    throw new Error(`Invalid numeric environment variable: ${name}`);
  }
  return value;
};

const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: numberFrom('PORT', 3000),
  databaseUrl: process.env.DATABASE_URL ?? '',
  corsOrigins,
  logLevel: process.env.LOG_LEVEL ?? 'info',
};

export const assertProductionConfig = (): void => {
  if (config.env === 'production') required('DATABASE_URL');
};
