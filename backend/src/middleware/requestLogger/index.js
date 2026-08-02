import { randomUUID } from 'node:crypto';
import morgan from 'morgan';
import logger from '../../infrastructure/logger/index.js';

// Attach/propagate a request ID so logs across middleware/controllers are traceable.
function requestContext(req, res, next) {
  req.requestId = req.headers['x-request-id'] || randomUUID();
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
  requestContext(req, res, () => {
    successLogger(req, res, () => {
      errorLogger(req, res, next);
    });
  });
}
