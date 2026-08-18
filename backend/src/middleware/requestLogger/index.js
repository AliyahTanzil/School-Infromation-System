import { randomUUID } from 'node:crypto';
import morgan from 'morgan';
import logger from '../../infrastructure/logger/index.js';
import config from '../../config/index.js';
import { recordRequest } from '../../foundation/metrics.js';

const REDACTED = '[REDACTED]';
const sensitiveKeys = /password|token|secret|authorization|cookie|api[-_]?key/i;

export function redact(value) {
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, sensitiveKeys.test(key) ? REDACTED : entry])
  );
}

// Attach/propagate a request ID so logs across middleware/controllers are traceable.
function requestContext(req, res, next) {
  const supplied = req.headers['x-request-id'];
  const requestId =
    typeof supplied === 'string' && /^[a-zA-Z0-9._:-]{1,128}$/.test(supplied)
      ? supplied
      : randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', req.requestId);
  next();
}

morgan.token('request-id', (req) => req.requestId);

const morganJsonFormat = (tokens, req, res) =>
  JSON.stringify({
    requestId: tokens['request-id'](req, res),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: Number(tokens.status(req, res)),
    responseTimeMs: Number(tokens['response-time'](req, res)),
    contentLength: tokens.res(req, res, 'content-length') || '0',
    remoteAddr: tokens['remote-addr'](req, res),
    userAgent: tokens['user-agent'](req, res),
    at: tokens.date(req, res, 'iso'),
  });

// Success and informational requests.
const successLogger = morgan(morganJsonFormat, {
  skip: (_req, res) => res.statusCode >= 400,
  stream: {
    write: (message) => logger.info('HTTP request', JSON.parse(message)),
  },
});

// Error requests (4xx/5xx) routed to error channel.
const errorLogger = morgan(morganJsonFormat, {
  skip: (_req, res) => res.statusCode < 400,
  stream: {
    write: (message) => logger.error('HTTP request failed', JSON.parse(message)),
  },
});

export default function requestLogger(req, res, next) {
  const startedAt = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    recordRequest({ status: res.statusCode, durationMs });
    if (durationMs >= config.log.slowRequestMs) {
      logger.warn('slow request', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        durationMs: Math.round(durationMs * 100) / 100,
      });
    }
  });
  requestContext(req, res, () => {
    successLogger(req, res, () => {
      errorLogger(req, res, next);
    });
  });
}
