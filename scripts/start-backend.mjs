import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const manifest = JSON.parse(readFileSync('.sais-ports.json', 'utf8'));
const child = spawn(process.execPath, [process.env.npm_execpath, 'run', 'dev', '-w', 'backend'], {
  env: { ...process.env, PORT: String(manifest.backend) },
  stdio: 'inherit',
  shell: false,
});
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
process.once('SIGINT', () => child.kill('SIGINT'));
process.once('SIGTERM', () => child.kill('SIGTERM'));
