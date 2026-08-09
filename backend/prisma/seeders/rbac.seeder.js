import {
  PERMISSION_CATALOG,
  SYSTEM_ROLES,
} from '../../src/shared/authorization/permissionCodes.js';

export async function seedRbac(prisma) {
  const permissionIds = [];
  for (const group of PERMISSION_CATALOG) {
    const savedGroup = await prisma.permissionGroup.upsert({
      where: { key: group.group },
      update: { name: group.name },
      create: { key: group.group, name: group.name },
    });
    for (const item of group.permissions) {
      const permission = await prisma.permission.upsert({
        where: { code: item.code },
        update: { name: item.name, permissionGroupId: savedGroup.id, isSystem: true },
        create: {
          code: item.code,
          name: item.name,
          permissionGroupId: savedGroup.id,
          isSystem: true,
        },
      });
      permissionIds.push(permission.id);
    }
  }
  await prisma.role.upsert({
    where: { code: SYSTEM_ROLES.PLATFORM_ADMIN },
    update: { name: 'Platform Administrator', isSystem: true, isAssignable: false },
    create: {
      code: SYSTEM_ROLES.PLATFORM_ADMIN,
      name: 'Platform Administrator',
      isSystem: true,
      isAssignable: false,
    },
  });
  await prisma.role.upsert({
    where: { code: SYSTEM_ROLES.SCHOOL_ADMIN },
    update: { name: 'School Administrator', isSystem: true },
    create: { code: SYSTEM_ROLES.SCHOOL_ADMIN, name: 'School Administrator', isSystem: true },
  });
  return permissionIds;
}

export default seedRbac;
