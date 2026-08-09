import prisma from '../../src/infrastructure/orm/prismaClient.js';

export async function seedParents() {
  const user = await prisma.user.findFirst({ where: { email: 'parent@example.com' } });
  const school = await prisma.school.findFirst({ where: { deletedAt: null } });
  const student = await prisma.student.findFirst({
    where: { schoolId: school?.id, deletedAt: null },
  });
  if (!user || !school || !student) return;
  const parent = await prisma.parent.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      tenantId: school.tenantId,
      schoolId: school.id,
      userId: user.id,
      profile: { create: { firstName: 'Demo', lastName: 'Parent' } },
      preferences: { create: {} },
      notifications: { create: {} },
    },
  });
  await prisma.parentStudentRelationship.upsert({
    where: { parentId_studentId: { parentId: parent.id, studentId: student.id } },
    update: { status: 'ACTIVE', verifiedAt: new Date() },
    create: {
      parentId: parent.id,
      studentId: student.id,
      relationship: 'Guardian',
      status: 'ACTIVE',
      verifiedAt: new Date(),
    },
  });
}
