export const PERMISSIONS = Object.freeze({
  USERS_READ: 'users.read',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_ACTIVATE: 'users.activate',
  USERS_DEACTIVATE: 'users.deactivate',
  USERS_RESTORE: 'users.restore',
  ROLES_READ: 'roles.read',
  ROLES_CREATE: 'roles.create',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',
  ROLES_ASSIGN: 'roles.assign',
  PERMISSIONS_READ: 'permissions.read',
  PERMISSIONS_ASSIGN: 'permissions.assign',
});

export const SYSTEM_ROLES = Object.freeze({
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
  SCHOOL_ADMIN: 'SCHOOL_ADMIN',
  TEACHER: 'TEACHER',
  PARENT: 'PARENT',
});

export const PERMISSION_CATALOG = Object.freeze([
  {
    group: 'users',
    name: 'Users',
    permissions: [
      { code: PERMISSIONS.USERS_READ, name: 'Read users' },
      { code: PERMISSIONS.USERS_CREATE, name: 'Create users' },
      { code: PERMISSIONS.USERS_UPDATE, name: 'Update users' },
      { code: PERMISSIONS.USERS_DELETE, name: 'Delete users' },
      { code: PERMISSIONS.USERS_ACTIVATE, name: 'Activate users' },
      { code: PERMISSIONS.USERS_DEACTIVATE, name: 'Deactivate users' },
      { code: PERMISSIONS.USERS_RESTORE, name: 'Restore users' },
    ],
  },
  {
    group: 'roles',
    name: 'Roles',
    permissions: [
      { code: PERMISSIONS.ROLES_READ, name: 'Read roles' },
      { code: PERMISSIONS.ROLES_CREATE, name: 'Create roles' },
      { code: PERMISSIONS.ROLES_UPDATE, name: 'Update roles' },
      { code: PERMISSIONS.ROLES_DELETE, name: 'Delete roles' },
      { code: PERMISSIONS.ROLES_ASSIGN, name: 'Assign roles' },
    ],
  },
  {
    group: 'permissions',
    name: 'Permissions',
    permissions: [
      { code: PERMISSIONS.PERMISSIONS_READ, name: 'Read permissions' },
      { code: PERMISSIONS.PERMISSIONS_ASSIGN, name: 'Assign permissions' },
    ],
  },
]);

export default PERMISSIONS;
