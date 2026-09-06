import { existsSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { backendStartTimeout } from './backend-readiness.mjs';

const portFile = new URL('../backend/.sais-port', import.meta.url);
const deadline = Date.now() + backendStartTimeout(process.env.BACKEND_START_TIMEOUT);

while (!existsSync(portFile) && Date.now() < deadline) {
  await new Promise((resolve) => setTimeout(resolve, 250));
}

if (!existsSync(portFile)) {
  console.error('[sais] Backend did not publish a port before the startup timeout.');
  process.exit(1);
}

const port = readFileSync(portFile, 'utf8').trim();
const manifest = JSON.parse(readFileSync(new URL('../.sais-ports.json', import.meta.url), 'utf8'));
if (!/^\d+$/.test(port) || Number(port) !== manifest.backend) {
  console.error('[sais] Backend readiness file contained an unexpected port.');
  process.exit(1);
}
console.log(`[sais] Backend ready on port ${port}; starting frontend.`);
const child = spawn(process.execPath, [process.env.npm_execpath, 'run', 'dev', '-w', 'frontend'], {
  env: {
    ...process.env,
    FRONTEND_PORT: String(manifest.frontend),
    VITE_BACKEND_URL: `http://localhost:${port}`,
  },
  stdio: 'inherit',
  shell: false,
});
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
process.once('SIGINT', () => child.kill('SIGINT'));
process.once('SIGTERM', () => child.kill('SIGTERM'));
