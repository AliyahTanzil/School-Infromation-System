import { readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import dotenv from 'dotenv';

const projectEnvPath = '/vercel/share/.env.project';
dotenv.config({ path: projectEnvPath });
dotenv.config({ path: join(process.cwd(), '.env'), override: false });

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const testsRoot = join(backendRoot, 'tests');

function discoverTests(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return discoverTests(path);
    return /\.test\.(?:js|ts)$/.test(entry.name) ? [relative(backendRoot, path)] : [];
  });
}

const testFiles = discoverTests(testsRoot).sort();
if (!testFiles.length) throw new Error('No backend tests were discovered.');

const coverage = process.argv.includes('--coverage');
const args = [
  '--require',
  './scripts/tsx-windows-preload.cjs',
  '--import',
  'tsx',
  ...(coverage ? ['--experimental-test-coverage'] : []),
  '--test',
  '--test-concurrency=1',
  ...testFiles,
];

console.log(`[SAIS] Running ${testFiles.length} backend test files sequentially.`);
const result = spawnSync(process.execPath, args, {
  cwd: backendRoot,
  stdio: 'inherit',
  env: { ...process.env, SKIP_DATABASE_TESTS: '1' },
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
