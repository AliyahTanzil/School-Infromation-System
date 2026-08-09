export async function seedSchools(prisma) {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-school-network' },
    update: { name: 'Demo School Network', status: 'ACTIVE', deletedAt: null },
    create: { name: 'Demo School Network', slug: 'demo-school-network' },
  });
  const school = await prisma.school.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'demo-academy' } },
    update: {
      name: 'Demo Academy',
      normalizedName: 'demo academy',
      status: 'ACTIVE',
      deletedAt: null,
    },
    create: {
      tenantId: tenant.id,
      name: 'Demo Academy',
      slug: 'demo-academy',
      normalizedName: 'demo academy',
    },
  });
  await prisma.schoolProfile.upsert({
    where: { schoolId: school.id },
    update: {},
    create: { schoolId: school.id },
  });
  await prisma.schoolSetting.upsert({
    where: { schoolId: school.id },
    update: {},
    create: { schoolId: school.id, settings: {} },
  });
  await prisma.schoolConfiguration.upsert({
    where: { schoolId: school.id },
    update: {},
    create: { schoolId: school.id, featureFlags: {} },
  });
}

export default seedSchools;
