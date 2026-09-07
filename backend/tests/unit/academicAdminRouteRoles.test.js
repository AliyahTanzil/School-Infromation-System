import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('subject and class administration explicitly allow application managers', async () => {
  for (const file of ['subjectRoutes.js', 'classRoutes.js']) {
    const source = await readFile(
      new URL(`../../src/presentation/http/routes/${file}`, import.meta.url),
      'utf8'
    );
    assert.match(source, /authorize\([^)]*'SCHOOL_ADMIN'[^)]*'APPLICATION_MANAGER'[^)]*'OWNER'/s);
  }
});
