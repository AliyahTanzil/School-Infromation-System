import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const schemaPath = new URL('../prisma/schema.prisma', import.meta.url);
const migrationRoot = new URL('../prisma/migrations/', import.meta.url);

test('schema defines tenant-scoped academic and identity uniqueness', async () => {
  const schema = await readFile(schemaPath, 'utf8');
  assert.match(schema, /@@unique\(\[tenantId, name\]\)/);
  assert.match(schema, /model AcademicYear/);
  assert.match(schema, /model AcademicTerm/);
  assert.match(schema, /model UserRole/);
  assert.match(schema, /email\s+String\s+@unique/);
});

test('migration history contains no reset or destructive baseline command', async () => {
  const { readdir } = await import('node:fs/promises');
  const entries = await readdir(migrationRoot, { withFileTypes: true });
  const sqlFiles = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => `${entry.name}/migration.sql`);
  assert.ok(sqlFiles.length > 0);
  for (const relative of sqlFiles) {
    const sql = await readFile(new URL(relative, migrationRoot), 'utf8');
    assert.doesNotMatch(sql, /DROP DATABASE|TRUNCATE|prisma migrate reset/i);
  }
});
