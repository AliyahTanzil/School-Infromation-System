# Security administration Phase 32

Date: 2026-09-09
Roadmap task: SEC-001

## Parent portal ownership

The authenticated `/api/parents/me` and `/api/v1/parents/me` routes retain parent-context resolution and strict profile/link payload validation.

- Profile updates and relationship revocation now include ownership through the parent relation in the write predicate: matching tenant, non-deleted parent, and matching school or the supported tenant-wide parent record.
- Controllers pass server-resolved school context to profile and unlink services.
- Link requests verify the eligible parent and student and persist the pending relationship through one transaction client.
- Portal reads explicitly require student tenant ownership in addition to active school enrollment and an active, non-revoked relationship.
- Portal services reject missing tenant/school context before persistence.

The active Student model is tenant-owned and has no schoolId or deletedAt columns; school eligibility continues to use ClassEnrollment. No schema migration or live database mutation was required.

## Verification

- Focused parent suite: 10 passed.
- Clean full backend rerun: 415 passed, 1 intentional live-database skip, 0 failures.
- Backend production build, targeted ESLint, formatting and diff checks: passed.

## Remaining work

SEC-001 remains in progress for remaining mounted routes, compliance controls and final acceptance. Link requests continue to use the existing PENDING workflow; this checkpoint does not grant relationship approval or establish live concurrency guarantees.
