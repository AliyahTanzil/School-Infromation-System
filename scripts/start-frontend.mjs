/* global process */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

const sleep = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));

async function backendIsReady(port) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/health`, { signal: AbortSignal.timeout(800) });
    return response.ok;
  } catch {
    return false;
  }
}

const root = resolve(process.cwd(), '..');
const manifestPath = resolve(root, '.sais-ports.json');
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : null;
const children = [];

function start(command, args, env = {}) {
  const child = spawn(command, args, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  children.push(child);
  child.on('exit', (code, signal) => {
    if (code && code !== 0) process.exitCode = code;
    if (signal) process.exitCode = 1;
  });
  return child;
}

const backendPort = process.env.BACKEND_PORT || String(manifest?.backend || 4000);
if (!(await backendIsReady(backendPort))) {
  start('npm', ['run', 'dev', '-w', 'backend'], { PORT: backendPort });
  for (let attempt = 0; attempt < 40 && !(await backendIsReady(backendPort)); attempt += 1) {
    await sleep(250);
  }
}

const frontendPort = process.env.FRONTEND_PORT || String(manifest?.frontend || 5173);
const vite = start(
  'npm',
  ['run', 'dev:server', '--workspace', 'frontend', '--', '--host', '0.0.0.0'],
  {
    FRONTEND_PORT: frontendPort,
    BACKEND_PORT: backendPort,
    SAIS_LOCAL_DEV: 'true',
  },
);

function shutdown(signal) {
  for (const child of children) child.kill(signal);
}
process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
vite.once('exit', () => shutdown('SIGTERM'));
await new Promise(() => {});
