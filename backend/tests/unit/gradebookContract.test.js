import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('gradebook routes authenticate, resolve school scope and protect teacher mutations', async () => {
  const routes = await source('src/presentation/http/routes/gradebookRoutes.js');
  assert.match(routes, /router\.use\([\s\S]*authenticate,[\s\S]*teacherContext/);
  assert.match(routes, /authorizeSchoolAdminOrTeacher/);
  assert.match(routes, /put\([\s\S]*'\/submissions\/:submissionId\/grade'/);
  assert.match(routes, /post\([\s\S]*'\/grades\/:id\/release'/);
  assert.match(routes, /'\/assignments\/:assignmentId\/rubric'/);
});

test('gradebook service scopes persistence and hides draft grades from students', async () => {
  const service = await source('src/application/services/gradebookService.js');
  assert.match(service, /tenantId: scope\.tenantId, schoolId: scope\.schoolId/);
  assert.match(service, /grade: \{ is: \{ status: 'RELEASED' \} \}/);
  assert.match(service, /Score cannot exceed maximum score/);
  assert.match(service, /Rubric score is outside the assigned rubric/);
  assert.match(service, /Rubric is outside the assignment classroom/);
});

test('gradebook and feedback screens use persisted LMS APIs without demo rosters', async () => {
  const gradebook = await source('../frontend/src/Gradebook.jsx');
  const feedback = await source('../frontend/src/FeedbackWorkspace.jsx');
  assert.match(gradebook, /api\.get\('\/lms\/gradebook\/grades'/);
  assert.match(gradebook, /api\.post\('\/lms\/gradebook\/rubrics'/);
  assert.match(feedback, /api\.get\('\/lms\/gradebook\/grades'/);
  assert.doesNotMatch(feedback, /Amina Mensah|David Kim|Lena Ortiz/);
});

test('active server mounts compatibility and versioned gradebook APIs', async () => {
  const app = await source('src/foundation/app.ts');
  assert.match(app, /app\.use\('\/api\/lms\/gradebook', gradebookRouter\)/);
  assert.match(app, /app\.use\('\/api\/v1\/lms\/gradebook', gradebookRouter\)/);
});
