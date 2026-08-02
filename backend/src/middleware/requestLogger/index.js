import morgan from 'morgan';
import logger from '../../infrastructure/logger/index.js';

// Pipe Morgan's request logs into Winston so all log output is unified.
const stream = {
  write: (message) => logger.http(message.trim()),
};

const requestLogger = morgan(
  // Standard Apache "combined" format: method, URL, status, response-time.
  ':method :url :status :res[content-length] - :response-time ms',
  { stream }
);

export default requestLogger;
