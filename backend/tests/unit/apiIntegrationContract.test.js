import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import { createApp } from '../../src/app.js';

const app = createApp();

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

test('active TypeScript server mounts the frontend user-management contract', () => {
  const app = read('backend/src/foundation/app.ts');
  assert.match(app, /app\.use\('\/api\/users', userRouter\)/);
  assert.match(app, /app\.use\('\/api\/v1\/users', userRouter\)/);
});

test('active TypeScript server mounts the parent portal contract', () => {
  const app = read('backend/src/foundation/app.ts');
  assert.match(app, /app\.use\('\/api\/parents', parentRouter\)/);
  assert.match(app, /app\.use\('\/api\/v1\/parents', parentRouter\)/);
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

test('platform owners can open the tenant administration workspace', () => {
  const app = read('frontend/src/App.jsx');
  assert.match(
    app,
    /path="\/tenant-admin"[\s\S]*?allowed=\{\[[\s\S]*?'APPLICATION_MANAGER'[\s\S]*?'OWNER'/
  );
});

test('health contract includes live, ready, and database probes', () => {
  const routes = read('backend/src/presentation/http/routes/healthRoutes.js');
  assert.match(routes, /router\.get\('\/live'/);
  assert.match(routes, /router\.get\('\/ready'/);
  assert.match(routes, /router\.get\('\/health\/database'/);
});

test('routes without active Prisma models fail closed with a controlled contract', () => {
  const routes = read('backend/src/presentation/http/routes/index.js');
  const unavailable = read('backend/src/presentation/http/routes/featureUnavailableRoutes.js');
  assert.match(unavailable, /status\(501\)/);
  assert.match(unavailable, /FEATURE_NOT_IMPLEMENTED/);
  assert.match(routes, /router\.use\('\/subjects', subjectRoutes\)/);
  assert.match(routes, /router\.use\('\/classes', classRoutes\)/);
  assert.match(routes, /router\.use\('\/finance', financeRoutes\)/);
  assert.match(routes, /featureUnavailableRoutes\('Digital|featureUnavailableRoutes\('AI/);
});

test('platform actions use the active audit model', () => {
  const service = read('backend/src/application/services/platformAdminService.js');
  assert.match(service, /prisma\.auditLog\.create/);
  assert.doesNotMatch(service, /prisma\.platformAuditEvent/);
});

test('deferred domains return a controlled runtime response', async () => {
  for (const path of [
    '/api/ai-intelligence',
    '/api/billing/overview',
    '/api/v1/billing/overview',
  ]) {
    const response = await request(app).get(path).expect(501);
    assert.equal(response.body.error.code, 'FEATURE_NOT_IMPLEMENTED');
    assert.ok(response.body.error.details.requiredTask);
  }
});

test('incomplete billing and unsigned webhook handlers are not mounted', () => {
  const appSource = read('backend/src/foundation/app.ts');
  assert.doesNotMatch(appSource, /import billingRouter/);
  assert.doesNotMatch(appSource, /app\.use\('\/api(?:\/v1)?\/billing', billingRouter\)/);
  assert.match(
    appSource,
    /app\.use\('\/api\/billing', featureUnavailableRoutes\('Subscription billing', 'SaaS-001'\)\)/
  );
  assert.match(
    appSource,
    /app\.use\('\/api\/v1\/billing', featureUnavailableRoutes\('Subscription billing', 'SaaS-001'\)\)/
  );
});

test('operational analytics routes require authentication', async () => {
  await request(app).get('/api/analytics/overview').expect(401);
});

test('operational class routes require authentication', async () => {
  await request(app).get('/api/classes').expect(401);
});

test('operational attendance routes require authentication', async () => {
  await request(app).get('/api/attendance').expect(401);
});
