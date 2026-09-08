# Security administration — Phase 18

Date: 2026-09-08. Task: SEC-001 (in progress).

## Authorization audit wave 1

The first application-wide route audit covered canonical permission names and the digital-classroom membership lifecycle. It found and corrected three authorization inconsistencies on routes mounted by the TypeScript composition root:

- active student routes requested undefined singular `student.*` permissions instead of the canonical `students.*` catalog entries;
- school administrator assignment routes requested undefined `schools.assign_admins` instead of `schools.assign`;
- digital-classroom member addition, member removal and archival lacked the same route-level administrator/teacher boundary already applied to classroom creation.

Digital-classroom mutations now have two authorization layers. The route rejects identities that are not platform administrators, school administrators or teachers. The service continues to require the selected single-school scope and limits non-administrators to the classroom owner before changing membership or archival state.

## Regression boundary

`authorizationRouteContract.test.js` inventories every literal passed to `requirePermission()` under the HTTP route directory and fails when a route references a code outside the canonical permission catalog. The digital-classroom contract separately requires all four classroom mutations to carry the role boundary and retains assertions for owner and school-scope enforcement in the service.

## Verification

The eight focused authorization and classroom contract tests pass. The backend production build and targeted lint pass. The full backend suite reports 372 passed, one intentional live-database skip and the same pre-existing class source-contract failure: its assertion expects a tenant-only student lookup even though the implementation now enforces tenant, school and soft-delete scope.

No database records, permissions or sessions were changed. SEC-001 remains in progress while authorization and single-school scoping are audited across the remaining mounted domain routers.
