import test from 'node:test';
import assert from 'node:assert/strict';
import libraryRouter, { libraryAdmin } from '../../src/presentation/http/routes/libraryRoutes.js';
import hrRouter, { hrAdmin } from '../../src/presentation/http/routes/hrRoutes.js';

for (const [name, router, guard] of [
  ['library', libraryRouter, libraryAdmin],
  ['hr', hrRouter, hrAdmin],
]) {
  test(`${name} administration accepts authenticated platform owners without role assignments`, () => {
    for (const user of [
      { platformRole: 'OWNER', accountType: 'APPLICATION_MANAGER', roles: [] },
      { roles: ['SCHOOL_ADMIN'] },
      { roles: ['PLATFORM_ADMIN'] },
    ]) {
      let allowed = false;
      guard({ user }, {}, () => {
        allowed = true;
      });
      assert.equal(allowed, true);
    }
  });

  test(`${name} administration rejects ordinary users and caller-supplied owner claims`, () => {
    for (const user of [
      { roles: ['APPLICATION_MANAGER'] },
      { roles: ['OWNER'] },
      { roles: ['TEACHER'] },
      { roles: ['STUDENT'] },
      { roles: ['PARENT'] },
      { accountType: 'APPLICATION_MANAGER', roles: [] },
      { roles: [] },
    ]) {
      assert.throws(
        () =>
          guard(
            {
              user,
              body: { platformRole: 'OWNER' },
              query: { platformRole: 'OWNER' },
              schoolContext: { platformRole: 'OWNER' },
            },
            {},
            () => assert.fail('Access must be denied')
          ),
        /permission/
      );
    }
    assert.throws(
      () => guard({}, {}, () => assert.fail('Authentication required')),
      /Authentication required/
    );
  });

  test(`${name} routes authenticate and resolve school ownership before the admin guard`, () => {
    const middleware = router.stack.filter((layer) => !layer.route).map((layer) => layer.handle);
    assert.deepEqual(
      middleware.map((handler) => handler.name),
      ['authenticate', 'singleSchoolContext', `${name}Admin`]
    );
    assert.equal(middleware[2], guard);
  });
}
