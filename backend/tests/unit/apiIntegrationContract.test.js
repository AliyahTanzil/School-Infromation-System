import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('backend exposes the frontend authentication contract under /api', () => {
  const routes = read('backend/src/presentation/http/routes/index.js');
  const auth = read('backend/src/presentation/http/routes/authRoutes.js');
  assert.match(routes, /router\.use\('\/auth', authRoutes\)/);
  assert.match(auth, /router\.post\('\/login'/);
  assert.match(auth, /router\.post\('\/refresh'/);
  assert.match(auth, /router\.post\('\/logout'/);
  assert.match(auth, /router\.get\('\/me'/);
});

test('student list contract is bounded and tenant-scoped', () => {
  const service = read('backend/src/application/services/studentDomainService.js');
  const repository = read('backend/src/infrastructure/repositories/studentDomainRepository.js');
  assert.match(service, /Math\.min\(100/);
  assert.match(service, /tenantId/);
  assert.match(repository, /tenantId/);
  assert.match(service, /totalPages/);
});

test('frontend API clients use the same-origin API boundary', () => {
  const auth = read('frontend/src/api/auth.js');
  const vite = read('frontend/vite.config.js');
  assert.match(auth, /baseURL:.*'\/api'/s);
  assert.match(auth, /withCredentials: true/);
  assert.match(vite, /proxy/);
});

test('health contract includes live, ready, and database probes', () => {
  const routes = read('backend/src/presentation/http/routes/healthRoutes.js');
  assert.match(routes, /router\.get\('\/live'/);
  assert.match(routes, /router\.get\('\/ready'/);
  assert.match(routes, /router\.get\('\/health\/database'/);
});
