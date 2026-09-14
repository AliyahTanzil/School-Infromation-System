import assert from 'node:assert/strict';
import test from 'node:test';
import authorize from '../../src/middleware/auth/authorize.js';
import { requireRole } from '../../src/middleware/auth/authorization.js';
import validate from '../../src/middleware/validation/validate.js';
import { teacherCreateSchema } from '../../src/application/validators/teacherValidators.js';

for (const factory of [authorize, requireRole]) {
  test(`${factory.name} permits the owner without school role assignments`, async () => {
    let calls = 0;
    await factory('SCHOOL_ADMIN')(
      { user: { platformRole: 'OWNER', roles: [] } },
      {},
      () => calls++
    );
    assert.equal(calls, 1);
  });
  test(`${factory.name} still rejects an unrelated role and unauthenticated requests`, async () => {
    for (const user of [undefined, { roles: ['STUDENT'] }]) {
      await assert.rejects(async () => factory('SCHOOL_ADMIN')({ user }, {}, () => assert.fail()));
    }
  });
}

test('teacher request middleware accepts profile creation without an employee number', () => {
  const req = {
    body: { profile: { firstName: 'Alie', lastName: 'Turay', email: 'teacher@example.test' } },
  };
  let passed = false;
  validate(teacherCreateSchema)(req, {}, () => {
    passed = true;
  });
  assert.equal(passed, true);
  assert.equal(req.body.employeeNumber, undefined);
});
