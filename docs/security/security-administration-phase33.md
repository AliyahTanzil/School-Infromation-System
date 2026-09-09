# Security administration Phase 33

Date: 2026-09-09
Roadmap task: SEC-001

## Academic-policy API contract

The authenticated administrator routes at `/api/academic-policies` and `/api/v1/academic-policies` retain server-resolved school context.

- Detail and lifecycle identifiers require UUIDs.
- List queries, policy creation and status changes reject unknown fields. Grade bands and assessment weights also reject unknown nested fields.
- Policy creation checks every distinct referenced subject against tenant, school and non-deleted ownership in the same transaction used to persist the policy, bands and weights. Invalid references stop creation before writing.
- Weights without a subject remain supported.
- Lifecycle updates include tenant, school and non-deleted ownership in the write predicate; history and status changes retain their existing transaction.

Invalid request bodies use the existing validation error response. Out-of-scope subject references return not found. No schema migration or live database mutation was required.

## Verification

- Focused policy suite: 7 passed.
- Full backend suite: 420 passed, 1 intentional live-database skip, 0 failures.
- Backend production build, targeted ESLint, formatting and diff checks: passed.

## Remaining work

SEC-001 remains in progress for remaining mounted routes, compliance controls and final acceptance. Concurrent activation/overlap enforcement and auditing existing policy subject links remain outside this checkpoint.
