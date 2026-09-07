import { startServer } from './server.js';

void startServer().catch((error: unknown) => {
  console.error('Backend startup failed:', error);
  process.exitCode = 1;
});
