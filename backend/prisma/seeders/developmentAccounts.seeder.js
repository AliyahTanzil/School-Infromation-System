import { PERMISSION_CATALOG, PERMISSIONS } from '../../src/shared/authorization/permissionCodes.js';
import passwordService from '../../src/infrastructure/hash/passwordService.js';

const DEFAULT_PASSWORD = 'ChangeMe!2026';

const ACCOUNT_DEFINITIONS = [
  {
    key: 'schoolAdmin',
    roleCode: 'SCHOOL_ADMIN',
    accountType: 'TENANT_ADMIN',
    firstName: 'Development',
    lastName: 'Administrator',
    defaultEmail: 'school-admin@example.test',
    emailVariable: 'SAIS_DEV_ADMIN_EMAIL',
    passwordVariable: 'SAIS_DEV_ADMIN_PASSWORD',
  },
  {
    key: 'teacher',
    roleCode: 'TEACHER',
    accountType: 'TEACHER',
    firstName: 'Development',
    lastName: 'Teacher',
    defaultEmail: 'teacher@example.test',
    emailVariable: 'SAIS_DEV_TEACHER_EMAIL',
    passwordVariable: 'SAIS_DEV_TEACHER_PASSWORD',
  },
  {
    key: 'student',
    roleCode: 'STUDENT',
    accountType: 'STUDENT',
    firstName: 'Development',
    lastName: 'Student',
    defaultEmail: 'student@example.test',
    emailVariable: 'SAIS_DEV_STUDENT_EMAIL',
    passwordVariable: 'SAIS_DEV_STUDENT_PASSWORD',
  },
  {
    key: 'parent',
    roleCode: 'PARENT',
    accountType: 'PARENT',
    firstName: 'Development',
    lastName: 'Parent',
    defaultEmail: 'parent@example.test',
    emailVariable: 'SAIS_DEV_PARENT_EMAIL',
    passwordVariable: 'SAIS_DEV_PARENT_PASSWORD',
  },
];

const ROLE_PERMISSIONS = {
  SCHOOL_ADMIN: Object.values(PERMISSIONS),
  TEACHER: [
    PERMISSIONS.STUDENTS_READ,
    PERMISSIONS.TEACHERS_READ,
    PERMISSIONS.CLASSES_READ,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.ATTENDANCE_CREATE,
    PERMISSIONS.ATTENDANCE_MARK,
  ],
  STUDENT: [PERMISSIONS.CLASSES_READ, PERMISSIONS.ATTENDANCE_READ],
  PARENT: [PERMISSIONS.STUDENTS_READ, PERMISSIONS.CLASSES_READ, PERMISSIONS.ATTENDANCE_READ],
};

function configuredAccount(definition) {
  return {
    ...definition,
    email: (process.env[definition.emailVariable] || definition.defaultEmail).trim().toLowerCase(),
    password:
      process.env[definition.passwordVariable] ||
      process.env.SAIS_DEV_ACCOUNT_PASSWORD ||
      DEFAULT_PASSWORD,
  };
}

async function upsertSchoolContext(tx) {
  const tenant = await tx.tenant.upsert({
    where: { code: 'SAIS-DEVELOPMENT' },
    update: { name: 'SAIS Development School', status: 'ACTIVE', deletedAt: null },
    create: {
      code: 'SAIS-DEVELOPMENT',
      name: 'SAIS Development School',
      status: 'ACTIVE',
      timezone: 'UTC',
      currency: 'SLE',
    },
  });

  const school = await tx.school.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'MAIN' } },
    update: { name: 'SAIS Development School' },
    create: {
      tenantId: tenant.id,
      code: 'MAIN',
      name: 'SAIS Development School',
      country: 'Sierra Leone',
    },
  });

  return { tenant, school };
}

async function upsertPermissionsAndRoles(tx, tenantId) {
  const permissions = new Map();
  for (const group of PERMISSION_CATALOG) {
    for (const item of group.permissions) {
      const permission = await tx.permission.upsert({
        where: { key: item.code },
        update: { description: item.name },
        create: { key: item.code, description: item.name },
      });
      permissions.set(item.code, permission.id);
    }
  }

  const roles = new Map();
  for (const definition of ACCOUNT_DEFINITIONS) {
    const role = await tx.role.upsert({
      where: { tenantId_code: { tenantId, code: definition.roleCode } },
      update: { name: definition.roleCode.replaceAll('_', ' '), deletedAt: null },
      create: {
        tenantId,
        code: definition.roleCode,
        name: definition.roleCode.replaceAll('_', ' '),
      },
    });
    roles.set(definition.roleCode, role);

    for (const permissionKey of ROLE_PERMISSIONS[definition.roleCode]) {
      const permissionId = permissions.get(permissionKey);
      if (!permissionId) throw new Error(`Unknown development permission: ${permissionKey}`);
      await tx.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }

  return roles;
}

async function upsertAccount(tx, tenantId, role, definition) {
  const passwordHash = await passwordService.hashPassword(definition.password);
  const user = await tx.user.upsert({
    where: { email: definition.email },
    update: {
      tenantId,
      firstName: definition.firstName,
      lastName: definition.lastName,
      passwordHash,
      accountType: definition.accountType,
      platformRole: null,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      deletedAt: null,
      failedLoginCount: 0,
      lockedUntil: null,
    },
    create: {
      tenantId,
      email: definition.email,
      firstName: definition.firstName,
      lastName: definition.lastName,
      passwordHash,
      accountType: definition.accountType,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });

  await tx.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: { revokedAt: null, expiresAt: null },
    create: { userId: user.id, roleId: role.id },
  });
  await tx.userProfile.upsert({
    where: { userId: user.id },
    update: { firstName: definition.firstName, lastName: definition.lastName },
    create: { userId: user.id, firstName: definition.firstName, lastName: definition.lastName },
  });

  return user;
}

