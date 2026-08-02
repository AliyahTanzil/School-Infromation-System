import 'express-async-errors';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import requestLogger from './middleware/requestLogger/index.js';
import notFoundHandler from './middleware/error/notFoundHandler.js';
import errorHandler from './middleware/error/errorHandler.js';
import router from './presentation/http/routes/index.js';
import logger from './infrastructure/logger/index.js';
import config from './config/index.js';

const app = express();

// ─── Security ─────────────────────────────────────────────────────────────────
// helmet: sets security-related HTTP headers (X-Frame-Options, CSP, etc.)
app.use(helmet());

// cors: allows cross-origin requests from approved origins
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*', credentials: true }));

// ─── Performance ──────────────────────────────────────────────────────────────
// compression: gzip/deflate response bodies to reduce payload size
app.use(compression());

// ─── Body parsing ─────────────────────────────────────────────────────────────
// Parse incoming JSON request bodies
app.use(express.json());
// Parse URL-encoded bodies (HTML form data)
app.use(express.urlencoded({ extended: true }));

// ─── Request logging (Morgan → Winston) ───────────────────────────────────────
app.use(requestLogger);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', router);

// ─── 404 fallthrough ──────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(config.port, () => {
  logger.info(`SAIS backend running — http://localhost:${config.port} [${config.env}]`);
});

export default app;
