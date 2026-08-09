export async function seedTeachers(prisma) {
  const school = await prisma.school.findFirst();
  if (!school) return;
  const user = await prisma.user.findFirst({ where: { tenantId: school.tenantId } });
  if (!user) return;
  await prisma.teacher.upsert({
    where: { schoolId_employeeNumber: { schoolId: school.id, employeeNumber: 'DEMO-TCH-001' } },
    update: {},
    create: {
      tenantId: school.tenantId,
      schoolId: school.id,
      userId: user.id,
      employeeNumber: 'DEMO-TCH-001',
      status: 'ACTIVE',
      profile: {
        create: { firstName: 'Demo', lastName: 'Teacher', email: 'teacher@example.test' },
      },
      employment: {
        create: { jobTitle: 'Class Teacher', employmentType: 'FULL_TIME', startDate: new Date() },
      },
      history: { create: { toStatus: 'ACTIVE', reason: 'Seed fixture', actorId: user.id } },
    },
  });
}
