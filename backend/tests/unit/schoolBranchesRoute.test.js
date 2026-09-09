import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
const source = await readFile('src/presentation/http/routes/schoolRoutes.js', 'utf8');
test('main-school branch routes are mounted with the real branch permission', () => {
  assert.match(
    source,
    /'\/:id\/branches',[\s\S]*?requirePermission\('schools\.read'\),[\s\S]*?validate\(branchListSchema\)/
  );
  assert.match(
    source,
    /router\.post\(\s*'\/:id\/branches',[\s\S]*?requirePermission\('schools\.branches'\),[\s\S]*?validate\(branchCreateSchema\)/
  );
  assert.match(
    source,
    /router\.patch\(\s*'\/:id\/branches\/:branchId',[\s\S]*?requirePermission\('schools\.branches'\),[\s\S]*?validate\(branchUpdateSchema\)/
  );
  assert.doesNotMatch(source, /schools\.manage_branches/);
  assert.doesNotMatch(source, /\['schoolBranch'|\['department'|\['gradeLevel'/);
  assert.match(
    source,
    /featureUnavailableRoutes\('School administrator assignments', 'RBAC-002'\)/
  );
});
