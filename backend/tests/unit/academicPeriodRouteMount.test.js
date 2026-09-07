import assert from 'node:assert/strict';
import test from 'node:test';

import { createApp } from '../../src/app.ts';

test('active server mounts legacy and versioned academic period routes', async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  try {
    for (const path of ['/api/academic-periods', '/api/v1/academic-periods']) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`);
      const payload = await response.json();
      assert.notEqual(response.status, 404, `${path} must be mounted`);
      assert.equal(payload.success, false);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
