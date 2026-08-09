import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PERMISSIONS,
  PERMISSION_CATALOG,
  SYSTEM_ROLES,
} from '../../src/shared/authorization/permissionCodes.js';

test('RBAC catalog uses stable namespaced permission codes', () => {
  const codes = PERMISSION_CATALOG.flatMap((group) =>
    group.permissions.map((permission) => permission.code)
  );
  assert.ok(codes.length > 0);
  assert.equal(new Set(codes).size, codes.length);
  assert.ok(codes.every((code) => /^[a-z]+\.[a-z]+$/.test(code)));
  assert.equal(PERMISSIONS.ROLES_ASSIGN, 'roles.assign');
});

test('system roles distinguish platform and school administration', () => {
  assert.equal(SYSTEM_ROLES.PLATFORM_ADMIN, 'PLATFORM_ADMIN');
  assert.equal(SYSTEM_ROLES.SCHOOL_ADMIN, 'SCHOOL_ADMIN');
  assert.notEqual(SYSTEM_ROLES.PLATFORM_ADMIN, SYSTEM_ROLES.SCHOOL_ADMIN);
});
