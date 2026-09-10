import test from 'node:test';
import assert from 'node:assert/strict';
import router, {
  academicPeriodAdmin,
} from '../../src/presentation/http/routes/academicPeriodRoutes.js';

test('academic calendar accepts the platform owner and existing administrator roles', () => {
  for (const user of [
    { platformRole: 'OWNER', accountType: 'APPLICATION_MANAGER', roles: [] },
    { roles: ['SCHOOL_ADMIN'] },
    { roles: ['PLATFORM_ADMIN'] },
  ]) {
    let allowed = false;
    academicPeriodAdmin({ user }, {}, () => {
      allowed = true;
    });
    assert.equal(allowed, true);
  }
});

test('calendar does not grant administrative access from an ordinary account type or client input', () => {
  for (const user of [
    { roles: ['TEACHER'] },
    { roles: ['STUDENT'] },
    { roles: ['PARENT'] },
    { accountType: 'APPLICATION_MANAGER', roles: [] },
  ]) {
    assert.throws(
      () =>
        academicPeriodAdmin({ user, body: { platformRole: 'OWNER' } }, {}, () =>
          assert.fail('Access must be denied')
        ),
      /permission/
    );
  }
  assert.throws(
    () => academicPeriodAdmin({}, {}, () => assert.fail('Authentication required')),
    /Authentication required/
  );
});

test('all calendar routes retain authentication and school resolution ahead of the administrator guard', () => {
  const middleware = router.stack.filter((layer) => !layer.route).map((layer) => layer.handle);
  assert.deepEqual(
    middleware.map((handler) => handler.name),
    ['authenticate', 'singleSchoolContext', 'academicPeriodAdmin']
  );
});
