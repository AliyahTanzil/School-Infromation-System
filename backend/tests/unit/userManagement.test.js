import assert from 'node:assert/strict';
import test from 'node:test';
import { toUserDto } from '../../src/application/dtos/userDto.js';
import { createUserSchema } from '../../src/application/validators/userValidators.js';

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
