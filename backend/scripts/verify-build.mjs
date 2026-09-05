import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../dist/app.js';
import { disconnectPrisma } from '../dist/foundation/prisma.js';

// Load the production artifact with plain Node, without tsx or source imports.
try {
  const app = createApp();
  const health = await request(app).get('/api/v1/health');
  assert.equal(health.status, 200);
  assert.equal(health.body.data.status, 'ok');

  for (const route of ['/api/users', '/api/search']) {
    const response = await request(app).get(route);
    assert.equal(response.status, 401, `${route} must be mounted and require authentication`);
  }
  console.log('Compiled backend imports successfully; health and protected routes pass.');
} finally {
  await disconnectPrisma();
}
