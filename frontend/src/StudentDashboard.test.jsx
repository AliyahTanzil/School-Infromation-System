/* global process */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('StudentDashboard', () => {
  it('uses authenticated API calls and an in-place registration form', async () => {
    const source = await readFile(resolve(process.cwd(), 'src/StudentDashboard.jsx'), 'utf8');

    expect(source).toContain("api.get('/students'");
    expect(source).toContain("api.post('/students'");
    expect(source).not.toContain('href="/students/new"');
    expect(source).toContain('student.firstName');
  });
});
