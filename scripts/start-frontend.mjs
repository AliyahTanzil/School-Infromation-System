import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { backendStartTimeout, waitForBackend } from './backend-readiness.mjs';
import { findAvailablePort } from './available-port.mjs';
import { ensureWorkspaceDependencies } from './ensure-workspaces.mjs';

ensureWorkspaceDependencies();

const startupTimeout = backendStartTimeout(process.env.BACKEND_START_TIMEOUT);

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

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = resolve(root, '.sais-ports.json');
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : null;
const children = [];
const spawnErrors = new WeakMap();
let stopping = false;
function shutdown(signal = 'SIGTERM') {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.pid || child.exitCode !== null || child.signalCode !== null) continue;
    if (process.platform === 'win32') {
      // npm launches grandchildren: stopping only npm leaves the server running.
      spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      });
    } else {
      child.kill(signal);
    }
  }
}
process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

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
    spawnErrors.set(child, error);
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
const backendPort =
  (Number(process.env.BACKEND_PORT) !== 0 && process.env.BACKEND_PORT) ||
  String(manifest?.backend || (isV0 ? 44555 : 4000));
if (!(await backendIsReady(backendPort))) {
  const backend = start('npm', ['run', 'dev', '-w', 'backend'], { PORT: backendPort });
  console.log(
    '[SAIS] Waiting up to ' +
      startupTimeout / 1000 +
      ' seconds for backend on port ' +
      backendPort +
      '...'
  );
  try {
    const ready = await waitForBackend(() => backendIsReady(backendPort), {
      timeoutMs: startupTimeout,
      hasExited: () =>
        stopping ||
        spawnErrors.has(backend) ||
        backend.exitCode !== null ||
        backend.signalCode !== null,
    });
    if (!ready)
      throw new Error(
        'Backend did not become ready on port ' +
          backendPort +
          ' within ' +
          startupTimeout +
          'ms. Set BACKEND_START_TIMEOUT for a slower machine.'
      );
  } catch (error) {
    console.error('[SAIS] ' + error.message + ' Frontend startup cancelled.');
    shutdown();
    process.exit(1);
  }
}

const requestedFrontendPort = Number(process.env.FRONTEND_PORT || manifest?.frontend || 3000);
const frontendPort = await findAvailablePort(requestedFrontendPort);
if (frontendPort !== requestedFrontendPort) {
  console.log(
    '[SAIS] Port ' +
      requestedFrontendPort +
      ' is occupied; starting frontend on ' +
      frontendPort +
      '.'
  );
}
const vite = start(
  'npm',
  ['run', 'dev:server', '--workspace', 'frontend', '--', '--host', '0.0.0.0'],
  {
    FRONTEND_PORT: String(frontendPort),
    BACKEND_PORT: backendPort,
    VITE_BACKEND_URL: 'http://127.0.0.1:' + backendPort,
    SAIS_LOCAL_DEV: 'true',
  }
);
vite.once('exit', () => shutdown('SIGTERM'));
vite.once('error', () => shutdown('SIGTERM'));
await new Promise(() => {});
