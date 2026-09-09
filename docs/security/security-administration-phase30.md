# Security administration Phase 30

Date: 2026-09-09
Roadmap task: SEC-001

## Class API contract

Both `/api/classes` and `/api/v1/classes` retain authenticated administrator access and server-resolved tenant/school scope.

- Detail, status, enrollment and subject-assignment routes require a UUID class identifier.
- Class creation, lifecycle changes, enrollments and subject assignments reject unknown body fields. Inline subject creation also rejects unknown nested fields.
- List queries accept only `query`, `status`, `academicYearId`, `page` and `pageSize`. Status must be `PLANNED`, `ACTIVE`, `ARCHIVED` or `CANCELLED`; page is bounded to 1–10,000 and page size to 1–100.
- Controllers apply authenticated tenant/school scope after client input. Status changes also retain the authenticated actor and route identifier, and subject assignments retain the route class identifier.
- Existing grade/year/classroom ownership checks and enrollment lifecycle/capacity checks remain in place.

Invalid requests use the existing validation error response. No schema migration or live database mutation is required.

## Verification

- Focused class suite: 10 passed.
- Full backend suite: 406 passed, 1 intentional live-database skip, 0 failures.
- Backend build, targeted ESLint, formatting and diff checks: passed.

## Remaining work

SEC-001 remains in progress for remaining mounted routes, compliance controls and final acceptance. This checkpoint covers class request boundaries; it does not establish live concurrent enrollment or lifecycle-transition guarantees.
