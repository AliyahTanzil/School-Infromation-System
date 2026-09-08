import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { registerSchema } from '../../src/application/validators/authValidators.js';

const base = {
  email: 'applicant@example.com',
  password: 'StrongPassword123!',
  firstName: 'School',
  lastName: 'Owner',
};

test('public registration accepts only the approval-based administrator account type', () => {
  assert.equal(registerSchema.safeParse({ body: base }).success, true);
  assert.equal(registerSchema.parse({ body: base }).body.accountType, 'TENANT_ADMIN');
  for (const accountType of ['STAFF', 'TEACHER', 'PARENT', 'STUDENT']) {
    assert.equal(registerSchema.safeParse({ body: { ...base, accountType } }).success, false);
  }
});

test('controller enforces administrator registration and frontend does not submit staff signup', async () => {
  const controller = await readFile(
    new URL('../../src/presentation/http/controllers/authController.js', import.meta.url),
    'utf8'
  );
  const frontend = await readFile(
    new URL('../../../frontend/src/App.jsx', import.meta.url),
    'utf8'
  );
  assert.match(controller, /accountType: 'TENANT_ADMIN'/);
  assert.doesNotMatch(frontend, /accountType: 'STAFF'/);
  assert.match(frontend, /Public self-registration is unavailable for staff/);
});
