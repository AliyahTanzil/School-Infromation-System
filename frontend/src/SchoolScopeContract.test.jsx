/* global process */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';

it('uses the configured school and real campus branch workflow without manual scope fields', async () => {
  const [school, branches] = await Promise.all([
    readFile(resolve(process.cwd(), 'src/SchoolAdmin.jsx'), 'utf8'),
    readFile(resolve(process.cwd(), 'src/SchoolBranches.jsx'), 'utf8'),
  ]);

  expect(school).not.toContain('x-tenant-id');
  expect(school).not.toContain('tenantId:');
  expect(branches).not.toContain('schoolId:');
  expect(branches).toContain('api.post(`/schools/${schoolId}/branches`, { name })');
  expect(branches).toContain('Loading branches...');
  expect(branches).not.toContain('�');
});
