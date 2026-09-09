# Security administration Phase 35

Date: 2026-09-09
Roadmap task: SEC-001

## Finance administration contract

The mounted `/api/finance` and `/api/v1/finance` routes retain authenticated administrator access and server-resolved school context. The legacy financeCoreRoutes module is not mounted.

- Invoice creation, payment creation, invoice queries and payment identifier parameters reject unknown fields.
- Transaction listing validates a strict query with an integer limit of 1–100, defaulting to 50.
- Service scope extraction requires both tenant and school identifiers.
- Invoice, payment and financial-transaction writes persist only tenantId and schoolId from authenticated context. The context userId is no longer spread into models that do not support it.
- Payment balance updates include tenant and school ownership in the write predicate.

No schema migration or live financial transaction was performed.

## Verification

- Focused finance suite: 7 passed.
- Full backend suite: 429 passed, 1 intentional live-database skip, 0 failures.
- Backend production build, targeted ESLint, formatting and diff checks: passed.

## Remaining work

SEC-001 remains in progress for remaining mounted routes, compliance controls and final acceptance. Payment concurrency, exact monetary bounds, idempotency payload matching and transactionally checked invoice eligibility remain separate follow-up work; this checkpoint does not establish those guarantees.
