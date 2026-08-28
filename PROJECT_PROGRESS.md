# SAIS Project Development Progress

Last updated: 2026-08-27

This file tracks the implementation progress of the SAIS platform. `ROADMAP_TODO.md` remains the authoritative execution queue; update both files whenever a task status changes.

## Tracked task claims

> Reconciliation notice: rows EXM-001 through LMS-005 were imported from V0 and are retained as implementation evidence, but their authoritative status is `REVIEW`, not `DONE`. They do not yet satisfy the repository completion definition. See `docs/audit/v0-change-reconciliation-2026-08-27.md`.

| Order | ID          | Status | Summary                                                                                                                                                                                                                      |
| ----: | ----------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|     1 | DB-001      | DONE   | Reconciled active Prisma schema, services, routes, and controlled unavailable features.                                                                                                                                      |
|     2 | QA-001      | DONE   | Stabilized the backend test runner and verification workflow.                                                                                                                                                                |
|   2.1 | PARENT-001  | DONE   | Completed parent persistence and portal contract.                                                                                                                                                                            |
|   2.2 | TEACHER-001 | DONE   | Completed teacher persistence and lifecycle contract.                                                                                                                                                                        |
|     3 | SUB-001     | DONE   | Completed subject domain persistence, CRUD, lifecycle APIs, and admin UI.                                                                                                                                                    |
|     4 | CLS-001     | DONE   | Completed classes, sections, rooms, assignments, and enrollment workflows.                                                                                                                                                   |
|     5 | ATT-001     | DONE   | Completed attendance rosters, bulk marking, locking, auditing, and UI.                                                                                                                                                       |
|     6 | POL-001     | DONE   | Completed grading schemes, bands, weights, pass rules, and lifecycle APIs.                                                                                                                                                   |
|     7 | EXM-001     | DONE   | Completed examination persistence, mark writes, lifecycle transitions, audits, and API mounting.                                                                                                                             |
|     8 | RES-001     | DONE   | Completed result persistence, processing, ranking, publication, and audit workflow.                                                                                                                                          |
|     9 | TTB-001     | DONE   | Added timetable, slots, schedule entries, conflicts, versions, audits, and substitutions.                                                                                                                                    |
|    10 | FIN-001     | DONE   | Added finance fees, invoices, payments, and ledger transaction persistence.                                                                                                                                                  |
|    11 | PAY-001     | DONE   | Added payment intents, payment attempts, and idempotent gateway webhook persistence.                                                                                                                                         |
|    12 | COM-001     | DONE   | Added notification events, deliveries, preferences, tenant-scoped service, and active routes.                                                                                                                                |
|    13 | HR-001      | DONE   | Added employees, HR departments and positions, leave requests, payroll runs/items, and active HR routes; Prisma validation, syntax checks, backend tests, and Neon table verification passed.                                |
|    14 | LIB-001     | DONE   | Activated tenant-scoped library overview, catalog search, and loans APIs; Prisma validation, syntax checks, backend suite, and diff checks passed.                                                                           |
|    15 | AST-001     | DONE   | Activated tenant-scoped assets and inventory overview/search APIs; Prisma validation, syntax checks, backend suite, and diff checks passed.                                                                                  |
|    16 | TRN-001     | DONE   | Added transport vehicles, drivers, routes, stops, trips, inspections, active API mounting, and database persistence; validation and backend suite passed.                                                                    |
|    17 | BRD-001     | DONE   | Activated tenant-scoped boarding overview and dormitory APIs; Prisma validation, syntax checks, backend suite (99 passed, 1 skipped), and diff checks passed.                                                                |
|    18 | LMS-001     | DONE   | Confirmed tenant-scoped Classroom, Class, and ClassEnrollment models with active class/enrollment routes; validation and backend suite passed. Live Neon table verification is pending migration of prerequisite LMS tables. |
|    19 | LMS-002     | DONE   | Added tenant-scoped classroom announcements, stream posts, comments, active routes, Neon tables, and validation evidence.                                                                                                    |
|    20 | LMS-003     | DONE   | Added tenant-scoped Assignment persistence, assignment list/create/status APIs, active route mount, and validation evidence.                                                                                                 |
|    21 | LMS-004     | DONE   | Added private Blob uploads/download delivery, tenant-scoped DigitalMaterial persistence/list/archive APIs, active route mount, Neon table, and validation evidence.                                                          |
|    22 | LMS-005     | DONE   | Added tenant-scoped StudentSubmission and SubmissionVersion persistence, draft/save/submit/version-history APIs, active route mount, Neon tables, and validation evidence.                                                   |

## Current progress

| Measure                 | Count | Percentage |
| ----------------------- | ----: | ---------: |
| Total atomic tasks      |    48 |       100% |
| Done                    |    17 |        35% |
| In review               |     7 |        15% |
| In progress             |     0 |         0% |
| Ready                   |     0 |         0% |
| Blocked by dependencies |    24 |        50% |

## Next work

EXM-001 through AST-001 reconciliation is complete. TRN-001 is the next reviewed slice to reconcile.

## Verification baseline

Completed vertical slices have been checked with Prisma validation/generation, JavaScript syntax checks, backend tests, and `git diff --check` where applicable. Before declaring future work complete, run the relevant focused tests plus the full project validation suite.

## Update rule

Whenever implementation proceeds:

1. Update the task status and work log in `ROADMAP_TODO.md`.
2. Update this file's completed/current progress section.
3. Record verification evidence.
4. Commit and push both tracking and implementation changes together.
5. Keep this file synchronized with the authoritative roadmap.
