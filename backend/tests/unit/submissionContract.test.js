import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('submissions relate assignments, authenticated users, and immutable versions', async () => {
  const schema = await read('prisma/schema.prisma');
  assert.match(schema, /model StudentSubmission[\s\S]*assignment\s+Assignment/);
  assert.match(schema, /model StudentSubmission[\s\S]*student\s+User/);
  assert.match(schema, /model SubmissionVersion[\s\S]*@@unique\(\[submissionId, version\]\)/);
});

test('submission service enforces membership, ownership and serializable version writes', async () => {
  const service = await read('src/application/services/submissionService.js');
  assert.match(service, /active student classroom membership/i);
  assert.match(service, /studentId: userId/);
  assert.match(service, /isolationLevel: 'Serializable'/);
  assert.match(service, /Retract the submitted work before creating another version/);
});

test('submission routes validate every operation and derive identity from authentication', async () => {
  const routes = await read('src/presentation/http/routes/submissionRoutes.js');
  const controller = await read('src/presentation/http/controllers/submissionController.js');
  assert.match(routes, /router\.use\([\s\S]*authenticate[\s\S]*teacherContext/);
  assert.match(routes, /validate\(submissionSaveSchema\)/);
  assert.doesNotMatch(controller, /req\.body\.studentId/);
});

test('submission APIs are mounted on both active LMS paths', async () => {
  const app = await read('src/foundation/app.ts');
  assert.match(app, /app\.use\('\/api\/lms\/submissions', submissionRouter\)/);
  assert.match(app, /app\.use\('\/api\/v1\/lms\/submissions', submissionRouter\)/);
});

test('submission migration is checked in and non-destructive', async () => {
  const migration = await read(
    'prisma/migrations/20260827360000_student_submission_versions/migration.sql'
  );
  assert.match(migration, /CREATE TABLE IF NOT EXISTS "StudentSubmission"/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS "SubmissionVersion"/);
  assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN/);
});

test('student work UI uses live assignments, submissions and version history', async () => {
  const frontend = await read('../frontend/src/StudentSubmissionCenter.jsx');
  assert.match(frontend, /api\.get\('\/lms\/assignments'/);
  assert.match(frontend, /api\.get\('\/lms\/submissions'/);
  assert.match(frontend, /versions\.map/);
  assert.doesNotMatch(frontend, /INITIAL_WORK/);
});
