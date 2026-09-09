# Security administration Phase 29

Date: 2026-09-09
Roadmap task: SEC-001

## Subject API contract

Both `/api/subjects` and `/api/v1/subjects` retain authenticated administrator access and server-resolved tenant/school scope.

- Detail, PATCH, DELETE and status routes require a UUID subject identifier.
- List queries accept only `query` (up to 100 characters) and `status` (`ACTIVE`, `INACTIVE`, `ARCHIVED`). Unknown query fields are rejected.
- Create and update assignment entries accept only `classId` (UUID) and optional `teachingFocus` (up to 500 characters). Unknown nested fields are rejected.
- PATCH requires at least one supported field; an empty body is rejected.
- Existing transactional class ownership checks and scoped soft deletion remain enforced.

Invalid requests use the existing validation error response. No schema migration is required.

## Verification

- Focused subject tests: 8 passed.
- Full backend suite: 402 passed, 1 intentional live-database skip, 0 failures.
- Backend production build, targeted ESLint, formatting and diff checks: passed.

## Remaining work

SEC-001 remains in progress for remaining mounted routes, compliance controls and final acceptance.
