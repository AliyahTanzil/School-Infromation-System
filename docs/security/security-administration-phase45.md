# SEC-001 Phase 45: payroll creation audit

Date: 2026-09-10

Payroll draft creation requires an authenticated actor and writes its CREATE audit record inside the existing run/item transaction. The audit stores the school, DRAFT status, validated total and item count, including empty payrolls. The service only copies period dates from the payload; caller-supplied actor, identifiers, ownership, processing timestamps, status and totals cannot override server-derived fields.

Four new regression tests verify controller-derived identity, allowed persistence fields, empty-draft auditing, missing actor rejection and failures at run, item, audit and commit stages. The focused HR/payroll suite passes all 21 tests. Transaction atomicity is tested with persistence doubles; this is not evidence of live PostgreSQL concurrency behavior.

No schema migration or live payroll changes were made. SEC-001 remains IN_PROGRESS for live transaction verification and remaining module/compliance audits.

Verification: full backend suite 476 passed, one intentional live-database skip; backend production build, targeted lint, formatting and diff checks passed.
