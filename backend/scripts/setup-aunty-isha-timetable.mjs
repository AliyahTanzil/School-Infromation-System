import { PrismaClient } from '@prisma/client';
import { scienceSubjects, scienceWeek } from '../../frontend/src/scienceTimetableDraft.js';
import {
  generateTimetableSlots,
  validateSubjectPeriodCapacity,
} from '../src/domain/timetableEngine.js';

const db = new PrismaClient();
const schoolName = 'Aunty Isha Internation School';
const name = 'SSS Science 3A - First Term 2026/27';
const assumptions = {
  academicYear: '2026/27',
  academicYearStarts: '2026-09-01',
  academicYearEnds: '2027-08-31',
  firstTermStarts: '2026-09-01',
  firstTermEnds: '2026-12-31',
  plannedClassCapacity: 40,
  note: 'Planning dates and capacity await school confirmation. Teachers and rooms are unassigned. Draft only.',
};
try {
  const result = await db.$transaction(
    async (tx) => {
      const unrelatedSchool = await tx.school.findFirst({
        where: { name: { not: schoolName } },
        select: { id: true },
      });
      if (unrelatedSchool)
        throw new Error(
          'Another school exists; refusing to create a second school in the single-school installation'
        );
      const tenant = await tx.tenant.upsert({
        where: { code: 'AUNTY-ISHA' },
        update: {},
        create: {
          name: schoolName,
          code: 'AUNTY-ISHA',
          status: 'ACTIVE',
          timezone: 'Africa/Lagos',
          currency: 'NGN',
        },
      });
      const school = await tx.school.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code: 'MAIN' } },
        update: {},
        create: {
          tenantId: tenant.id,
          code: 'MAIN',
          name: schoolName,
          settings: { timetablePlanningAssumptions: assumptions },
        },
      });
      const scope = { tenantId: tenant.id, schoolId: school.id };
      const existing = await tx.timetable.findFirst({ where: { ...scope, name } });
      if (existing)
        return {
          school: school.name,
          timetableId: existing.id,
          status: existing.status,
          reused: true,
        };
      const year = await tx.academicYear.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: assumptions.academicYear } },
        update: {},
        create: {
          tenantId: tenant.id,
          name: assumptions.academicYear,
          startsOn: new Date(assumptions.academicYearStarts),
          endsOn: new Date(assumptions.academicYearEnds),
          isCurrent: true,
        },
      });
      const term = await tx.academicTerm.upsert({
        where: { academicYearId_name: { academicYearId: year.id, name: 'First Term' } },
        update: {},
        create: {
          academicYearId: year.id,
          name: 'First Term',
          startsOn: new Date(assumptions.firstTermStarts),
          endsOn: new Date(assumptions.firstTermEnds),
        },
      });
      const grade = await tx.gradeLevel.upsert({
        where: { tenantId_schoolId_code: { ...scope, code: 'SSS3' } },
        update: {},
        create: { ...scope, code: 'SSS3', name: 'Senior Secondary 3' },
      });
      const academicClass = await tx.class.upsert({
        where: {
          tenantId_schoolId_academicYearId_code: {
            ...scope,
            academicYearId: year.id,
            code: 'SSS-SCI-3A',
          },
        },
        update: {},
        create: {
          ...scope,
          academicYearId: year.id,
          gradeLevelId: grade.id,
          code: 'SSS-SCI-3A',
          name: 'SSS Science 3A',
          section: 'A',
          capacity: 40,
          status: 'PLANNED',
        },
      });
      const settings = await tx.timetableSettings.upsert({
        where: { tenantId_schoolId: scope },
        update: {},
        create: {
          ...scope,
          workingDays: [1, 2, 3, 4, 5],
          schoolStartsAt: '08:00',
          schoolEndsAt: '14:00',
          lessonDurationMinutes: 40,
          breakStartsAt: null,
          breakEndsAt: null,
          lunchStartsAt: '12:00',
          lunchEndsAt: '12:40',
          maxPeriodsPerDay: 8,
          maxTeacherPeriodsDay: 6,
          maxTeacherPeriodsWeek: 30,
          maxConsecutivePeriods: 3,
          allowDoublePeriods: true,
          allowSaturday: false,
        },
      });
      const codes = ['MATH', 'ENG', 'PHY', 'CHEM', 'BIO', 'GEO', 'AGRIC', 'ICT', 'CIVIC'];
      const subjects = [];
      for (let i = 0; i < scienceSubjects.length; i++) {
        const subject = await tx.subject.upsert({
          where: { tenantId_schoolId_code: { ...scope, code: codes[i] } },
          update: {},
          create: { ...scope, code: codes[i], name: scienceSubjects[i] },
        });
        subjects.push(subject);
        await tx.classSubject.upsert({
          where: { classId_subjectId: { classId: academicClass.id, subjectId: subject.id } },
          update: {},
          create: { classId: academicClass.id, subjectId: subject.id },
        });
        const periodsPerWeek = scienceWeek.flat().filter((item) => item === i).length;
        await tx.subjectPeriodRequirement.create({
          data: {
            ...scope,
            classId: academicClass.id,
            subjectId: subject.id,
            academicYearId: year.id,
            termId: term.id,
            periodsPerWeek,
            minimumPeriods: periodsPerWeek,
            maximumPeriods: periodsPerWeek,
            preferredPeriodsDay: 1,
            requiresDoublePeriod: i < 5,
          },
        });
      }
      const requirements = await tx.subjectPeriodRequirement.findMany({
        where: { ...scope, classId: academicClass.id, termId: term.id },
      });
      validateSubjectPeriodCapacity(settings, requirements);
      const generated = generateTimetableSlots(settings);
      if (generated.filter((slot) => !slot.isBreak).length !== 40)
        throw new Error('Existing settings do not match the approved 40-period draft');
      const timetable = await tx.timetable.create({
        data: {
          ...scope,
          name,
          academicYear: year.name,
          academicYearId: year.id,
          academicPeriodId: term.id,
          status: 'DRAFT',
        },
      });
      const entries = [];
      const slots = [];
      for (let day = 1; day <= 5; day++) {
        let period = 0;
        for (const generatedItem of generated.filter((slot) => slot.weekday === day)) {
          const generatedSlot = { ...generatedItem };
          delete generatedSlot.kind;
          const slot = await tx.timetableSlot.create({
            data: { ...scope, timetableId: timetable.id, ...generatedSlot },
          });
          slots.push(slot);
          if (!slot.isBreak) {
            const subject = subjects[scienceWeek[day - 1][period++]];
            entries.push(
              await tx.scheduleEntry.create({
                data: {
                  ...scope,
                  timetableId: timetable.id,
                  timeSlotId: slot.id,
                  classId: academicClass.id,
                  subjectId: subject.id,
                  subjectCode: subject.code,
                  kind: 'LESSON',
                  duration: 1,
                  notes: 'Draft: teacher and room assignment pending.',
                },
              })
            );
          }
        }
      }
      await tx.timetableVersion.create({
        data: { timetableId: timetable.id, number: 1, snapshot: { slots, entries, assumptions } },
      });
      await tx.timetableAudit.create({
        data: {
          ...scope,
          timetableId: timetable.id,
          action: 'INITIAL_SCIENCE_DRAFT_CREATED',
          metadata: {
            assumptions,
            subjectCount: subjects.length,
            entryCount: entries.length,
            requestedBy: 'User authorized school and First Term setup',
          },
        },
      });
      return {
        school: school.name,
        schoolId: school.id,
        class: academicClass.name,
        term: term.name,
        year: year.name,
        timetableId: timetable.id,
        status: timetable.status,
        subjects: subjects.map((s) => s.name),
        entries: entries.length,
        slots: slots.length,
        assumptions,
      };
    },
    { isolationLevel: 'Serializable', timeout: 120000 }
  );
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(
    JSON.stringify({
      code: error.code || error.name,
      message:
        error instanceof Error && !error.code
          ? error.message
          : 'School setup failed; transaction rolled back',
    })
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
