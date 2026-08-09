import bcrypt from 'bcryptjs';

const FALLBACK_EMAIL = 'platform-admin@example.test';
const FALLBACK_PASSWORD = 'ChangeMe!2026';

function getCredentials() {
  const configured = process.env.TEST_ACCOUNT_EMAIL && process.env.TEST_ACCOUNT_PASSWORD;
  if (configured)
    return {
      email: process.env.TEST_ACCOUNT_EMAIL.toLowerCase(),
      password: process.env.TEST_ACCOUNT_PASSWORD,
    };
  if (process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production') return null;
  return { email: FALLBACK_EMAIL, password: FALLBACK_PASSWORD };
}

export async function seedTestAccount(prisma) {
  const credentials = getCredentials();
  if (!credentials) return;
  const role = await prisma.role.findUnique({ where: { code: 'PLATFORM_ADMIN' } });
  if (!role) throw new Error('PLATFORM_ADMIN role must be seeded before the test account');
  const passwordHash = await bcrypt.hash(credentials.password, 12);
  const user = await prisma.user.upsert({
    where: { email: credentials.email },
    update: { passwordHash, status: 'ACTIVE', emailVerifiedAt: new Date(), deletedAt: null },
    create: {
      email: credentials.email,
      passwordHash,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId_scopeKey: { userId: user.id, roleId: role.id, scopeKey: 'global' } },
    update: { revokedAt: null, expiresAt: null },
    create: { userId: user.id, roleId: role.id, scopeKey: 'global' },
  });
  console.info(`Test account ready: ${credentials.email}`);
}

export default seedTestAccount;
