# Security administration Phase 36

Date: 2026-09-09
Roadmap task: SEC-001

## Payment retry contract

At POST `/api/finance/payments` and `/api/v1/finance/payments`, an existing idempotency key returns its stored payment only when tenant, school, invoice, numeric amount, provider and reference match the request. A mismatch returns the existing ConflictError response (HTTP 409) before any new payment, balance or ledger write.

Equivalent numeric representations such as 20 and 20.00 match. Provider and reference values are compared exactly. The existing new-payment transaction remains unchanged.

No schema migration or live financial transaction was performed.

## Verification

- Focused payment and finance suite: 8 passed.
- Full backend suite: 433 passed, 1 intentional live-database skip, 0 failures.
- Backend production build, targeted ESLint, formatting and diff checks: passed.

## Remaining work

SEC-001 remains in progress. Concurrent first submissions, exact monetary bounds and invoice eligibility transactions remain separate follow-up work. This change handles retries when the key already exists and does not establish concurrent payment guarantees.
