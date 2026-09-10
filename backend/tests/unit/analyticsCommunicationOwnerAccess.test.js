import test from 'node:test';
import assert from 'node:assert/strict';
import analytics from '../../src/presentation/http/routes/analyticsRoutes.js';
import communication from '../../src/presentation/http/routes/communicationRoutes.js';
import authenticate from '../../src/middleware/auth/authenticate.js';
import schoolContext from '../../src/middleware/auth/singleSchoolContext.js';
import authorizeSchoolAdmin from '../../src/middleware/auth/authorizeSchoolAdmin.js';

for (const [name, router] of [
  ['analytics', analytics],
  ['communication', communication],
]) {
  test(`${name} resolves authenticated school context before any endpoint`, () => {
    assert.deepEqual(
      router.stack.filter((layer) => !layer.route).map((layer) => layer.handle),
      [authenticate, schoolContext]
    );
    assert.equal(
      router.stack.findIndex((layer) => layer.route),
      2
    );
  });
}

for (const [router, method, path] of [
  [analytics, 'post', '/exports'],
  [communication, 'get', '/notifications'],
  [communication, 'post', '/notifications'],
  [communication, 'get', '/notification-delivery-health'],
]) {
  test(`${method} ${path} admits authenticated owners and rejects ordinary or forged administrator claims`, () => {
    const route = router.stack.find(
      (layer) => layer.route?.path === path && layer.route.methods[method]
    ).route;
    const guard = route.stack[0].handle;
    assert.equal(guard, authorizeSchoolAdmin);
    for (const user of [
      { platformRole: 'OWNER', roles: [] },
      { roles: ['PLATFORM_ADMIN'] },
      { roles: ['SCHOOL_ADMIN'] },
    ]) {
      let calls = 0;
      guard({ user }, {}, () => calls++);
      assert.equal(calls, 1);
    }
    for (const user of [
      undefined,
      {},
      { roles: ['TEACHER'] },
      { roles: ['STUDENT'] },
      { roles: ['PARENT'] },
      { roles: ['OWNER'] },
      { accountType: 'APPLICATION_MANAGER' },
    ]) {
      assert.throws(
        () =>
          guard(
            {
              user,
              body: { platformRole: 'OWNER' },
              query: { roles: ['SCHOOL_ADMIN'] },
              schoolContext: { platformRole: 'OWNER' },
            },
            {},
            () => assert.fail('Unauthorized request reached handler')
          ),
        user ? /permission/ : /Authentication required/
      );
    }
  });
}

test('personal communication endpoints retain their existing user access', () => {
  const expected = [
    ['get', '/inbox'],
    ['get', '/notifications/unread-count'],
    ['post', '/notifications/:notificationId/read'],
    ['get', '/notification-preferences'],
    ['put', '/notification-preferences'],
  ];
  for (const [method, path] of expected) {
    const route = communication.stack.find(
      (layer) => layer.route?.path === path && layer.route.methods[method]
    ).route;
    assert.equal(
      route.stack.some((layer) => layer.handle === authorizeSchoolAdmin),
      false
    );
  }
});
