import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../../..');

test('OpenAPI contract documents stable error envelope and auth schemes', () => {
  const spec = fs.readFileSync(path.join(root, 'docs/backend/openapi.yaml'), 'utf8');
  assert.match(spec, /components:/);
  assert.match(spec, /bearerAuth:/);
  assert.match(spec, /refreshCookie:/);
  assert.match(spec, /Error:/);
  assert.match(spec, /VALIDATION_ERROR/);
});

test('contract inventory includes tenant-scoped student routes', () => {
  const inventory = fs.readFileSync(
    path.join(root, 'docs/backend/api-contract-inventory.md'),
    'utf8'
  );
  assert.match(inventory, /studentDomainRoutes/);
  assert.match(inventory, /router\.get|GET/);
  assert.match(inventory, /router\.post|POST/);
});
