import prisma from '../src/infrastructure/orm/prismaClient.js';
import { ensureConfiguredSingleSchool } from '../src/application/services/singleSchoolBootstrapService.js';

try {
  const result = await ensureConfiguredSingleSchool();
  if (!result) throw new Error('SINGLE_SCHOOL_ID and SINGLE_SCHOOL_NAME are required');
  console.log(
    `${result.created ? 'Created' : 'Found'} configured school: ${result.school.name} (${result.school.id})`
  );
} catch (error) {
  console.error(`Single-school bootstrap failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
