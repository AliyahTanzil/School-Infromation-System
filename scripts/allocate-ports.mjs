/* global console, process */
import { createServer } from 'node:net';
import { unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function findPort(start) {
  return new Promise((resolvePort, reject) => {
    const tryPort = (port) => {
      const server = createServer();
      server.once('error', (error) => {
        if (error.code === 'EADDRINUSE') return tryPort(port + 1);
        reject(error);
      });
      server.listen(port, '127.0.0.1', () => {
        const address = server.address();
        server.close(() => resolvePort(address.port));
      });
    };
    tryPort(start);
  });
}

const backend = await findPort(Number(process.env.BACKEND_PORT || 3000));
const frontend = await findPort(Number(process.env.FRONTEND_PORT || Math.max(5174, backend + 1)));
const manifest = resolve(process.cwd(), '.sais-ports.json');
try {
  unlinkSync(resolve(process.cwd(), 'backend/.sais-port'));
} catch {
  /* no stale readiness file */
}
writeFileSync(
  manifest,
  JSON.stringify({ backend, frontend, createdAt: new Date().toISOString() }, null, 2)
);
console.log(`[sais] Reserved backend ${backend} and frontend ${frontend}.`);
