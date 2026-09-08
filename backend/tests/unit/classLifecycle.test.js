import test from 'node:test';
import assert from 'node:assert/strict';
import { assertCapacity, assertClassTransition } from '../../src/domain/classLifecycle.js';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';

test('class lifecycle allows planned to active', () =>
  assert.doesNotThrow(() => assertClassTransition('PLANNED', 'ACTIVE')));
test('class lifecycle rejects archived to active', () =>
  assert.throws(() => assertClassTransition('ARCHIVED', 'ACTIVE')));
test('class capacity rejects over-enrollment', () => assert.throws(() => assertCapacity(20, 21)));

test('class, section, and enrollment persistence is tenant and school scoped', async () => {
  const [schema, service, routes, app, dashboard] = await Promise.all([
    readFile(new URL('../../prisma/schema.prisma', import.meta.url), 'utf8'),
    readFile(new URL('../../src/application/services/classService.js', import.meta.url), 'utf8'),
    readFile(new URL('../../src/presentation/http/routes/index.js', import.meta.url), 'utf8'),
    readFile(new URL('../../src/foundation/app.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../../frontend/src/ClassDashboard.jsx', import.meta.url), 'utf8'),
  ]);
  assert.match(schema, /model Class \{/);
  assert.match(schema, /model ClassEnrollment \{/);
  assert.match(schema, /model ClassSubject \{/);
  assert.match(service, /where: \{ id: studentId, tenantId, schoolId, deletedAt: null \}/);
  assert.match(routes, /router\.use\('\/classes', classRoutes\)/);
  assert.match(app, /app\.use\('\/api\/classes', classRouter\)/);
  assert.doesNotMatch(dashboard, /demoClasses/);
  assert.match(dashboard, /api\.post\('\/classes'/);
});
