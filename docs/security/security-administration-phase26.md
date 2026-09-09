# Security administration Phase 26

Date: 2026-09-09  
Roadmap task: SEC-001  
Status: checkpoint complete; SEC-001 remains in progress

## Scope

Authorization audit wave 9 reviewed canonical teacher self-service, teacher administration, and the teacher workspace's school-context handling.

## Controls added

- Every teacher route now resolves the authenticated single-school context before accessing teacher data.
- `/teachers/me` looks up the authenticated user's teacher identity using both tenant and school ownership.
- Teacher directory reads remain administrator-only, accept only controlled status and search filters, and enforce page sizes between 1 and 100.
- Teacher detail and lifecycle identifiers must be UUIDs.
- Teacher creation accepts only the active persisted profile and employment fields; strict nested schemas reject tenant, school, user, actor, and other caller-controlled ownership fields.
- Lifecycle changes accept only supported destination states and strict optional reasons.
- Platform and school administrators, plus the application owner roles used by the single-school administration shell, share the same protected administration boundary.
- The teacher workspace no longer reads a school identifier from browser storage or sends `x-school-id`; the server derives school scope from authentication.

## Verification

- Focused teacher backend suite: 5 passed.
- Focused teacher frontend contract test: 1 passed.
- Full backend suite: 395 passed, 1 intentional live-database skip, 0 failed.
- Full frontend suite: 43 passed, 0 failed.
- Backend and frontend production builds: passed.
- Targeted ESLint, Prettier, and `git diff --check`: passed.

No schema migration or live database mutation was required.

## Remaining work

SEC-001 remains open for the remaining mounted-router authorization waves, compliance controls, and final acceptance audit.
