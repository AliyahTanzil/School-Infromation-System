import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import config from './config/index.js';
import errorHandler from './middleware/error/errorHandler.js';
import notFoundHandler from './middleware/error/notFoundHandler.js';
import requestLogger from './middleware/requestLogger/index.js';
import router from './presentation/http/routes/index.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: config.cors.credentials }));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestLogger);
app.use('/api', router);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
