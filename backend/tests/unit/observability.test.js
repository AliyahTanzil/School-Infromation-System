import assert from 'node:assert/strict';
import test from 'node:test';
import { recordRequest, resetMetrics, snapshotMetrics } from '../../src/foundation/metrics.js';
import { redact } from '../../src/middleware/requestLogger/index.js';

test('metrics record request totals and status buckets', () => {
  resetMetrics();
  recordRequest({ status: 200, durationMs: 12 });
  recordRequest({ status: 500, durationMs: 30 });
  const metrics = snapshotMetrics();

  assert.equal(metrics.requests, 2);
  assert.equal(metrics.errors, 1);
  assert.equal(metrics.byStatus['200'], 1);
  assert.equal(metrics.byStatus['500'], 1);
  assert.equal(metrics.averageDurationMs, 21);
});

test('request log redaction removes credential-shaped fields', () => {
  const safe = redact({ email: 'user@example.com', password: 'secret', accessToken: 'jwt' });
  assert.deepEqual(safe, {
    email: 'user@example.com',
    password: '[REDACTED]',
    accessToken: '[REDACTED]',
  });
});

test('redaction does not mutate the source object', () => {
  const source = { authorization: 'Bearer token', method: 'GET' };
  redact(source);
  assert.equal(source.authorization, 'Bearer token');
});
