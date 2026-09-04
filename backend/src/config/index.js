import 'dotenv/config';

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toBool = (value, fallback) =>
  value === undefined ? fallback : String(value).toLowerCase() === 'true';

const assertRequiredProductionEnvironment = () => {
  if (process.env.NODE_ENV !== 'production') return;

  const missing = [
    ['DATABASE_URL', process.env.DATABASE_URL],
    ['JWT_ACCESS_SECRET', process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET],
    ['JWT_REFRESH_SECRET', process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET],
  ]
    .filter(([, value]) => !value || !String(value).trim())
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }
};

assertRequiredProductionEnvironment();

const config = {
  env: process.env.NODE_ENV ?? 'development',
  // 0 delegates port selection to the operating system when no port is supplied.
  port: Number(process.env.PORT ?? 0),

  // Public base URL of the frontend — used to build links in transactional emails.
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:4000',

  db: {
    url: process.env.DATABASE_URL ?? '',
  },
  redis: {
    url: process.env.REDIS_URL ?? '',
  },
  cors: {
    vercelPreviewProject:
      process.env.CORS_VERCEL_PREVIEW_PROJECT ??
      'school-administration-information-system-frontend',
    origins: [
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
      .map((origin) => origin.trim().replace(/\/$/, ''))
      .filter(Boolean),
    credentials: true,
  },
  http: {
    bodyLimit: process.env.HTTP_BODY_LIMIT ?? '2mb',
    trustProxy: toBool(process.env.TRUST_PROXY, false),
  },

  auth: {
    // Access token — short-lived JWT sent on every request.
    accessTokenSecret: process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET ?? '',
    accessTokenTtl: process.env.JWT_ACCESS_TTL ?? '15m',

    // Refresh token — long-lived opaque token, rotated on each use.
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? '',
    refreshTokenTtlDays: toInt(process.env.REFRESH_TOKEN_TTL_DAYS, 30),

    issuer: process.env.JWT_ISSUER ?? 'sais.auth',
    audience: process.env.JWT_AUDIENCE ?? 'sais.api',

    // Password hashing cost factor.
    bcryptRounds: toInt(process.env.BCRYPT_ROUNDS, 12),

    // Brute-force protection.
    maxFailedLogins: toInt(process.env.MAX_FAILED_LOGINS, 5),
    lockoutMinutes: toInt(process.env.ACCOUNT_LOCKOUT_MINUTES, 15),

    // Single-use token lifetimes.
    emailVerificationTtlHours: toInt(process.env.EMAIL_VERIFICATION_TTL_HOURS, 24),
    passwordResetTtlMinutes: toInt(process.env.PASSWORD_RESET_TTL_MINUTES, 30),

    // Refresh token cookie (httpOnly). Access token stays in memory on the client.
    refreshCookieName: process.env.REFRESH_COOKIE_NAME ?? 'sais_refresh_token',
    refreshCookieSameSite: process.env.REFRESH_COOKIE_SAMESITE ?? 'strict',
  },

  email: {
    // When SMTP host is absent (local/dev), the mailer streams messages to logs
    // instead of sending, so flows are fully testable without a mail server.
    host: process.env.SMTP_HOST ?? '',
    port: toInt(process.env.SMTP_PORT, 587),
    secure: toBool(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER ?? '',
    password: process.env.SMTP_PASSWORD ?? '',
    from: process.env.EMAIL_FROM ?? 'SAIS <no-reply@sais.local>',
  },

  log: {
    level: process.env.LOG_LEVEL ?? 'http',
    dir: process.env.LOG_DIR ?? (process.env.VERCEL ? '/tmp/sais-logs' : 'logs'),
    datePattern: process.env.LOG_DATE_PATTERN ?? 'YYYY-MM-DD',
    maxSize: process.env.LOG_MAX_SIZE ?? '20m',
    maxFiles: process.env.LOG_MAX_FILES ?? '30d',
    zippedArchive: (process.env.LOG_ZIPPED_ARCHIVE ?? 'true').toLowerCase() === 'true',
    slowRequestMs: toInt(process.env.SLOW_REQUEST_MS, 1000),
  },
  observability: {
    metricsEnabled: toBool(process.env.METRICS_ENABLED, true),
  },
};

export default config;
