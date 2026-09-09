# Security administration Phase 39

Date: 2026-09-09
Roadmap task: SEC-001

## Payment amount contract

POST `/api/finance/payments` and `/api/v1/finance/payments` accept positive amounts with at most two decimal places, capped at 21,474,836.47. This cap comes from the signed 32-bit FinancialTransaction.amountMinor field: 2,147,483,647 minor units.

HTTP validation and the service use the same domain predicate. Invalid amounts fail before idempotency lookup or transaction creation. Payment balance subtraction uses integer minor units, and the ledger uses that same validated value. Equivalent numeric inputs such as 20 and 20.00 remain supported.

No schema migration or live financial transaction was performed.

## Verification

- Focused payment and finance suite: 14 passed.
- Full backend suite: 444 passed, 1 intentional live-database skip, 0 failures.
- Backend production build, targeted ESLint, formatting and diff checks: passed.

## Remaining work

SEC-001 remains in progress. Invoice subtotal/discount precision and bounds, concurrent first-submission idempotency responses and live database concurrency verification remain separate follow-up work.
