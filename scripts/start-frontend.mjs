import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { ensureWorkspaceDependencies } from './ensure-workspaces.mjs';

ensureWorkspaceDependencies();

const sleep = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));

async function backendIsReady(port) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/health`, {
      signal: AbortSignal.timeout(800),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function frontendIsReady(port) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/`, {
      signal: AbortSignal.timeout(800),
    });
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
  const isWindowsNpm = process.platform === 'win32' && command === 'npm';
  const executable = isWindowsNpm ? process.execPath : command;
  const spawnArgs = isWindowsNpm ? [process.env.npm_execpath, ...args] : args;
  const child = spawn(executable, spawnArgs, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: 'inherit',
    // Execute npm's JavaScript CLI with Node instead of spawning the Windows
    // .cmd shim, which can throw EINVAL on Node 24.
    shell: false,
  });
  children.push(child);
  child.on('error', (error) => {
    console.error(`[SAIS] Unable to start ${command}: ${error.message}`);
    process.exitCode = 1;
  });
  child.on('exit', (code, signal) => {
    if (code && code !== 0) process.exitCode = code;
    if (signal) process.exitCode = 1;
  });
  return child;
}

const isV0 =
  process.env.SAIS_RUNTIME === 'v0' ||
  process.env.VERCEL ||
  process.env.V0 ||
  process.env.V0_RUNTIME_URL ||
  process.env.V0_DEV_APP_URL;
// Keep the backend off the first preview port. v0 may not expose its runtime
// marker to child processes, so relying on `isV0` here can make the preview
// open the API health response instead of the Vite application.
const backendPort = process.env.BACKEND_PORT || String(manifest?.backend || 44555);
if (!(await backendIsReady(backendPort))) {
  start('npm', ['run', 'dev', '-w', 'backend'], { PORT: backendPort });
  for (let attempt = 0; attempt < 40 && !(await backendIsReady(backendPort)); attempt += 1) {
    await sleep(250);
  }
}

if (!(await backendIsReady(backendPort))) {
  console.error(
    `[SAIS] Backend did not become ready on port ${backendPort}; frontend startup cancelled.`
  );
  for (const child of children) child.kill('SIGTERM');
  process.exit(1);
}

// v0 exposes port 4000 as the preview entrypoint in this project. Keep the
// Vite app on that port unless an explicit port or generated manifest exists.
const frontendPort =
  process.env.FRONTEND_PORT || String(manifest?.frontend || 4000);
const reuseFrontend = await frontendIsReady(frontendPort);
if (reuseFrontend) {
  console.log(`[SAIS] Frontend is already running on port ${frontendPort}; reusing it.`);
} else {
  const vite = start(
    'npm',
    ['run', 'dev:server', '--workspace', 'frontend', '--', '--host', '0.0.0.0'],
    {
      FRONTEND_PORT: frontendPort,
      BACKEND_PORT: backendPort,
      SAIS_LOCAL_DEV: 'true',
    }
  );

  let stopping = false;
  function shutdown(signal) {
    if (stopping) return;
    stopping = true;
    for (const child of children) {
      if (!child.killed) child.kill(signal);
    }
  }
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  vite.once('exit', () => shutdown('SIGTERM'));
  await new Promise(() => {});
}
