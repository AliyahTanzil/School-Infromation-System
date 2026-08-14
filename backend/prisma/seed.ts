import { prisma } from '../src/foundation/prisma.js';

const ids = {
  platformOwner: '00000000-0000-4000-8000-000000000001',
  tenantA: '00000000-0000-4000-8000-000000000101',
  tenantB: '00000000-0000-4000-8000-000000000102',
  schoolA: '00000000-0000-4000-8000-000000000201',
  schoolB: '00000000-0000-4000-8000-000000000202',
  yearA: '00000000-0000-4000-8000-000000000301',
  yearB: '00000000-0000-4000-8000-000000000302',
  studentA: '00000000-0000-4000-8000-000000000401',
  studentB: '00000000-0000-4000-8000-000000000402',
  studentC: '00000000-0000-4000-8000-000000000403',
  guardianA: '00000000-0000-4000-8000-000000000501',
  guardianB: '00000000-0000-4000-8000-000000000502',
  staffA: '00000000-0000-4000-8000-000000000601',
  staffB: '00000000-0000-4000-8000-000000000602',
  roleA: '00000000-0000-4000-8000-000000000701',
  roleB: '00000000-0000-4000-8000-000000000702',
  permissionRead: '00000000-0000-4000-8000-000000000801',
  permissionManage: '00000000-0000-4000-8000-000000000802',
  termA: '00000000-0000-4000-8000-000000000901',
  termB: '00000000-0000-4000-8000-000000000902',
};

