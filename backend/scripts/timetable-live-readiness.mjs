import prisma from '../src/infrastructure/orm/prismaClient.js';
import { getTimetableReadiness } from '../src/application/services/timetableService.js';

const schoolId = process.env.SINGLE_SCHOOL_ID;

if (!schoolId) {
  console.error('SINGLE_SCHOOL_ID is required to run timetable live-readiness checks.');
  process.exitCode = 2;
} else {
  try {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, tenantId: true },
    });

    if (!school) {
      console.error(`Configured school ${schoolId} was not found.`);
      const availableSchools = await prisma.school.findMany({
        select: { id: true, name: true },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      });
      if (availableSchools.length) {
        console.error('Available schools:');
        for (const availableSchool of availableSchools) {
          console.error(`  - ${availableSchool.name} (${availableSchool.id})`);
        }
      } else {
        console.error('No school records are available.');
      }
      process.exitCode = 2;
    } else {
      const timetables = await prisma.timetable.findMany({
        where: { tenantId: school.tenantId, schoolId: school.id },
        select: { id: true, name: true, status: true },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      });

      console.log(`School: ${school.name} (${school.id})`);

      if (!timetables.length) {
        console.log('No timetables found for the configured school.');
        process.exitCode = 1;
      }

      for (const timetable of timetables) {
        const report = await getTimetableReadiness({
          tenantId: school.tenantId,
          schoolId: school.id,
          timetableId: timetable.id,
        });

        console.log(
          `${report.ready ? 'READY' : 'BLOCKED'}: ${timetable.name} [${timetable.status}] — ${report.issues.length} issue(s)`
        );
        for (const issue of report.issues) {
          console.log(`  - ${issue.code}: ${issue.message}`);
        }

        if (!report.ready) process.exitCode = 1;
      }
    }
  } catch (error) {
    console.error(`Timetable readiness check failed: ${error.message}`);
    process.exitCode = 2;
  } finally {
    await prisma.$disconnect();
  }
}
