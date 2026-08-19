/* global process */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

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

if (!manifest) {
  const port = process.env.BACKEND_PORT || '4000';
  start('npm', ['run', 'dev', '-w', 'backend'], { PORT: port });
}

const frontendPort = process.env.FRONTEND_PORT || String(manifest?.frontend || 5173);
const vite = start(
  'npm',
  ['run', 'dev:server', '--workspace', 'frontend', '--', '--host', '0.0.0.0'],
  {
    FRONTEND_PORT: frontendPort,
  }
);

function shutdown(signal) {
  for (const child of children) child.kill(signal);
}
process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
vite.once('exit', () => shutdown('SIGTERM'));
await new Promise(() => {});
