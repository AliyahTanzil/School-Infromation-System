import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('frontend launcher executes npm through Node instead of a Windows command shim', async () => {
  const source = await readFile(
    new URL('../../../scripts/start-frontend.mjs', import.meta.url),
    'utf8'
  );
  assert.match(source, /const isWindowsNpm/);
  assert.match(source, /process\.env\.npm_execpath/);
  assert.match(source, /shell: false/);
  assert.match(source, /child\.on\('error'/);
});
