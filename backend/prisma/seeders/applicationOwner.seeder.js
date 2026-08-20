import passwordService from '../../src/infrastructure/hash/passwordService.js';

function getOwnerCredentials() {
  const email = process.env.SAIS_OWNER_EMAIL?.trim().toLowerCase();
  const password = process.env.SAIS_OWNER_PASSWORD;

  if (!email && !password) return null;
  if (!email || !password) {
    throw new Error(
      'SAIS_OWNER_EMAIL and SAIS_OWNER_PASSWORD are required together for owner seeding'
    );
  }

  return {
    email,
    password,
    firstName: process.env.SAIS_OWNER_FIRST_NAME?.trim() || 'Application',
    lastName: process.env.SAIS_OWNER_LAST_NAME?.trim() || 'Owner',
  };
}

export async function seedApplicationOwner(prisma) {
  const credentials = getOwnerCredentials();
  if (!credentials) return;

  const passwordHash = await passwordService.hashPassword(credentials.password);
  await prisma.user.upsert({
    where: { email: credentials.email },
    update: {
      firstName: credentials.firstName,
      lastName: credentials.lastName,
      passwordHash,
      accountType: 'APPLICATION_MANAGER',
      platformRole: 'OWNER',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      tenantId: null,
      deletedAt: null,
      failedLoginCount: 0,
      lockedUntil: null,
    },
    create: {
      email: credentials.email,
      firstName: credentials.firstName,
      lastName: credentials.lastName,
      passwordHash,
      accountType: 'APPLICATION_MANAGER',
      platformRole: 'OWNER',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      tenantId: null,
    },
  });

  console.info(`[seed] Application Owner provisioned: ${credentials.email}`);
}

export default seedApplicationOwner;
