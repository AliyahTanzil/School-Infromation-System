# SEC-001 Phase 43: payroll monetary validation

Date: 2026-09-09

## Changes

Payroll creation validates every included employee's scoped position and salary before inserting a run or items. Missing position references now produce an actionable validation error instead of silently paying zero. Explicit zero salaries remain valid.

Each salary must be a nonnegative numeric integer in minor units, and both individual values and the aggregate total must fit the existing signed 32-bit database columns (maximum 2,147,483,647 minor units). Invalid values and overflow return HTTP 400 without financial writes. Items and totals use the same validated amounts.

No schema migration or live payroll data changes were made. Existing draft and finalized runs are unchanged.

## Verification

- Focused HR and payroll suite: 16 passed. Tests cover invalid monetary types/values, aggregate overflow, the exact maximum total, explicit zero salary, missing/foreign position references and absence of writes on validation failures.
- Full backend suite: 463 passed, one intentional live-database skip, zero failures.
- Backend production build, targeted lint, formatting and diff checks: passed.

## Remaining work

SEC-001 remains in progress. Live transaction/concurrency verification, existing-draft reconciliation before finalization, payroll audit coverage and remaining module/compliance audits remain outstanding. These tests use persistence doubles.

See [HR API contract](../backend/hr-administration-api.md).
