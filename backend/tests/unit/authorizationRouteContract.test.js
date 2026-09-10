import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';
import { PERMISSIONS } from '../../src/shared/authorization/permissionCodes.js';

const routesDirectory = fileURLToPath(
  new URL('../../src/presentation/http/routes/', import.meta.url)
);

test('every route permission literal exists in the canonical permission catalog', async () => {
  const knownPermissions = new Set(Object.values(PERMISSIONS));
  const routeFiles = (await readdir(routesDirectory)).filter((name) => name.endsWith('.js'));
  const unknown = [];

  for (const routeFile of routeFiles) {
    const source = await readFile(
      new URL(`../../src/presentation/http/routes/${routeFile}`, import.meta.url),
      'utf8'
    );
    const permissionCalls = source.matchAll(/requirePermission\('([^']+)'\)/g);
    for (const match of permissionCalls) {
      if (!knownPermissions.has(match[1])) unknown.push(`${routeFile}: ${match[1]}`);
    }
  }

  assert.deepEqual(unknown, []);
});

test('active student and school-administrator routes use canonical permission codes', async () => {
  const [studentRoutes, schoolRoutes] = await Promise.all([
    readFile(
      new URL('../../src/presentation/http/routes/studentDomainRoutes.js', import.meta.url),
      'utf8'
    ),
    readFile(
      new URL('../../src/presentation/http/routes/schoolRoutes.js', import.meta.url),
      'utf8'
    ),
  ]);

  assert.doesNotMatch(studentRoutes, /requirePermission\('student\./);
  assert.match(studentRoutes, /requirePermission\('students\.read'\)/);
  assert.match(studentRoutes, /requirePermission\('students\.create'\)/);
  assert.match(studentRoutes, /requirePermission\('students\.update'\)/);
  assert.doesNotMatch(schoolRoutes, /schools\.assign_admins/);
  assert.match(schoolRoutes, /requirePermission\('schools\.assign'\)/);
});

test('analytics uses resolved school context and protects export mutations', async () => {
  const [routes, controller] = await Promise.all([
    readFile(
      new URL('../../src/presentation/http/routes/analyticsRoutes.js', import.meta.url),
      'utf8'
    ),
    readFile(
      new URL('../../src/presentation/http/controllers/analyticsController.js', import.meta.url),
      'utf8'
    ),
  ]);

  assert.match(routes, /router\.use\(singleSchoolContext\)/);
  assert.match(routes, /router\.post\('\/exports', authorizeSchoolAdmin, exportReport\)/);
  assert.match(controller, /const scope = \(req\) => req\.schoolContext/);
  assert.doesNotMatch(controller, /req\.user\?\.schoolId|req\.user\?\.tenantId/);
});
