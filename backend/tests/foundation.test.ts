import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/foundation/app.js';

test('GET /api/v1/health returns service status', async () => {
  const response = await request(createApp()).get('/api/v1/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.status, 'ok');
  assert.ok(response.headers['x-request-id']);
});

test('unknown routes return a consistent error envelope', async () => {
  const response = await request(createApp()).get('/api/v1/missing');
  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error.code, 'NOT_FOUND');
  assert.ok(response.body.requestId);
});

test('invalid request IDs are replaced with a safe generated identifier', async () => {
  const response = await request(createApp()).get('/api/v1/health').set('x-request-id', '<unsafe>');
  assert.match(response.headers['x-request-id'], /^[a-f0-9-]{36}$/);
});
