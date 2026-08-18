import { prisma } from '../src/foundation/prisma.js';

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  const [tenants, users, students, enrollments, orphanUsers, orphanStudents] = await Promise.all([
    prisma.tenant.count(),
    prisma.user.count(),
    prisma.student.count(),
    prisma.enrollment.count(),
    prisma.user.count({ where: { tenantId: null, platformRole: null } }),
    Promise.resolve(0),
  ]);
  const tenantStudentCounts = await prisma.student.groupBy({
    by: ['tenantId'],
    _count: { _all: true },
  });
  const tenantIds = new Set(
    (await prisma.tenant.findMany({ select: { id: true } })).map((tenant) => tenant.id)
  );
  const invalidTenantGroups = tenantStudentCounts.filter(
    (group) => !tenantIds.has(group.tenantId)
  ).length;
  const result = {
    tenants,
    users,
    students,
    enrollments,
    orphanUsers,
    orphanStudents,
    invalidTenantGroups,
    valid: orphanUsers === 0 && orphanStudents === 0 && invalidTenantGroups === 0,
  };
  console.info(JSON.stringify(result));
  if (!result.valid) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(
      '[sais-backend] database verification failed',
      error instanceof Error ? error.message : 'unknown error'
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
