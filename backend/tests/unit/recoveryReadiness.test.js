import assert from 'node:assert/strict';
import { URL } from 'node:url';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../../../', import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, root), 'utf8');
}

test('production workflow uses deploy migrations and excludes destructive commands', async () => {
  const workflow = await read('.github/workflows/ci.yml');
  const runbook = await read('docs/deployment/backend-twenty-two-architecture.md');

  assert.match(workflow, /db:check/);
  assert.match(workflow, /db:generate/);
  assert.match(runbook, /db:migrate:deploy/);
  assert.match(runbook, /must not run reset/i);
});

test('data lifecycle documentation requires tenant boundaries and isolated restore', async () => {
  const lifecycle = await read('docs/data/backend-twenty-three-lifecycle.md');
  const checklist = await read('docs/data/backend-twenty-three-recovery-checklist.md');

  assert.match(lifecycle, /tenantId/);
  assert.match(lifecycle, /isolated database/);
  assert.match(lifecycle, /exclude secrets and tokens/i);
  assert.match(checklist, /Restore into an isolated database/);
  assert.match(checklist, /integrity checks/);
});

test('schema has tenant and audit models for recovery reconciliation', async () => {
  const schema = await read('backend/prisma/schema.prisma');
  assert.match(schema, /model Tenant\s*\{/);
  assert.match(schema, /model AuditLog\s*\{/);
  assert.match(schema, /tenantId/);
});
