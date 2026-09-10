# SEC-001 Phase 49: transactional library circulation audits

Borrowing and returning now require authenticated actor identity before database access. The controller takes that identity from req.user.id and cannot accept body or school-context actor overrides. Both operations insert LibraryLoan audit evidence within the copy/loan transaction, recording tenant, actor, school, library, copy, borrower and status transition. Audit failures abort the entire transaction.

Regression coverage verifies actor enforcement, controller identity provenance, persisted loan identity, audit creation and rollback on audit failure alongside existing stale-return and scoped-reference checks. Tests use persistence doubles; live PostgreSQL rollback and race verification remain outstanding.

SEC-001 remains IN_PROGRESS for borrower identity semantics and eligibility, live verification and the remaining module/compliance audit. See the [library API contract](../backend/library-administration-api.md).

Verification: Focused library suite: 24 passed. Full backend: 496 passed, one intentional live-database skip. Backend build, targeted lint, formatting and diff checks pass.
