import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createApp } from '../../src/app.js';

const app = createApp();

test('rejects invalid login input before reaching the service', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: 'not-an-email', password: '' });
  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
});

test('rejects protected endpoints without a bearer token', async () => {
  const response = await request(app).get('/api/auth/me');
  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});
