import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('quiz persistence relates classrooms, policy weights, questions, attempts and answers', async () => {
  const schema = await read('prisma/schema.prisma');
  for (const model of ['Quiz', 'QuizQuestion', 'QuizAttempt', 'QuizAnswer']) {
    assert.match(schema, new RegExp(`model ${model}`));
  }
  assert.match(schema, /assessmentWeight\s+AssessmentWeight\?/);
  assert.match(schema, /@@unique\(\[quizId, studentId, attemptNumber\]\)/);
});

test('quiz service enforces classroom roles, lifecycle, attempt limits and server scoring', async () => {
  const service = await read('src/application/services/quizService.js');
  assert.match(service, /Only classroom teachers can manage quizzes/);
  assert.match(service, /Quiz attempt limit reached/);
  assert.match(service, /Quiz attempt has expired/);
  assert.match(service, /pointsAwarded/);
  assert.match(service, /Assessment weight is not part of an active school policy/);
  assert.match(service, /staff \? \{ correctAnswer: true \}/);
});

test('quiz API validates operations and is mounted on both active paths', async () => {
  const routes = await read('src/presentation/http/routes/quizRoutes.js');
  const app = await read('src/foundation/app.ts');
  assert.match(routes, /validate\(quizQuestionSchema\)/);
  assert.match(routes, /validate\(quizAttemptAnswerSchema\)/);
  assert.match(app, /app\.use\('\/api\/lms\/quizzes', quizRouter\)/);
  assert.match(app, /app\.use\('\/api\/v1\/lms\/quizzes', quizRouter\)/);
});

test('quiz migration is checked in and non-destructive', async () => {
  const migration = await read('prisma/migrations/20260827370000_quiz_engine/migration.sql');
  assert.match(migration, /CREATE TABLE IF NOT EXISTS "Quiz"/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS "QuizAttempt"/);
  assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN/);
});

test('both assessment routes share the operational API-backed engine', async () => {
  const assessment = await read('../frontend/src/AssessmentEngine.jsx');
  const quiz = await read('../frontend/src/QuizSystem.jsx');
  assert.match(assessment, /api\.get\('\/lms\/quizzes'/);
  assert.match(assessment, /\/attempts\/\$\{attempt\.id\}\/answers/);
  assert.match(quiz, /AssessmentEngine/);
  assert.doesNotMatch(assessment, /const questions = \[/);
});
