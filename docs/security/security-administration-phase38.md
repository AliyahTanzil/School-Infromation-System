# Security administration Phase 38

Date: 2026-09-09
Roadmap task: SEC-001

## Conditional payment balance update

POST `/api/finance/payments` and `/api/v1/finance/payments` now conditionally update the invoice using its ID, tenant, school and the exact balance read in the transaction. If no row matches, the request returns HTTP 409 with instructions to retry using the same idempotency key.

The balance claim occurs before payment and ledger creation. All three writes remain in one database transaction; later failures abort the transaction. Existing matching-payment retries continue to return the stored record.

No schema migration or live financial transaction was performed.

## Verification

- Focused payment and finance suite: 11 passed.
- Full backend suite: 441 passed, 1 intentional live-database skip, 0 failures.
- Backend production build, targeted ESLint, formatting and diff checks: passed.

## Remaining work

SEC-001 remains in progress. Tests simulate competing balance claims and transaction rollback; live database concurrency verification remains outstanding. Exact monetary bounds and concurrent first-submission idempotency response handling remain follow-up work.
