import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../../..');

test('health routes expose liveness, readiness, database, and deep diagnostics', () => {
  const routes = fs.readFileSync(
    path.join(root, 'backend/src/presentation/http/routes/healthRoutes.js'),
    'utf8'
  );
  assert.match(routes, /router\.get\('\/live'/);
  assert.match(routes, /router\.get\('\/health\/database'/);
  assert.match(routes, /health\/deep/);
  assert.match(routes, /ready/);
});

test('health diagnostics do not expose database error details', () => {
  const controller = fs.readFileSync(
    path.join(root, 'backend/src/presentation/http/controllers/healthController.js'),
    'utf8'
  );
  assert.doesNotMatch(
    controller,
    /return \{ status: 'down', latencyMs: Date\.now\(\) - start, error:/
  );
  assert.match(controller, /database health check timed out/);
});
