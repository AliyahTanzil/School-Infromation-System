import test from 'node:test';
import assert from 'node:assert/strict';
import authorizeSchoolAdmin from '../../src/middleware/auth/authorizeSchoolAdmin.js';
import authenticate from '../../src/middleware/auth/authenticate.js';
import schoolContext from '../../src/middleware/auth/teacherContext.js';
import paymentRouter, {
  monimeWebhookHandler,
} from '../../src/presentation/http/routes/paymentGatewayRoutes.js';

test('school administrator guard accepts persisted owners and existing administrator roles', () => {
  for (const user of [
    { platformRole: 'OWNER', roles: [] },
    { platformRole: 'OWNER' },
    { roles: ['PLATFORM_ADMIN'] },
    { roles: ['SCHOOL_ADMIN'] },
  ]) {
    let calls = 0;
    authorizeSchoolAdmin({ user }, {}, () => calls++);
    assert.equal(calls, 1);
  }
});

test('school administrator guard rejects missing authentication and forged ownership', () => {
  for (const user of [
    undefined,
    {},
    { roles: ['TEACHER'] },
    { roles: ['STUDENT'] },
    { roles: ['PARENT'] },
    { roles: ['OWNER'] },
    { roles: ['APPLICATION_MANAGER'] },
    { accountType: 'APPLICATION_MANAGER', roles: [] },
    { platformRole: 'owner', roles: [] },
  ]) {
    assert.throws(
      () =>
        authorizeSchoolAdmin(
          {
            user,
            body: { platformRole: 'OWNER', roles: ['SCHOOL_ADMIN'] },
            query: { platformRole: 'OWNER' },
            schoolContext: { platformRole: 'OWNER' },
          },
          {},
          () => assert.fail('Unauthorized request reached the next handler')
        ),
      user ? /permission/ : /Authentication required/
    );
  }
});

for (const name of [
  'academicPolicy',
  'assetInventory',
  'boarding',
  'finance',
  'paymentGateway',
  'timetable',
  'transport',
]) {
  test(`${name} administration resolves authenticated school scope before owner authorization`, async () => {
    const { default: router } = await import(`../../src/presentation/http/routes/${name}Routes.js`);
    const middleware = router.stack.filter((layer) => !layer.route).map((layer) => layer.handle);
    assert.deepEqual(middleware, [authenticate, schoolContext, authorizeSchoolAdmin]);
    const guardIndex = router.stack.findIndex((layer) => layer.handle === authorizeSchoolAdmin);
    for (const [index, layer] of router.stack.entries()) {
      if (!layer.route || (name === 'paymentGateway' && layer.route.path === '/webhook')) continue;
      assert.ok(index > guardIndex, `${layer.route.path} must follow the administrator guard`);
    }
  });
}

test('payment webhook retains its separate provider-authenticated entry point', () => {
  const webhookIndex = paymentRouter.stack.findIndex((layer) => layer.route?.path === '/webhook');
  const authenticationIndex = paymentRouter.stack.findIndex(
    (layer) => layer.handle === authenticate
  );
  assert.ok(webhookIndex >= 0 && webhookIndex < authenticationIndex);
  const route = paymentRouter.stack[webhookIndex].route;
  assert.equal(route.methods.post, true);
  assert.deepEqual(
    route.stack.map((layer) => layer.handle),
    [monimeWebhookHandler]
  );
});
