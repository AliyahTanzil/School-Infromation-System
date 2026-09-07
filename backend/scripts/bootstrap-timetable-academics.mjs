import prisma from '../src/infrastructure/orm/prismaClient.js';
import { ensureScience3aAcademicFoundation } from '../src/application/services/timetableAcademicBootstrapService.js';

try {
  const schoolId = process.env.SINGLE_SCHOOL_ID?.trim();
  if (!schoolId) throw new Error('SINGLE_SCHOOL_ID is required');
  const result = await ensureScience3aAcademicFoundation({ schoolId });
  console.log(`Academic foundation ready for ${result.school.name}:`);
  console.log(`  - ${result.academicYear.name}, ${result.term.name}`);
  console.log(`  - ${result.class.name}, capacity ${result.class.capacity}`);
  console.log(`  - ${result.subjects.length} subjects assigned to the class`);
} catch (error) {
  console.error(`Academic bootstrap failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
