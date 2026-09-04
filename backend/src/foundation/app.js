import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import config from '../config/index.js';
import errorHandler from '../middleware/error/errorHandler.js';
import notFoundHandler from '../middleware/error/notFoundHandler.js';
import requestLogger from '../middleware/requestLogger/index.js';
import router from '../presentation/http/routes/index.js';
import AppError from '../shared/errors/AppError.js';

export function isCorsOriginAllowed(origin) {
  if (!origin) return true;
  const normalizedOrigin = String(origin).replace(/\/$/, '');
  if (config.cors.origins.includes(normalizedOrigin)) return true;

  try {
    const url = new URL(normalizedOrigin);
    const hostname = url.hostname.toLowerCase();
    const projects = new Set([
      'school-administration-information-system-frontend',
      ...String(config.cors.vercelPreviewProject ?? '').split(','),
    ]);
    const belongsToFrontendProject = [...projects]
      .map((project) => project.trim().toLowerCase())
      .filter(Boolean)
      .some(
        (project) =>
          hostname === `${project}.vercel.app` ||
          (hostname.startsWith(`${project}-`) && hostname.endsWith('.vercel.app')) ||
          (hostname.startsWith(`${project}--`) && hostname.endsWith('.vercel.app'))
      );

    return url.protocol === 'https:' && !url.port && belongsToFrontendProject;
  } catch {
    return false;
  }
}

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  if (config.http.trustProxy) app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          imgSrc: ["'self'", 'data:'],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          connectSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'same-origin' },
    })
  );

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || isCorsOriginAllowed(origin)) {
          callback(null, true);
          return;
        }
        callback(
          new AppError('Origin not allowed', {
            statusCode: 403,
            code: 'CORS_ORIGIN_DENIED',
          })
        );
      },
      credentials: config.cors.credentials,
    })
  );

  app.use(
    express.json({
      limit: config.http.bodyLimit,
      verify: (req, _res, buffer) => {
        req.rawBody = buffer.toString('utf8');
      },
    })
  );
  app.use(express.urlencoded({ extended: true, limit: config.http.bodyLimit }));
  app.use(cookieParser());
  app.use(requestLogger);
  app.use('/api/v1', router);
  app.use('/api', router);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
