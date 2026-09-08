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

const booleanFrom = (name: string, fallback: boolean): boolean => {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') return fallback;
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  throw new Error(`Invalid boolean environment variable: ${name}`);
};

const corsOrigins = [
  process.env.CORS_ORIGIN,
  process.env.CORS_ORIGIN_2,
  process.env.CORS_ORIGIN_2_2,
  process.env.CORS_ORIGIN_2_3,
  process.env.CORS_ORIGIN_3,
  process.env.CORS_ORIGIN_4,
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
  process.env.V0_RUNTIME_URL,
  process.env.V0_DEV_APP_URL,
  'http://localhost:3000',
  'http://localhost:4000',
  'http://localhost:5173',
]
  .filter(Boolean)
  .flatMap((value) => String(value).split(','))
  .map((origin) => origin.trim())
  .map((origin) => origin.replace(/\/$/, ''))
  .filter(Boolean);

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: numberFrom('PORT', 3000),
  databaseUrl: process.env.DATABASE_URL ?? '',
  singleSchoolId: process.env.SINGLE_SCHOOL_ID ?? '',
  corsOrigins,
  corsVercelPreviewProject:
    process.env.CORS_VERCEL_PREVIEW_PROJECT ?? 'school-administration-information-system-frontend',
  trustProxy: booleanFrom('TRUST_PROXY', false),
  logLevel: process.env.LOG_LEVEL ?? 'info',
  jsonBodyLimit: process.env.HTTP_BODY_LIMIT ?? '1mb',
  urlencodedBodyLimit: process.env.HTTP_URLENCODED_BODY_LIMIT ?? '100kb',
};

export const assertProductionConfig = (): void => {
  if (config.env === 'production') {
    required('DATABASE_URL');
    required('JWT_ACCESS_SECRET');
    required('JWT_REFRESH_SECRET');
  }
};
