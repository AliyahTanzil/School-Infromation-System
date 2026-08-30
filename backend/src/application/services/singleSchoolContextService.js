import prisma from '../../infrastructure/orm/prismaClient.js';
import AppError from '../../shared/errors/AppError.js';

let cachedSchool = null;

const configurationError = (message, details) =>
  new AppError(message, {
    statusCode: 503,
    code: 'SINGLE_SCHOOL_NOT_CONFIGURED',
    details,
  });

export async function resolveSingleSchool({ refresh = false } = {}) {
  if (!refresh && cachedSchool) return cachedSchool;

  const configuredId = process.env.SINGLE_SCHOOL_ID?.trim();
  const schools = await prisma.school.findMany({
    where: configuredId ? { id: configuredId } : {},
    select: {
      id: true,
      tenantId: true,
      name: true,
      code: true,
      address: true,
      city: true,
      country: true,
      phone: true,
      email: true,
      website: true,
      motto: true,
      logoUrl: true,
      principalName: true,
      settings: true,
      isConfigured: true,
    },
    take: configuredId ? 1 : 2,
    orderBy: { createdAt: 'asc' },
  });

  if (schools.length === 0) {
    throw configurationError(
      configuredId
        ? 'The configured school does not exist'
        : 'Create the school record before starting the application',
      configuredId ? { configuredSchoolId: configuredId } : undefined
    );
  }
  if (!configuredId && schools.length !== 1) {
    throw configurationError(
      'SINGLE_SCHOOL_ID is required while the database contains more than one school',
      { discoveredSchools: schools.length }
    );
  }

  cachedSchool = schools[0];
  return cachedSchool;
}

export function clearSingleSchoolCache() {
  cachedSchool = null;
}

export default { resolveSingleSchool, clearSingleSchoolCache };
