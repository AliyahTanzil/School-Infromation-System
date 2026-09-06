import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { findAvailablePort } from '../../../scripts/available-port.mjs';
import { backendStartTimeout, waitForBackend } from '../../../scripts/backend-readiness.mjs';

function clock() {
  let time = 0;
  return {
    now: () => time,
    sleep: async (ms) => {
      time += ms;
    },
  };
}

test('backend cold starts longer than ten seconds are allowed', async () => {
  const timer = clock();
  const ready = await waitForBackend(async () => timer.now() >= 15000, timer);
  assert.equal(ready, true);
  assert.equal(timer.now(), 15000);
});

test('backend readiness respects a configurable deadline', async () => {
  const timer = clock();
  assert.equal(await waitForBackend(async () => false, { ...timer, timeoutMs: 1250 }), false);
  assert.equal(timer.now(), 1250);
  const slowTimer = clock();
  assert.equal(
    await waitForBackend(async () => slowTimer.now() >= 70000, { ...slowTimer, timeoutMs: 90000 }),
    true
  );
});

test('backend exits stop the readiness wait immediately', async () => {
  const timer = clock();
  await assert.rejects(
    waitForBackend(async () => false, {
      ...timer,
      hasExited: () => timer.now() >= 500,
    }),
    /exited before becoming ready/
  );
  assert.equal(timer.now(), 500);
});

test('invalid startup deadlines cannot silently disable readiness checking', () => {
  assert.equal(backendStartTimeout(), 60000);
  for (const value of ['', 'invalid', 'Infinity', '0', '-1']) {
    assert.throws(() => backendStartTimeout(value), /positive number/);
  }
});

test('frontend launcher executes npm through Node instead of a Windows command shim', async () => {
  const source = await readFile(
    new URL('../../../scripts/start-frontend.mjs', import.meta.url),
    'utf8'
  );
  assert.match(source, /const isWindowsNpm/);
  assert.match(source, /process\.env\.npm_execpath/);
  assert.match(source, /shell: false/);
  assert.match(source, /child\.on\('error'/);
  assert.match(source, /await findAvailablePort\(requestedFrontendPort\)/);
  assert.match(source, /VITE_BACKEND_URL: 'http:\/\/127\.0\.0\.1:' \+ backendPort/);
  assert.match(source, /vite\.once\('exit'/);
  assert.doesNotMatch(source, /reusing it/);
});

test('occupied frontend ports are skipped without stopping the existing listener', async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '0.0.0.0', resolve));
  try {
    const occupied = server.address().port;
    const available = await findAvailablePort(occupied);
    assert.ok(available > occupied);
    assert.equal(server.listening, true);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('dev:all uses the shared supervisor and legacy wrappers do not spawn a shell', async () => {
  const pkg = JSON.parse(await readFile(new URL('../../../package.json', import.meta.url), 'utf8'));
  assert.match(pkg.scripts['dev:all'], /node scripts\/start-frontend\.mjs$/);
  assert.doesNotMatch(pkg.scripts['dev:all'], /concurrently/);
  for (const file of ['start-backend.mjs', 'wait-for-backend.mjs']) {
    const source = await readFile(new URL(`../../../scripts/${file}`, import.meta.url), 'utf8');
    assert.match(source, /spawn\(process\.execPath/);
    assert.match(source, /shell: false/);
  }
});

test('released frontend reservations cannot be assigned to the backend', async () => {
  const frontend = await findAvailablePort(0);
  const backend = await findAvailablePort(frontend, [frontend]);
  assert.notEqual(backend, frontend);
});
