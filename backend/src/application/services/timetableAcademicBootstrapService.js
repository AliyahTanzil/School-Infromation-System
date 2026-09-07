import prisma from '../../infrastructure/orm/prismaClient.js';

export const science3aPlan = Object.freeze({
  academicYear: {
    name: '2026/27',
    startsOn: new Date('2026-09-01T00:00:00.000Z'),
    endsOn: new Date('2027-08-31T00:00:00.000Z'),
  },
  term: {
    name: 'First Term',
    startsOn: new Date('2026-09-01T00:00:00.000Z'),
    endsOn: new Date('2026-12-31T00:00:00.000Z'),
  },
  gradeLevel: { name: 'Senior Secondary School 3', code: 'SSS3' },
  class: { name: 'SSS Science 3A', code: 'SSS-SCI-3A', section: 'Science 3A', capacity: 40 },
  subjects: [
    ['MAT', 'Mathematics'],
    ['ENG', 'English'],
    ['PHY', 'Physics'],
    ['CHE', 'Chemistry'],
    ['BIO', 'Biology'],
    ['GEO', 'Geography'],
    ['AGR', 'Agricultural Science'],
    ['ICT', 'ICT'],
    ['CVE', 'Civic Education'],
  ],
});

export async function ensureScience3aAcademicFoundation({ schoolId }, db = prisma) {
  return db.$transaction(
    async (tx) => {
      const school = await tx.school.findUnique({
        where: { id: schoolId },
        select: { id: true, tenantId: true, name: true },
      });
      if (!school) throw new Error(`Configured school ${schoolId} was not found`);

      const year = await tx.academicYear.upsert({
        where: {
          tenantId_name: { tenantId: school.tenantId, name: science3aPlan.academicYear.name },
        },
        create: { tenantId: school.tenantId, ...science3aPlan.academicYear, isCurrent: true },
        update: {},
      });
      const term = await tx.academicTerm.upsert({
        where: { academicYearId_name: { academicYearId: year.id, name: science3aPlan.term.name } },
        create: { academicYearId: year.id, ...science3aPlan.term },
        update: {},
      });
      const gradeLevel = await tx.gradeLevel.upsert({
        where: {
          tenantId_schoolId_code: {
            tenantId: school.tenantId,
            schoolId: school.id,
            code: science3aPlan.gradeLevel.code,
          },
        },
        create: { tenantId: school.tenantId, schoolId: school.id, ...science3aPlan.gradeLevel },
        update: {},
      });
      const klass = await tx.class.upsert({
        where: {
          tenantId_schoolId_academicYearId_code: {
            tenantId: school.tenantId,
            schoolId: school.id,
            academicYearId: year.id,
            code: science3aPlan.class.code,
          },
        },
        create: {
          tenantId: school.tenantId,
          schoolId: school.id,
          academicYearId: year.id,
          gradeLevelId: gradeLevel.id,
          ...science3aPlan.class,
          status: 'PLANNED',
        },
        update: {},
      });
      const subjects = [];
      for (const [code, name] of science3aPlan.subjects) {
        const subject = await tx.subject.upsert({
          where: {
            tenantId_schoolId_code: { tenantId: school.tenantId, schoolId: school.id, code },
          },
          create: { tenantId: school.tenantId, schoolId: school.id, code, name },
          update: {},
        });
        await tx.classSubject.upsert({
          where: { classId_subjectId: { classId: klass.id, subjectId: subject.id } },
          create: { classId: klass.id, subjectId: subject.id },
          update: {},
        });
        subjects.push(subject);
      }

      return { school, academicYear: year, term, gradeLevel, class: klass, subjects };
    },
    { isolationLevel: 'Serializable', timeout: 30_000 }
  );
}

export default { ensureScience3aAcademicFoundation, science3aPlan };
