# Security administration Phase 23

Date: 2026-09-09  
Roadmap task: SEC-001  
Status: checkpoint complete; SEC-001 remains in progress

## Scope

Authorization audit wave 6 reviewed the mounted examination and result APIs on both compatibility and versioned paths.

## Controls added

- Authenticated teachers may read school-scoped examinations and results.
- Examination creation, candidate administration, schedule administration, and examination lifecycle transitions require `PLATFORM_ADMIN` or `SCHOOL_ADMIN`.
- Result processing, approval, publication, and locking require `PLATFORM_ADMIN` or `SCHOOL_ADMIN`.
- Teacher mark entry requires an active teacher identity in the authenticated tenant and school.
- Teacher mark entry additionally requires an active teaching assignment matching the candidate class and examination subject.
- Platform and school administrators retain mark-entry override access.
- Candidate identity lookup now includes tenant, school, and soft-delete scope.
- Examination detail identifiers must be UUIDs before reaching the controller.

## Verification

- Focused examination, result, lifecycle, engine, and route-authorization tests: 21 passed.
- Full backend suite: 386 passed, 1 intentional live-database skip, 0 failed.
- Backend production build: passed.
- Targeted ESLint and `git diff --check`: passed.

No schema migration or live database mutation was required.

## Remaining work

SEC-001 remains open for the remaining mounted-router authorization waves, compliance controls, and final acceptance audit.
