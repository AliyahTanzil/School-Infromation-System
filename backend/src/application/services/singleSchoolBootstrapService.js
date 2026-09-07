import prisma from '../../infrastructure/orm/prismaClient.js';

const configuredValue = (name) => process.env[name]?.trim();

export async function ensureConfiguredSingleSchool(db = prisma) {
  const schoolId = configuredValue('SINGLE_SCHOOL_ID');
  const schoolName = configuredValue('SINGLE_SCHOOL_NAME');

  if (!schoolId && !schoolName) return null;
  if (!schoolId || !schoolName) {
    throw new Error('SINGLE_SCHOOL_ID and SINGLE_SCHOOL_NAME must be configured together');
  }

  return db.$transaction(
    async (tx) => {
      const existing = await tx.school.findUnique({ where: { id: schoolId } });
      if (existing) {
        if (existing.name !== schoolName) {
          throw new Error(
            `SINGLE_SCHOOL_NAME does not match configured school ${schoolId}: ${existing.name}`
          );
        }
        return { school: existing, created: false };
      }

      const otherSchools = await tx.school.count();
      if (otherSchools) {
        throw new Error(
          `SINGLE_SCHOOL_ID ${schoolId} was not found, but other school records exist; automatic bootstrap refused`
        );
      }

      const code = (configuredValue('SINGLE_SCHOOL_CODE') || 'AIIA').toUpperCase();
      const tenant = await tx.tenant.upsert({
        where: { code },
        create: {
          name: schoolName,
          code,
          status: 'ACTIVE',
          timezone: configuredValue('SINGLE_SCHOOL_TIMEZONE') || 'UTC',
          currency: configuredValue('SINGLE_SCHOOL_CURRENCY') || 'USD',
        },
        update: {},
      });
      const school = await tx.school.create({
        data: {
          id: schoolId,
          tenantId: tenant.id,
          name: schoolName,
          code,
        },
      });

      return { school, created: true };
    },
    { isolationLevel: 'Serializable' }
  );
}

export default { ensureConfiguredSingleSchool };
