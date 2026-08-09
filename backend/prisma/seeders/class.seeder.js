export async function seedClasses(prisma) {
  const school = await prisma.school.findFirst();
  const grade = await prisma.gradeLevel.findFirst({ where: { schoolId: school?.id } });
  if (!school || !grade) return;
  await prisma.class.upsert({
    where: {
      schoolId_code_academicYear: {
        schoolId: school.id,
        code: 'G8-CEDAR',
        academicYear: '2026/27',
      },
    },
    update: {},
    create: {
      tenantId: school.tenantId,
      schoolId: school.id,
      gradeLevelId: grade.id,
      name: 'Grade 8 · Cedar',
      code: 'G8-CEDAR',
      academicYear: '2026/27',
      capacity: 32,
      status: 'ACTIVE',
    },
  });
}
