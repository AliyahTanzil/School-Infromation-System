import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Check = { name: string; count: number; detail?: string };

async function main() {
  const checks: Check[] = [];

  const orphanedRoles = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "Role" r
    LEFT JOIN "Tenant" t ON t.id = r."tenantId"
    WHERE t.id IS NULL
  `;
  checks.push({ name: 'orphaned roles', count: Number(orphanedRoles[0]?.count ?? 0) });

  const orphanedUsers = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "User" u
    WHERE u."tenantId" IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM "Tenant" t WHERE t.id = u."tenantId")
  `;
  checks.push({ name: 'orphaned tenant users', count: Number(orphanedUsers[0]?.count ?? 0) });

  const duplicatePeriods = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count FROM (
      SELECT "tenantId", "name", COUNT(*)
      FROM "AcademicYear"
      GROUP BY "tenantId", "name"
      HAVING COUNT(*) > 1
    ) duplicates
  `;
  checks.push({
    name: 'duplicate academic periods',
    count: Number(duplicatePeriods[0]?.count ?? 0),
  });

  const crossTenantRoles = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "UserRole" ur
    JOIN "User" u ON u.id = ur."userId"
    JOIN "Role" r ON r.id = ur."roleId"
    WHERE u."tenantId" IS DISTINCT FROM r."tenantId"
  `;
  checks.push({
    name: 'cross-tenant role assignments',
    count: Number(crossTenantRoles[0]?.count ?? 0),
  });

  const failures = checks.filter((check) => check.count > 0);
  console.log(JSON.stringify({ ok: failures.length === 0, checks }, null, 2));
  if (failures.length > 0) process.exitCode = 1;
}

main()
  .catch(() => {
    console.error(JSON.stringify({ ok: false, error: 'database integrity check failed' }));
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
