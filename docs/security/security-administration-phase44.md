# SEC-001 Phase 44: payroll finalization reconciliation

Date: 2026-09-10

Finalization now reconciles stored payroll items and totals before changing a scoped draft. It validates integer monetary bounds, deduction arithmetic, pending item status, unique employees and employee school ownership. An authenticated actor is required. The status transition and audit entry share a serializable transaction; serialization conflicts return 409 and audit failures propagate without committing finalization.

Six focused regression tests cover successful net-pay reconciliation, invalid drafts, missing runs, lost conditional updates, transactional audit failure, serialization conflicts, missing actors and zero-pay drafts. These tests use persistence doubles, not a live database. No schema or live payroll data changes were made.

The existing academic setup and examination UI changes were retained. Verification exposed and corrected the academic-year selector's accessible name by separating its label from help text and its prerequisite action.

SEC-001 remains IN_PROGRESS. Live database race verification, payroll creation audit coverage and the remaining module and compliance audits are outstanding. Dependent roadmap tasks remain blocked and are not represented as complete.
