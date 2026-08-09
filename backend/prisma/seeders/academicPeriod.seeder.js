export async function seedAcademicPeriods(prisma) {
  const school = await prisma.school.findFirst();
  if (!school) return;
  const year = await prisma.academicPeriod.upsert({
    where: { schoolId_code: { schoolId: school.id, code: 'AY26-27' } },
    update: {},
    create: {
      tenantId: school.tenantId,
      schoolId: school.id,
      name: '2026–2027 Academic Year',
      code: 'AY26-27',
      type: 'YEAR',
      status: 'ACTIVE',
      startsAt: new Date('2026-09-01'),
      endsAt: new Date('2027-06-30'),
    },
  });
  await prisma.academicPeriod.upsert({
    where: { schoolId_code: { schoolId: school.id, code: 'T1-26' } },
    update: {},
    create: {
      tenantId: school.tenantId,
      schoolId: school.id,
      parentId: year.id,
      name: 'Term 1',
      code: 'T1-26',
      type: 'TERM',
      status: 'ACTIVE',
      startsAt: new Date('2026-09-01'),
      endsAt: new Date('2026-12-18'),
    },
  });
}