export async function seedDevelopmentAccounts(prisma) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Development account seeding is disabled when NODE_ENV=production');
  }

  const definitions = ACCOUNT_DEFINITIONS.map(configuredAccount);
  const passwordHashesAreValid = definitions.every(({ password }) => typeof password === 'string');
  if (!passwordHashesAreValid) throw new Error('Development account passwords must be strings');

  return prisma.$transaction(
    async (tx) => {
      const { tenant, school } = await upsertSchoolContext(tx);
      const roles = await upsertPermissionsAndRoles(tx, tenant.id);
      const users = new Map();

      for (const definition of definitions) {
        const user = await upsertAccount(tx, tenant.id, roles.get(definition.roleCode), definition);
        users.set(definition.key, user);
      }

      const teacherUser = users.get('teacher');
      const teacher = await tx.teacher.upsert({
        where: {
          tenantId_employeeNumber: { tenantId: tenant.id, employeeNumber: 'DEV-TEACHER-001' },
        },
        update: { schoolId: school.id, userId: teacherUser.id, status: 'ACTIVE', deletedAt: null },
        create: {
          tenantId: tenant.id,
          schoolId: school.id,
          userId: teacherUser.id,
          employeeNumber: 'DEV-TEACHER-001',
          status: 'ACTIVE',
        },
      });
      await tx.teacherProfile.upsert({
        where: { teacherId: teacher.id },
        update: {
          firstName: teacherUser.firstName,
          lastName: teacherUser.lastName,
          email: teacherUser.email,
        },
        create: {
          teacherId: teacher.id,
          firstName: teacherUser.firstName,
          lastName: teacherUser.lastName,
          email: teacherUser.email,
        },
      });
      await tx.teacherEmployment.upsert({
        where: { teacherId: teacher.id },
        update: { jobTitle: 'Teacher', employmentType: 'FULL_TIME', endDate: null },
        create: {
          teacherId: teacher.id,
          jobTitle: 'Teacher',
          employmentType: 'FULL_TIME',
          startDate: new Date('2026-01-01T00:00:00.000Z'),
        },
      });

      const studentUser = users.get('student');
      const student = await tx.student.upsert({
        where: {
          tenantId_admissionNumber: { tenantId: tenant.id, admissionNumber: 'DEV-STUDENT-001' },
        },
        update: {
          firstName: studentUser.firstName,
          lastName: studentUser.lastName,
          email: studentUser.email,
        },
        create: {
          id: studentUser.id,
          tenantId: tenant.id,
          admissionNumber: 'DEV-STUDENT-001',
          firstName: studentUser.firstName,
          lastName: studentUser.lastName,
          email: studentUser.email,
        },
      });
      if (student.id !== studentUser.id) {
        throw new Error('The development student record must share the authenticated user ID');
      }

      const parentUser = users.get('parent');
      const parent = await tx.parent.upsert({
        where: { userId: parentUser.id },
        update: { tenantId: tenant.id, schoolId: school.id, deletedAt: null },
        create: { tenantId: tenant.id, schoolId: school.id, userId: parentUser.id },
      });
      await tx.parentProfile.upsert({
        where: { parentId: parent.id },
        update: { firstName: parentUser.firstName, lastName: parentUser.lastName },
        create: {
          parentId: parent.id,
          firstName: parentUser.firstName,
          lastName: parentUser.lastName,
        },
      });
      await tx.parentStudentRelationship.upsert({
        where: { parentId_studentId: { parentId: parent.id, studentId: student.id } },
        update: { relationship: 'Guardian', status: 'ACTIVE', revokedAt: null },
        create: {
          parentId: parent.id,
          studentId: student.id,
          relationship: 'Guardian',
          status: 'ACTIVE',
        },
      });

      return {
        tenantId: tenant.id,
        schoolId: school.id,
        accounts: definitions.map(({ key, roleCode, email }) => ({ key, roleCode, email })),
      };
    },
    { maxWait: 10_000, timeout: 120_000 }
  );
}

export default seedDevelopmentAccounts;
