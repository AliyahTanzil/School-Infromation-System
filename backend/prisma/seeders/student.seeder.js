import prisma from '../../src/infrastructure/orm/prismaClient.js';

export async function seedStudents() {
  const school = await prisma.school.findFirst({ where: { deletedAt: null } });
  if (!school) return;
  const existing = await prisma.student.findFirst({
    where: { schoolId: school.id, admissionNumber: 'DEMO-001' },
  });
  if (existing) return;
  await prisma.student.create({
    data: {
      tenantId: school.tenantId,
      schoolId: school.id,
      admissionNumber: 'DEMO-001',
      status: 'ACTIVE',
      profile: {
        create: { firstName: 'Demo', lastName: 'Student', dateOfBirth: new Date('2012-01-15') },
      },
      admission: { create: { entryGrade: 'Grade 7', source: 'seed' } },
    },
  });
}
