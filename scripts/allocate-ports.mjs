import { findAvailablePort as findPort } from './available-port.mjs';
import { unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// The v0 preview auto-detects the lowest common dev port, so the user-facing
// frontend must own it. The frontend proxies /api to the backend, which lives
// on a higher port and never needs to be the detected preview target.
// Port 0 asks the operating system for an available ephemeral port. Explicit
// values remain supported for CI and deployment environments that require them.
const isV0 =
  process.env.SAIS_RUNTIME === 'v0' ||
  process.env.VERCEL ||
  process.env.V0 ||
  process.env.V0_RUNTIME_URL ||
  process.env.V0_DEV_APP_URL;
const frontendStart = process.env.FRONTEND_PORT || 3000;
const frontend = await findPort(Number(frontendStart));
const backend = await findPort(Number(process.env.BACKEND_PORT || (isV0 ? 44555 : 0)), [frontend]);
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
