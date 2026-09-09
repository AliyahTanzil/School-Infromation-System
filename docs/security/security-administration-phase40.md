# Security administration Phase 40

Date: 2026-09-09
Roadmap task: SEC-001

## Invoice amount contract

POST `/api/finance/invoices` and `/api/v1/finance/invoices` require nonnegative subtotal and discount values with at most two decimal places, capped at 9,999,999,999.99 to fit Decimal(12,2). Discount must not exceed subtotal. Zero-value invoices and omitted discounts remain supported.

HTTP validation and domain calculations use the same amount predicate. Total and initial balance subtract integer minor units before conversion back to currency units. Invalid service inputs are rejected before the invoice transaction opens.

The invoice maximum differs from the per-payment ledger limit documented in Phase 39. No schema migration or live financial transaction was performed.

## Verification

- Focused invoice and finance suite: 16 passed.
- Full backend suite: 448 passed, 1 intentional live-database skip, 0 failures.
- Backend production build, targeted ESLint, formatting and diff checks: passed.

## Remaining work

SEC-001 remains in progress. Concurrent first-submission idempotency responses, live database concurrency verification and remaining route/compliance audits remain outstanding.
