import prisma from '../src/infrastructure/orm/prismaClient.js';
import passwordService from '../src/infrastructure/hash/passwordService.js';

async function main() {
  const email = process.env.SAIS_OWNER_EMAIL?.trim().toLowerCase();
  const password = process.env.SAIS_OWNER_PASSWORD;
  const firstName = process.env.SAIS_OWNER_FIRST_NAME?.trim();
  const lastName = process.env.SAIS_OWNER_LAST_NAME?.trim();

  if (!email || !password || !firstName || !lastName) {
    throw new Error(
      'Missing SAIS_OWNER_EMAIL, SAIS_OWNER_PASSWORD, SAIS_OWNER_FIRST_NAME, or SAIS_OWNER_LAST_NAME'
    );
  }

  const existingOwner = await prisma.user.findFirst({
    where: {
      accountType: 'APPLICATION_MANAGER',
      deletedAt: null,
    },
  });

  if (existingOwner) {
    throw new Error(
      `Application Manager already exists: ${existingOwner.email}. Bootstrap aborted.`
    );
  }

  const existingEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (existingEmail) {
    throw new Error(`A user with email ${email} already exists.`);
  }

  const passwordHash = await passwordService.hashPassword(password);

  const owner = await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      passwordHash,

      accountType: 'APPLICATION_MANAGER',
      platformRole: 'OWNER',

      status: 'ACTIVE',
      emailVerifiedAt: new Date(),

      tenantId: null,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      accountType: true,
      platformRole: true,
      status: true,
      emailVerifiedAt: true,
      tenantId: true,
    },
  });

  console.log('SAIS Application Owner created successfully.');
  console.log({
    id: owner.id,
    email: owner.email,
    accountType: owner.accountType,
    platformRole: owner.platformRole,
    status: owner.status,
    emailVerified: Boolean(owner.emailVerifiedAt),
    tenantId: owner.tenantId,
  });
}

main()
  .catch((error) => {
    console.error('[SAIS] Owner bootstrap failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });