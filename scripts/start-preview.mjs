/* global console, process, setTimeout */
import { createServer } from 'node:net';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

const root = resolve(process.cwd(), '..');
const frontendRoot = process.cwd();
const backendPortFile = resolve(root, 'backend/.sais-port');
const manifestFile = resolve(root, '.sais-ports.json');

function canUse(port) {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once('error', (error) => {
      if (error.code === 'EADDRINUSE') return resolvePort(false);
      reject(error);
    });
    server.listen(port, '127.0.0.1', () => {
      server.close(() => resolvePort(true));
    });
  });
}

async function nextPort(start) {
  for (let port = start; port < start + 100; port += 1) {
    if (await canUse(port)) return port;
  }
  throw new Error(`No available port found near ${start}.`);
}

function stop(child) {
  if (child && !child.killed) child.kill('SIGTERM');
}

const preferredBackend = Number(process.env.BACKEND_PORT || 3000);
const preferredFrontend = Number(process.env.FRONTEND_PORT || 5173);
const backend = await nextPort(preferredBackend);
const frontend = await nextPort(Math.max(preferredFrontend, backend + 1));

try {
  unlinkSync(backendPortFile);
} catch {
  // No stale readiness file is normal on a clean start.
}
writeFileSync(
  manifestFile,
  JSON.stringify({ backend, frontend, createdAt: new Date().toISOString() }, null, 2)
);

console.log(`[sais] Allocated backend ${backend} and frontend ${frontend}.`);
const backendChild = spawn('npm', ['run', 'dev', '-w', 'backend'], {
  cwd: root,
  env: {
    ...process.env,
    PORT: String(backend),
    FRONTEND_URL: `http://localhost:${frontend}`,
    CORS_ORIGIN: `http://localhost:${frontend}`,
  },
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

const deadline = Date.now() + Number(process.env.BACKEND_START_TIMEOUT || 30000);
while (
  (!existsSync(backendPortFile) ||
    Number.parseInt(readFileSync(backendPortFile, 'utf8'), 10) !== backend) &&
  Date.now() < deadline
) {
  await new Promise((resolveWait) => setTimeout(resolveWait, 250));
}
if (!existsSync(backendPortFile)) {
  stop(backendChild);
  throw new Error('Backend did not publish its allocated port before the startup timeout.');
}

const frontendChild = spawn(
  process.execPath,
  [resolve(root, 'node_modules/vite/bin/vite.js'), '--host', '0.0.0.0', '--port', String(frontend)],
  {
    cwd: frontendRoot,
    env: {
      ...process.env,
      FRONTEND_PORT: String(frontend),
      VITE_BACKEND_URL: `http://localhost:${backend}`,
    },
    stdio: 'inherit',
  }
);

function shutdown() {
  stop(frontendChild);
  stop(backendChild);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
frontendChild.on('exit', (code) => {
  stop(backendChild);
  process.exit(code ?? 0);
});
backendChild.on('exit', (code) => {
  if (code && !frontendChild.killed) stop(frontendChild);
});
