import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import request from 'supertest';
import app from '../../src/app.js';

describe('system routes', () => {
  it('reports that the process is alive without requiring a database', async () => {
    const response = await request(app).get('/api/live').expect(200);

    assert.equal(response.body.success, true);
    assert.equal(response.body.status, 'alive');
    assert.equal(typeof response.body.uptimeMs, 'number');
    assert.ok(response.headers['x-request-id']);
  });

  it('returns the published OpenAPI document', async () => {
    const response = await request(app).get('/api/openapi.json').expect(200);

    assert.equal(response.body.openapi, '3.0.3');
    assert.ok(response.body.paths['/live']);
  });

  it('returns the standard error envelope for an unknown route', async () => {
    const response = await request(app).get('/api/unknown-route').expect(404);

    assert.equal(response.body.success, false);
    assert.equal(response.body.error.code, 'NOT_FOUND');
    assert.ok(response.body.requestId);
  });
});
