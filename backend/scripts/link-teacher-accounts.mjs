import prisma from '../src/infrastructure/orm/prismaClient.js';
import { resolveSingleSchool } from '../src/application/services/singleSchoolContextService.js';
import { ensureTeacherAccount } from '../src/application/services/teacherAccountService.js';

const apply = process.argv.includes('--apply');
try {
  const school = await resolveSingleSchool({ refresh: true });
  const users = await prisma.user.findMany({
    where: { tenantId: school.tenantId, accountType: 'TEACHER', status: 'ACTIVE', deletedAt: null },
    select: { id: true, teacher: { select: { id: true } } },
  });
  const missing = users.filter((user) => !user.teacher);
  console.log(
    JSON.stringify({
      mode: apply ? 'apply' : 'preview',
      activeAccounts: users.length,
      missingProfiles: missing.length,
    })
  );
  if (apply) {
    const counts = { created: 0, linked: 0, existing: 0 };
    for (const { id } of missing) {
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findFirst({
          where: {
            id,
            tenantId: school.tenantId,
            accountType: 'TEACHER',
            status: 'ACTIVE',
            deletedAt: null,
          },
        });
        return ensureTeacherAccount(tx, user, school.id);
      });
      counts[result.action] += 1;
    }
    console.log(JSON.stringify(counts));
  }
} catch (error) {
  // Never print raw database errors, user records, passwords, or connection strings.
  console.error(
    'Teacher reconciliation failed:',
    /^[A-Z0-9_]+$/.test(error.code ?? '') ? error.code : error.name
  );
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
