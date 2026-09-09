# Class creation refinement — 2026-09-09

## Outcome

The class-creation workflow now uses a year-only selector and these controlled school stages:

- Pre-School Nursery
- Primary School
- Junior Secondary
- Senior Secondary

The frontend submits the selected starting year and canonical stage code instead of requiring pre-existing database identifiers.

## Persistence behavior

Class creation is transactional. The service:

1. Reuses a tenant academic year whose start date is within the selected year.
2. Creates a January–December academic-year record only when no matching year exists.
3. Creates or updates the selected grade stage within the authenticated tenant and school.
4. Validates an optional classroom within the same tenant and school.
5. Creates the class only after every dependency is valid.

Existing API clients may continue to submit valid `academicYearId` and `gradeLevelId` values. Academic years are tenant-wide in the active schema; grade levels, classrooms, and classes are school-scoped.

## Verification

- Focused backend class tests: 6 passed.
- Focused frontend class behavior test: 1 passed.
- Full backend suite: 380 passed, 1 intentional live-database skip, 0 failed.
- Frontend and backend production builds: passed.
- Targeted frontend/backend lint and `git diff --check`: passed.
- Full frontend suite: 41 passed, 0 failed.

No migration or live database mutation was required.
