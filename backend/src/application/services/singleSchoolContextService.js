import prisma from '../../infrastructure/orm/prismaClient.js';
import AppError from '../../shared/errors/AppError.js';

let cachedSchool = null;

const configurationError = (message, details) =>
  new AppError(message, {
    statusCode: 503,
    code: 'SINGLE_SCHOOL_NOT_CONFIGURED',
    details,
  });

export async function resolveSingleSchool({ refresh = false, tenantId } = {}) {
  if (!refresh && cachedSchool && (!tenantId || cachedSchool.tenantId === tenantId)) {
    return cachedSchool;
  }

  const configuredId = process.env.SINGLE_SCHOOL_ID?.trim();
  const where = tenantId ? { tenantId } : configuredId ? { id: configuredId } : {};
  const schools = await prisma.school.findMany({
    where,
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
    take: tenantId || configuredId ? 1 : 2,
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
  if (!tenantId && !configuredId && schools.length !== 1) {
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
