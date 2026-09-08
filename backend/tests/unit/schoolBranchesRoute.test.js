import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
const source = await readFile('src/presentation/http/routes/schoolRoutes.js', 'utf8');
test('main-school branch routes are mounted with the real branch permission', () => {
  assert.match(
    source,
    /router\.get\('\/:id\/branches', requirePermission\('schools\.read'\), controller\.listBranches\)/
  );
  assert.match(
    source,
    /router\.post\(\s*'\/:id\/branches',\s*requirePermission\('schools\.branches'\)/
  );
  assert.match(
    source,
    /router\.patch\(\s*'\/:id\/branches\/:branchId',\s*requirePermission\('schools\.branches'\)/
  );
  assert.doesNotMatch(source, /schools\.manage_branches/);
});
