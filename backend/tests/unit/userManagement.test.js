import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';
import { toUserDto } from '../../src/application/dtos/userDto.js';
import {
  createUserSchema,
  getUserSchema,
  listUsersSchema,
  profileSchema,
  pushTokenSchema,
  statusSchema,
  userIdSchema,
} from '../../src/application/validators/userValidators.js';
import { upsertPreference } from '../../src/infrastructure/repositories/userProfileRepository.js';

const userId = '11111111-1111-4111-8111-111111111111';

test('user DTO excludes security fields and includes roles', () => {
  const dto = toUserDto({
    id: '1',
    email: 'a@example.com',
    status: 'ACTIVE',
    passwordHash: 'secret',
    failedLoginCount: 8,
    profile: { firstName: 'A' },
    roles: [{ role: { code: 'ADMIN', name: 'Admin' }, expiresAt: null }],
  });
  assert.equal(dto.passwordHash, undefined);
  assert.equal(dto.failedLoginCount, undefined);
  assert.deepEqual(dto.roles, ['ADMIN']);
  assert.equal(dto.profile.firstName, 'A');
});

test('user creation requires the identity fields persisted by the active schema', () => {
  const result = createUserSchema.safeParse({
    body: {
      firstName: 'Mariama',
      lastName: 'Kamara',
      email: 'mariama@example.com',
      password: 'Temporary-Password-123',
      status: 'ACTIVE',
    },
  });

  assert.equal(result.success, true);
  assert.equal(result.data.body.accountType, 'STAFF');
});

test('user administration schemas reject forged ownership and administrator account creation', () => {
  const base = {
    firstName: 'Mariama',
    lastName: 'Kamara',
    email: 'mariama@example.com',
    password: 'Temporary-Password-123',
  };
  assert.equal(createUserSchema.safeParse({ body: { ...base, tenantId: userId } }).success, false);
  assert.equal(
    createUserSchema.safeParse({ body: { ...base, accountType: 'APPLICATION_MANAGER' } }).success,
    false
  );
  assert.equal(
    profileSchema.safeParse({
      params: { id: userId },
      body: { profile: { phone: '+232000000' } },
    }).success,
    false
  );
});

test('user route inputs validate identifiers, bounded queries, and authenticated push tokens', () => {
  assert.equal(userIdSchema.safeParse({ params: { id: 'not-a-uuid' } }).success, false);
  assert.equal(
    getUserSchema.safeParse({ params: { id: userId }, query: { includeDeleted: 'yes' } }).success,
    false
  );
  assert.equal(
    listUsersSchema.safeParse({ query: { pageSize: 101, includeDeleted: 'true' } }).success,
    false
  );
  assert.equal(
    statusSchema.safeParse({
      params: { id: userId },
      body: { status: 'ACTIVE', actorId: userId },
    }).success,
    false
  );
  assert.equal(
    pushTokenSchema.safeParse({
      body: {
        userId,
        deviceFingerprint: 'device-1',
        pushToken: 'ExponentPushToken[example]',
      },
    }).success,
    false
  );
  assert.equal(
    pushTokenSchema.safeParse({
      body: {
        deviceFingerprint: 'device-1',
        platform: 'android',
        pushToken: 'ExponentPushToken[example]',
      },
    }).success,
    true
  );
});

test('preference persistence maps API settings into the active JSON column', async () => {
  let operation;
  const tx = {
    userPreference: {
      findUnique: async () => ({ settings: { theme: 'light', emailAlerts: true } }),
      upsert: async (input) => {
        operation = input;
        return input.update;
      },
    },
  };

  await upsertPreference(userId, { locale: 'en-GB', theme: 'dark' }, tx);
  assert.deepEqual(operation.update, {
    locale: 'en-GB',
    settings: { theme: 'dark', emailAlerts: true },
  });
  assert.equal(operation.update.theme, undefined);
});

test('profile and image operations enforce tenant scope and atomic auditing', async () => {
  const [routes, controller, profileService, imageService] = await Promise.all([
    readFile(new URL('../../src/presentation/http/routes/userRoutes.js', import.meta.url), 'utf8'),
    readFile(
      new URL('../../src/presentation/http/controllers/userController.js', import.meta.url),
      'utf8'
    ),
    readFile(new URL('../../src/application/services/profileService.js', import.meta.url), 'utf8'),
    readFile(new URL('../../src/application/services/imageService.js', import.meta.url), 'utf8'),
  ]);

  assert.match(routes, /validate\(getUserSchema\)/);
  assert.match(routes, /validate\(pushTokenSchema\)/);
  assert.match(routes, /validate\(userIdSchema\)/);
  assert.match(controller, /req\.schoolContext\.tenantId/);
  assert.doesNotMatch(controller, /userId: req\.user\.id, \.\.\.req\.body/);
  assert.match(profileService, /prisma\.\$transaction/);
  assert.match(profileService, /findById\(userId, tenantId/);
  assert.match(imageService, /where: \{ id: userId, tenantId, deletedAt: null \}/);
  assert.match(imageService, /auditRepo\.create/);
});