const date = (value: string) => new Date(`${value}T00:00:00.000Z`);

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production' || process.env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error(
      'Development seed requires NODE_ENV other than production and ALLOW_DEMO_SEED=true'
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.databaseSentinel.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
    await tx.permission.upsert({
      where: { id: ids.permissionRead },
      update: {},
      create: { id: ids.permissionRead, key: 'students:read', description: 'Read student records' },
    });
    await tx.permission.upsert({
      where: { id: ids.permissionManage },
      update: {},
      create: {
        id: ids.permissionManage,
        key: 'students:manage',
        description: 'Manage student records',
      },
    });

    await tx.tenant.upsert({
      where: { id: ids.tenantA },
      update: { status: 'ACTIVE' },
      create: {
        id: ids.tenantA,
        name: 'Demo Academy Alpha',
        code: 'DEMO-ALPHA',
        status: 'ACTIVE',
        timezone: 'UTC',
        currency: 'USD',
      },
    });
    await tx.tenant.upsert({
      where: { id: ids.tenantB },
      update: { status: 'ACTIVE' },
      create: {
        id: ids.tenantB,
        name: 'Demo Academy Beta',
        code: 'DEMO-BETA',
        status: 'ACTIVE',
        timezone: 'UTC',
        currency: 'USD',
      },
    });

    await tx.user.upsert({
      where: { id: ids.platformOwner },
      update: { status: 'ACTIVE', platformRole: 'OWNER' },
      create: {
        id: ids.platformOwner,
        email: 'owner@demo.sais.local',
        firstName: 'Platform',
        lastName: 'Owner',
        status: 'ACTIVE',
        platformRole: 'OWNER',
      },
    });
    const tenantUsers = [
      {
        id: ids.staffA,
        email: 'admin.alpha@demo.sais.local',
        firstName: 'Alpha',
        lastName: 'Admin',
        tenantId: ids.tenantA,
      },
      {
        id: ids.staffB,
        email: 'admin.beta@demo.sais.local',
        firstName: 'Beta',
        lastName: 'Admin',
        tenantId: ids.tenantB,
      },
    ];
    for (const user of tenantUsers)
      await tx.user.upsert({
        where: { id: user.id },
        update: { tenantId: user.tenantId, status: 'ACTIVE' },
        create: { ...user, status: 'ACTIVE' },
      });

    for (const [tenantId, schoolId, schoolName] of [
      [ids.tenantA, ids.schoolA, 'Alpha Senior School'],
      [ids.tenantB, ids.schoolB, 'Beta Senior School'],
    ] as const) {
      await tx.school.upsert({
        where: { id: schoolId },
        update: { name: schoolName },
        create: {
          id: schoolId,
          tenantId,
          name: schoolName,
          code: tenantId === ids.tenantA ? 'ALPHA' : 'BETA',
          city: 'Demo City',
          country: 'Demo Country',
        },
      });
    }

    for (const [tenantId, yearId, termId, name] of [
      [ids.tenantA, ids.yearA, ids.termA, '2026-2027'],
      [ids.tenantB, ids.yearB, ids.termB, '2026-2027'],
    ] as const) {
      await tx.academicYear.upsert({
        where: { id: yearId },
        update: { isCurrent: true },
        create: {
          id: yearId,
          tenantId,
          name,
          startsOn: date('2026-09-01'),
          endsOn: date('2027-06-30'),
          isCurrent: true,
        },
      });
      await tx.academicTerm.upsert({
        where: { id: termId },
        update: {},
        create: {
          id: termId,
          academicYearId: yearId,
          name: 'Term 1',
          startsOn: date('2026-09-01'),
          endsOn: date('2026-12-18'),
        },
      });
    }

    const records = [
      {
        id: ids.studentA,
        tenantId: ids.tenantA,
        admissionNumber: 'A-0001',
        firstName: 'Amina',
        lastName: 'Kone',
        gender: 'FEMALE' as const,
      },
      {
        id: ids.studentB,
        tenantId: ids.tenantA,
        admissionNumber: 'A-0002',
        firstName: 'Samuel',
        lastName: 'Diallo',
        gender: 'MALE' as const,
      },
      {
        id: ids.studentC,
        tenantId: ids.tenantB,
        admissionNumber: 'B-0001',
        firstName: 'Mariam',
        lastName: 'Traore',
        gender: 'FEMALE' as const,
      },
    ];
    for (const student of records)
      await tx.student.upsert({ where: { id: student.id }, update: student, create: student });

    await tx.guardian.upsert({
      where: { id: ids.guardianA },
      update: {},
      create: {
        id: ids.guardianA,
        tenantId: ids.tenantA,
        firstName: 'Fatou',
        lastName: 'Kone',
        email: 'fatou.kone@demo.sais.local',
      },
    });
    await tx.guardian.upsert({
      where: { id: ids.guardianB },
      update: {},
      create: {
        id: ids.guardianB,
        tenantId: ids.tenantB,
        firstName: 'Ibrahim',
        lastName: 'Traore',
        email: 'ibrahim.traore@demo.sais.local',
      },
    });
    await tx.studentGuardian.upsert({
      where: { studentId_guardianId: { studentId: ids.studentA, guardianId: ids.guardianA } },
      update: { isPrimary: true },
      create: {
        studentId: ids.studentA,
        guardianId: ids.guardianA,
        relationship: 'Parent',
        isPrimary: true,
      },
    });
    await tx.studentGuardian.upsert({
      where: { studentId_guardianId: { studentId: ids.studentC, guardianId: ids.guardianB } },
      update: { isPrimary: true },
      create: {
        studentId: ids.studentC,
        guardianId: ids.guardianB,
        relationship: 'Parent',
        isPrimary: true,
      },
    });

    await tx.staff.upsert({
      where: { id: ids.staffA },
      update: { tenantId: ids.tenantA },
      create: {
        id: ids.staffA,
        tenantId: ids.tenantA,
        userId: ids.staffA,
        employeeNumber: 'ALPHA-001',
        firstName: 'Alpha',
        lastName: 'Admin',
        jobTitle: 'School Administrator',
      },
    });
    await tx.staff.upsert({
      where: { id: ids.staffB },
      update: { tenantId: ids.tenantB },
      create: {
        id: ids.staffB,
        tenantId: ids.tenantB,
        userId: ids.staffB,
        employeeNumber: 'BETA-001',
        firstName: 'Beta',
        lastName: 'Admin',
        jobTitle: 'School Administrator',
      },
    });

    for (const [id, tenantId, name] of [
      [ids.roleA, ids.tenantA, 'Administrator'],
      [ids.roleB, ids.tenantB, 'Administrator'],
    ] as const) {
      await tx.role.upsert({
        where: { id },
        update: {},
        create: { id, tenantId, name, description: 'Demo administrator role' },
      });
    }
    await tx.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: ids.roleA, permissionId: ids.permissionRead } },
      update: {},
      create: { roleId: ids.roleA, permissionId: ids.permissionRead },
    });
    await tx.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: ids.roleA, permissionId: ids.permissionManage } },
      update: {},
      create: { roleId: ids.roleA, permissionId: ids.permissionManage },
    });
    await tx.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: ids.roleB, permissionId: ids.permissionRead } },
      update: {},
      create: { roleId: ids.roleB, permissionId: ids.permissionRead },
    });

    for (const [userId, roleId] of [
      [ids.staffA, ids.roleA],
      [ids.staffB, ids.roleB],
    ] as const)
      await tx.userRole.upsert({
        where: { userId_roleId: { userId, roleId } },
        update: {},
        create: { userId, roleId },
      });
    for (const [id, tenantId, studentId, yearId, gradeLevel] of [
      [ids.studentA, ids.tenantA, ids.studentA, ids.yearA, 'Grade 7'],
      [ids.studentB, ids.tenantA, ids.studentB, ids.yearA, 'Grade 8'],
      [ids.studentC, ids.tenantB, ids.studentC, ids.yearB, 'Grade 7'],
    ] as const)
      await tx.enrollment.upsert({
        where: { id },
        update: {},
        create: { id, tenantId, studentId, academicYearId: yearId, gradeLevel, status: 'ACTIVE' },
      });

    await tx.tenantSetting.upsert({
      where: { tenantId_key: { tenantId: ids.tenantA, key: 'demo.seed.version' } },
      update: { value: 'backend-5-v1' },
      create: { tenantId: ids.tenantA, key: 'demo.seed.version', value: 'backend-5-v1' },
    });
    await tx.tenantSetting.upsert({
      where: { tenantId_key: { tenantId: ids.tenantB, key: 'demo.seed.version' } },
      update: { value: 'backend-5-v1' },
      create: { tenantId: ids.tenantB, key: 'demo.seed.version', value: 'backend-5-v1' },
    });
  });
  console.info(JSON.stringify({ seed: 'backend-5', tenants: 2, students: 3, idempotent: true }));
}

main()
  .catch((error) => {
    console.error(
      '[sais-backend] development seed failed',
      error instanceof Error ? error.message : 'unknown error'
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
