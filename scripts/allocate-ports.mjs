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

// The v0 preview auto-detects the lowest common dev port, so the user-facing
// frontend must own it. The frontend proxies /api to the backend, which lives
// on a higher port and never needs to be the detected preview target.
// Port 0 asks the operating system for an available ephemeral port. Explicit
// values remain supported for CI and deployment environments that require them.
const isV0 = process.env.SAIS_RUNTIME === 'v0' || process.env.VERCEL || process.env.V0 || process.env.V0_RUNTIME_URL || process.env.V0_DEV_APP_URL;
const frontend = await findPort(Number(process.env.FRONTEND_PORT || 0));
const backend = await findPort(Number(process.env.BACKEND_PORT || (isV0 ? 44555 : 0)));
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
