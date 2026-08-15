import assert from 'node:assert/strict';
import test from 'node:test';
import { createApp } from '../../src/app.ts';

test('active server exposes versioned and legacy auth mounts', async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  try {
    for (const path of ['/api/auth/refresh', '/api/v1/auth/refresh']) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      const payload = await response.json();
      assert.notEqual(response.status, 404, `${path} must be mounted`);
      assert.equal(payload.success, false);
      assert.ok(payload.error?.code);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
