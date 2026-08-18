import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { config } from './config.js';
import { errorHandler, notFound, requestId, requestLogger } from './middleware.js';
import { healthRouter } from './health.js';
// @ts-expect-error Legacy JavaScript router is mounted during the TypeScript migration.
import authRouter from '../presentation/http/routes/authRoutes.js';

export const createApp = () => {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins, credentials: true }));
  app.use(express.json({ limit: config.jsonBodyLimit }));
  app.use(express.urlencoded({ extended: false, limit: config.urlencodedBodyLimit }));
  app.use(cookieParser());
  app.use(requestId);
  app.use(requestLogger);
  app.use('/api/v1', healthRouter);
  // Keep the legacy auth implementation on the active TypeScript server until
  // the remaining domain routes are migrated to the foundation app.
  app.use('/api/auth', authRouter);
  app.use('/api/v1/auth', authRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
};
