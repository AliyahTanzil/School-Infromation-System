import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { linkSchema, profileSchema } from '../../src/application/validators/parentValidators.js';

const root = path.resolve(import.meta.dirname, '../../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('parent linking requires a UUID and relationship', () => {
  assert.throws(() => linkSchema.parse({ studentId: 'forged' }));
});

test('parent profile validation rejects ownership fields', () => {
  assert.throws(() =>
    profileSchema.parse({ firstName: 'A', lastName: 'Parent', schoolId: 'forged' })
  );
});

test('parent persistence contract links users to tenant-scoped students', () => {
  const schema = read('backend/prisma/schema.prisma');
  assert.match(schema, /model Parent \{/);
  assert.match(schema, /model ParentProfile \{/);
  assert.match(schema, /model ParentStudentRelationship \{/);
  assert.match(schema, /@@id\(\[parentId, studentId\]\)/);
});

test('parent portal queries and links are tenant-scoped', () => {
  const repository = read('backend/src/infrastructure/repositories/parentRepository.js');
  const service = read('backend/src/application/services/parentService.js');
  const context = read('backend/src/middleware/auth/parentContext.js');
  assert.match(repository, /where: \{ id: parentId, tenantId, deletedAt: null \}/);
  assert.match(service, /where: \{ id: studentId, tenantId \}/);
  assert.match(context, /userId: req\.user\.id, tenantId: req\.user\.tenantId/);
});

test('parent API is enabled only through its authenticated route', () => {
  const routes = read('backend/src/presentation/http/routes/index.js');
  const parentRoutes = read('backend/src/presentation/http/routes/parentRoutes.js');
  assert.match(routes, /router\.use\('\/parents', parentRoutes\)/);
  assert.match(parentRoutes, /router\.use\(authenticate\)/);
  assert.match(parentRoutes, /router\.use\(requireParentContext\)/);
});
