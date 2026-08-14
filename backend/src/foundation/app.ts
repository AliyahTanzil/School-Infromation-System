import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { config } from './config.js';
import { errorHandler, notFound, requestId, requestLogger } from './middleware.js';
import { healthRouter } from './health.js';

export const createApp = () => {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(cookieParser());
  app.use(requestId);
  app.use(requestLogger);
  app.use('/api/v1', healthRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
};
