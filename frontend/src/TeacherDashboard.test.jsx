/* global process */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';

it('derives teacher workspace school scope from authentication', async () => {
  const source = await readFile(resolve(process.cwd(), 'src/TeacherDashboard.jsx'), 'utf8');

  expect(source).toContain("api.get('/teachers/me')");
  expect(source).toContain("api.get('/lms/classrooms')");
  expect(source).toContain('params: { classroomId: room.id }');
  expect(source).not.toContain('x-school-id');
  expect(source).not.toContain("sessionStorage.getItem('sais.schoolId')");
  expect(source).not.toContain("sessionStorage.setItem('sais.schoolId'");
});
