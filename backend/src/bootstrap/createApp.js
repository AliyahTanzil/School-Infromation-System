import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import config from '../config/index.js';
import errorHandler from '../middleware/error/errorHandler.js';
import notFoundHandler from '../middleware/error/notFoundHandler.js';
import requestLogger from '../middleware/requestLogger/index.js';
import router from '../presentation/http/routes/index.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  if (config.http.trustProxy) app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.cors.origins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Origin not allowed: ${origin}`));
      },
      credentials: config.cors.credentials,
    })
  );
  app.use(express.json({ limit: config.http.bodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: config.http.bodyLimit }));
  app.use(cookieParser());
  app.use(requestLogger);
  app.use('/api', router);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
