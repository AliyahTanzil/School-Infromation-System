# SAIS Project Development Progress

## Phase 0 environment recovery — 2026-09-01

- Prisma CLI and Client upgraded together from 5.22.0 to 6.19.0.
- Prisma Client generation and schema validation pass.
- Runtime connectivity to the configured Neon PostgreSQL database is verified.
- All 29 checked-in migrations are applied successfully.
- The configured application owner is provisioned idempotently and real authentication succeeds as `APPLICATION_MANAGER` / `OWNER`.
- The transactional single-school development bootstrap creates current-schema school-admin, teacher, student, and parent accounts plus teacher/parent/student domain links.
- All four development roles authenticate successfully with their expected role claims.
- Verification baseline remains green: lint passes, backend tests report 182 passed and 1 intentional live-database skip, frontend tests report 2 passed, and backend/frontend production builds pass.
- Remaining Phase 0 gap: verify refresh, logout, password recovery, and protected-route navigation through browser-level tests and consolidate the setup/recovery runbook.

Last updated: 2026-09-01

This file tracks the implementation progress of the SAIS platform. `ROADMAP_TODO.md` remains the authoritative execution queue; update both files whenever a task status changes.

## Tracked task claims

> Reconciliation notice: rows EXM-001 through LMS-005 were imported from V0 and are retained as implementation evidence, but their authoritative status is `REVIEW`, not `DONE`. They do not yet satisfy the repository completion definition. See `docs/audit/v0-change-reconciliation-2026-08-27.md`.

| Order | ID          | Status      | Summary                                                                                                                                                                                                                                                                                       |
| ----: | ----------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|     1 | DB-001      | DONE        | Reconciled active Prisma schema, services, routes, and controlled unavailable features.                                                                                                                                                                                                       |
|     2 | QA-001      | DONE        | Stabilized the backend test runner and verification workflow.                                                                                                                                                                                                                                 |
|   2.1 | PARENT-001  | DONE        | Completed parent persistence and portal contract.                                                                                                                                                                                                                                             |
|   2.2 | TEACHER-001 | DONE        | Completed teacher persistence and lifecycle contract.                                                                                                                                                                                                                                         |
|     3 | SUB-001     | DONE        | Completed subject domain persistence, CRUD, lifecycle APIs, and admin UI.                                                                                                                                                                                                                     |
|     4 | CLS-001     | DONE        | Completed classes, sections, rooms, assignments, and enrollment workflows.                                                                                                                                                                                                                    |
|     5 | ATT-001     | DONE        | Completed attendance rosters, bulk marking, locking, auditing, and UI.                                                                                                                                                                                                                        |
|     6 | POL-001     | DONE        | Completed grading schemes, bands, weights, pass rules, and lifecycle APIs.                                                                                                                                                                                                                    |
|     7 | EXM-001     | DONE        | Completed examination persistence, mark writes, lifecycle transitions, audits, and API mounting.                                                                                                                                                                                              |
|     8 | RES-001     | DONE        | Completed result persistence, processing, ranking, publication, and audit workflow.                                                                                                                                                                                                           |
|     9 | TTB-001     | DONE        | Added timetable, slots, schedule entries, conflicts, versions, audits, and substitutions.                                                                                                                                                                                                     |
|    10 | FIN-001     | DONE        | Added finance fees, invoices, payments, and ledger transaction persistence.                                                                                                                                                                                                                   |
|    11 | PAY-001     | DONE        | Added payment intents, payment attempts, and idempotent gateway webhook persistence.                                                                                                                                                                                                          |
|    12 | COM-001     | DONE        | Added notification events, deliveries, preferences, tenant-scoped service, and active routes.                                                                                                                                                                                                 |
|    13 | HR-001      | DONE        | Added employees, HR departments and positions, leave requests, payroll runs/items, and active HR routes; Prisma validation, syntax checks, backend tests, and Neon table verification passed.                                                                                                 |
|    14 | LIB-001     | DONE        | Activated tenant-scoped library overview, catalog search, and loans APIs; Prisma validation, syntax checks, backend suite, and diff checks passed.                                                                                                                                            |
|    15 | AST-001     | DONE        | Activated tenant-scoped assets and inventory overview/search APIs; Prisma validation, syntax checks, backend suite, and diff checks passed.                                                                                                                                                   |
|    16 | TRN-001     | DONE        | Added transport vehicles, drivers, routes, stops, trips, inspections, active API mounting, and database persistence; validation and backend suite passed.                                                                                                                                     |
|    17 | BRD-001     | DONE        | Completed dormitory, room, bed, application approval, allocation and checkout persistence, authenticated APIs, and operational UI; full suite passes (146 passed, 1 skipped).                                                                                                                 |
|    18 | LMS-001     | DONE        | Added distinct digital-classroom and membership persistence, relational constraints, scoped lifecycle APIs on both mounts, and an operational classroom UI; full suite passes (151 passed, 1 skipped).                                                                                        |
|    19 | LMS-002     | DONE        | Added migrated classroom announcements, posts and comments with membership-aware authorization, validated APIs on both mounts, and operational stream UI; full suite passes (156 passed, 1 skipped).                                                                                          |
|    20 | LMS-003     | DONE        | Added migrated digital-classroom assignments with optional school-scoped subjects, membership-aware reads, teacher/admin lifecycle controls, operational classwork UI, documentation, and passing verification (161 passed, 1 skipped).                                                       |
|    21 | LMS-004     | DONE        | Added relational classroom materials, private authenticated upload/download delivery, member/teacher authorization, archive lifecycle, both active mounts, operational UI, migration, documentation, and passing verification (166 passed, 1 skipped).                                        |
|    22 | LMS-005     | DONE        | Added authenticated student-owned submissions, assignment/classroom authorization, immutable serializable versions, controlled submit/retract lifecycle, same-classroom attachments, both API mounts, live UI, migration, docs, and passing verification (172 passed, 1 skipped).             |
|    23 | LMS-006     | DONE        | Added policy-linked quiz authoring, immutable published questions, protected answer keys, lifecycle controls, timed and limited student attempts, autosave, server scoring, both active mounts, shared live assessment UI, migration, docs, and passing verification (177 passed, 1 skipped). |
|    24 | LMS-007     | IN_PROGRESS | Activated tenant-scoped rubric, submission-grade, feedback, and release APIs and replaced the static gradebook roster with live classroom, assignment, and submission data. Rubric-management and released-feedback UI remain before completion.                                              |

## Current progress

| Measure                 | Count | Percentage |
| ----------------------- | ----: | ---------: |
| Total atomic tasks      |    48 |       100% |
| Done                    |    25 |        52% |
| In review               |     0 |         0% |
| In progress             |     1 |         2% |
| Ready                   |     1 |         2% |
| Blocked by dependencies |    21 |        44% |

## Next work

LMS-007 is in progress. Its persisted gradebook API and teacher marking surface are active; rubric management and released student/parent feedback views are next.

## Verification baseline

Completed vertical slices have been checked with Prisma validation/generation, JavaScript syntax checks, backend tests, and `git diff --check` where applicable. Before declaring future work complete, run the relevant focused tests plus the full project validation suite.

## Update rule

Whenever implementation proceeds:

1. Update the task status and work log in `ROADMAP_TODO.md`.
2. Update this file's completed/current progress section.
3. Record verification evidence.
4. Commit and push both tracking and implementation changes together.
5. Keep this file synchronized with the authoritative roadmap.
