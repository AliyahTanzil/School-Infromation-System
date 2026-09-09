/* global process */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';

it('offers only school-issued non-administrator account types', async () => {
  const source = await readFile(resolve(process.cwd(), 'src/UserManagement.jsx'), 'utf8');

  expect(source).toContain("accountType: 'STAFF'");
  expect(source).toContain('<option value="TEACHER">Teacher</option>');
  expect(source).toContain('<option value="PARENT">Parent</option>');
  expect(source).toContain('<option value="STUDENT">Student</option>');
  expect(source).not.toContain('<option value="APPLICATION_MANAGER">');
  expect(source).not.toContain('<option value="TENANT_ADMIN">');
  expect(source).toContain("label: 'Visible users'");
});
