import assert from 'node:assert/strict';
import test from 'node:test';
import { toUserDto } from '../../src/application/dtos/userDto.js';

test('user DTO excludes security fields and includes roles', () => {
  const dto = toUserDto({
    id: '1',
    email: 'a@example.com',
    status: 'ACTIVE',
    passwordHash: 'secret',
    failedLoginCount: 8,
    profile: { firstName: 'A' },
    userRoles: [{ role: { code: 'ADMIN', name: 'Admin' }, scopeKey: 'global', expiresAt: null }],
  });
  assert.equal(dto.passwordHash, undefined);
  assert.equal(dto.failedLoginCount, undefined);
  assert.deepEqual(dto.roles, ['ADMIN']);
  assert.equal(dto.profile.firstName, 'A');
});
