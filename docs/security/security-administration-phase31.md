# Security administration Phase 31

Date: 2026-09-09
Roadmap task: SEC-001

## Academic-period API contract

The existing authenticated administrator routes at `/api/academic-periods` and `/api/v1/academic-periods` retain single-school context resolution.

- Period creation, event creation, status changes and list queries reject unknown fields.
- Status parameters require a UUID. Existing date-range validation remains enforced.
- List and status controllers apply server-resolved context after request fields; status changes retain the route identifier and authenticated actor.
- Academic-year updates require tenant ownership; term updates require ownership through the parent academic year; event updates require tenant and school ownership.
- The calendar frontend sends period-specific or event-specific fields so switching form types cannot submit unrelated fields to strict endpoints.

Invalid requests use the existing validation error response. No schema migration or live database mutation was required.

## Verification

- Full backend suite: 410 passed, 1 intentional live-database skip, 0 failures.
- Focused calendar frontend tests: 2 passed after isolating shared mock history.
- Backend and frontend production builds: passed.
- Targeted ESLint, formatting and diff checks: passed.
- Frontend test/build commands required an approved rerun outside the sandbox after esbuild directory access was denied.

## Remaining work

SEC-001 remains in progress for remaining mounted routes, compliance controls and final acceptance. This checkpoint covers ownership and request contracts. Academic-year CLOSED-state persistence remains a separate lifecycle limitation: the active model uses `isCurrent`, and the current DTO maps false to PLANNED. Live concurrency guarantees are not established by these mocked persistence tests.
