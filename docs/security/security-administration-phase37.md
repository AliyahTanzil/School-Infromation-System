# Security administration Phase 37

Date: 2026-09-09
Roadmap task: SEC-001

## Invoice creation transaction

POST `/api/finance/invoices` and `/api/v1/finance/invoices` now verify the tenant-owned student, verify the optional active tenant/school fee and create the invoice through the same transaction client. Missing students or ineligible fees stop creation before writing. Ad hoc invoices without a fee remain supported.

Invoice amount validation runs before opening the transaction. Persistence failures propagate instead of returning a successful invoice response. Request and response shapes remain unchanged.

No schema migration or live financial transaction was performed.

## Verification

- Focused invoice and finance suite: 9 passed.
- Full backend suite: 438 passed, 1 intentional live-database skip, 0 failures.
- Backend production build, targeted ESLint, formatting and diff checks: passed.

## Remaining work

SEC-001 remains in progress. Exact monetary bounds and payment concurrency remain follow-up work. These tests verify transaction-client usage and error propagation; they do not establish database isolation guarantees against concurrent eligibility changes.
