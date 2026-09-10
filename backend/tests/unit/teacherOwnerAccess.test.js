import test from 'node:test';
import assert from 'node:assert/strict';
import router, { administerTeachers } from '../../src/presentation/http/routes/teacherRoutes.js';
import authenticate from '../../src/middleware/auth/authenticate.js';
import schoolContext from '../../src/middleware/auth/teacherContext.js';

test('teacher administration accepts persisted platform ownership and existing administrator roles', () => {
  for (const user of [
    { platformRole: 'OWNER', roles: [] },
    { platformRole: 'OWNER' },
    ...['PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'APPLICATION_MANAGER', 'OWNER'].map((role) => ({
      roles: [role],
    })),
  ]) {
    let calls = 0;
    administerTeachers({ user }, {}, () => calls++);
    assert.equal(calls, 1);
  }
});

test('teacher administration rejects ordinary users, account types and forged owner claims', () => {
  for (const user of [
    undefined,
    {},
    { roles: ['TEACHER'] },
    { roles: ['STUDENT'] },
    { roles: ['PARENT'] },
    { accountType: 'APPLICATION_MANAGER', roles: [] },
  ]) {
    assert.throws(
      () =>
        administerTeachers(
          {
            user,
            body: { platformRole: 'OWNER' },
            query: { roles: ['SCHOOL_ADMIN'] },
            schoolContext: { platformRole: 'OWNER' },
          },
          {},
          () => assert.fail('Access must be denied')
        ),
      user ? /permission/ : /Authentication required/
    );
  }
});

test('all four teacher administrator endpoints retain authentication, school context and validation', () => {
  assert.deepEqual(
    router.stack.filter((layer) => !layer.route).map((layer) => layer.handle),
    [authenticate, schoolContext]
  );
  assert.equal(
    router.stack.findIndex((layer) => layer.route),
    2
  );
  const routes = router.stack
    .filter((layer) => layer.route && layer.route.path !== '/me')
    .map((layer) => layer.route);
  assert.equal(routes.length, 4);
  for (const route of routes) {
    assert.equal(route.stack[0].handle, administerTeachers);
    assert.equal(route.stack.length, 3);
  }
});

test('teacher self-profile requires a teacher role even for platform owners', () => {
  const selfIndex = router.stack.findIndex((layer) => layer.route?.path === '/me');
  const detailIndex = router.stack.findIndex((layer) => layer.route?.path === '/:id');
  assert.ok(selfIndex < detailIndex);
  const guard = router.stack[selfIndex].route.stack[0].handle;
  for (const user of [{ roles: ['TEACHER'] }, { platformRole: 'OWNER', roles: ['TEACHER'] }]) {
    let calls = 0;
    guard({ user }, {}, () => calls++);
    assert.equal(calls, 1);
  }
  for (const user of [
    { platformRole: 'OWNER', roles: [] },
    { roles: ['SCHOOL_ADMIN'] },
    undefined,
  ]) {
    assert.throws(
      () => guard({ user }, {}, () => assert.fail('Teacher identity required')),
      user ? /permission/ : /Authentication required/
    );
  }
});
