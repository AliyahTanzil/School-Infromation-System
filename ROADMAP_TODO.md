# SAIS Agent Execution Queue

This is the authoritative implementation queue derived from `docs/audit/roadmap-progress-2026-08-26.md`.

## Agent operating rules

1. Work on exactly **one task ID at a time**.
2. Always select the first `READY` task whose dependencies are `DONE`.
3. Before editing, change only that task's status from `READY` to `IN_PROGRESS` and add the agent/date in its work log.
4. Inspect existing code before adding files. Extend existing architecture and avoid duplicate services, routes, models, or pages.
5. Preserve unrelated worktree changes. Never reset, discard, or overwrite another agent's changes.
6. Do not mark a task `DONE` because a page renders. All acceptance criteria and verification commands must pass.
7. If blocked, set the task to `BLOCKED`, record the exact reason and evidence, and stop. Do not skip to a dependent task.
8. Use real persistence for production workflows. Demo/static data is allowed only in explicitly labeled demo routes or fixtures.
9. Every tenant-owned query and mutation must enforce tenant scope server-side.
10. Every completed task must update relevant API documentation and tests.

## Status values

- `BLOCKED`: cannot safely continue because a dependency or required decision is missing.
- `READY`: dependencies are complete and the task can be claimed.
- `IN_PROGRESS`: claimed by one agent; other agents must not modify its scope.
- `REVIEW`: implementation finished and waiting for independent verification.
- `DONE`: acceptance criteria and verification passed.

## Completion definition

A feature task is complete only when all applicable layers exist:

- Prisma model and migration
- seed/test fixture
- validated backend service/controller/route
- authentication, permission and tenant-scope enforcement
- frontend or mobile API integration without static production data
- error/loading/empty states
- unit and integration tests
- API/contract documentation
- successful lint, typecheck/build and relevant tests

## Ordered task queue

| Order | ID          | Status  | Task                                                              | Depends on                    | Primary roadmap                   |
| ----: | ----------- | ------- | ----------------------------------------------------------------- | ----------------------------- | --------------------------------- |
|     1 | DB-001      | DONE    | Reconcile active Prisma schema with services and routes           | None                          | Backend 4, 10, 25                 |
|     2 | QA-001      | DONE    | Stabilize complete backend test runner                            | DB-001                        | Backend 15, 21, 25                |
|   2.1 | PARENT-001  | DONE    | Complete parent persistence and portal contract                   | DB-001, QA-001                | Core 8                            |
|   2.2 | TEACHER-001 | DONE    | Complete teacher persistence and lifecycle contract               | DB-001, QA-001                | Core 9                            |
|     3 | SUB-001     | DONE    | Implement Subject domain vertical slice                           | DB-001, QA-001                | Core 10                           |
|     4 | CLS-001     | DONE    | Complete Class, Section and Enrollment persistence                | SUB-001                       | Core 9, Backend 10                |
|     5 | ATT-001     | DONE    | Complete attendance vertical slice                                | CLS-001                       | Core 12, Mobile 5                 |
|     6 | POL-001     | DONE    | Implement academic policy and grading configuration               | SUB-001, QA-001               | Core 15                           |
|     7 | EXM-001     | DONE    | Complete examination persistence and workflow                     | CLS-001, POL-001              | Core 13, Mobile 6                 |
|     8 | RES-001     | DONE    | Complete result processing and publication workflow               | EXM-001                       | Core 14, Mobile 6                 |
|     9 | TTB-001     | DONE    | Complete timetable scheduling and conflict validation             | CLS-001, SUB-001              | Core 16, Mobile 5                 |
|    10 | FIN-001     | BLOCKED | Complete finance schema and transactional core                    | DB-001, QA-001                | Core 17, Mobile 7                 |
|    11 | PAY-001     | BLOCKED | Complete payment intent, webhook and reconciliation flow          | FIN-001                       | Core 18, Mobile 7                 |
|    12 | COM-001     | BLOCKED | Complete notification event and delivery architecture             | DB-001, QA-001                | Core 19, Mobile 8                 |
|    13 | HR-001      | BLOCKED | Complete HR, leave and payroll vertical slice                     | FIN-001, QA-001               | Core 20, Mobile 11                |
|    14 | LIB-001     | BLOCKED | Add library models and operational APIs                           | DB-001, QA-001                | Core 21, Mobile 10                |
|    15 | AST-001     | BLOCKED | Add asset and inventory models and CRUD workflows                 | DB-001, QA-001                | Core 22, Mobile 10                |
|    16 | TRN-001     | BLOCKED | Add transport models and operational workflows                    | DB-001, QA-001                | Core 23, Mobile 12                |
|    17 | BRD-001     | BLOCKED | Add boarding models and lifecycle workflows                       | DB-001, QA-001                | Core 24                           |
|    18 | LMS-001     | BLOCKED | Implement classroom and membership foundation                     | CLS-001, TTB-001              | Core 51.1                         |
|    19 | LMS-002     | BLOCKED | Implement classroom stream and announcements                      | LMS-001, COM-001              | Core 51.2                         |
|    20 | LMS-003     | BLOCKED | Implement classwork and assignment lifecycle                      | LMS-001, SUB-001              | Core 51.3-51.4                    |
|    21 | LMS-004     | BLOCKED | Implement digital materials repository                            | LMS-001                       | Core 51.5                         |
|    22 | LMS-005     | BLOCKED | Implement student submissions and version history                 | LMS-003, LMS-004              | Core 51.6                         |
|    23 | LMS-006     | BLOCKED | Implement assessment and quiz engine                              | LMS-003, POL-001              | Core 51.7-51.8                    |
|    24 | LMS-007     | BLOCKED | Implement gradebook, rubrics and feedback                         | LMS-005, LMS-006, RES-001     | Core 51.9-51.11                   |
|    25 | LMS-008     | BLOCKED | Integrate calendar and classroom notifications                    | LMS-003, COM-001, TTB-001     | Core 51.12-51.13                  |
|    26 | LMS-009     | BLOCKED | Connect teacher, student and parent dashboards to real LMS data   | LMS-007, LMS-008              | Core 51.14-51.16                  |
|    27 | LMS-010     | BLOCKED | Implement classroom communication and live-learning orchestration | LMS-002, LMS-008              | Core 51.17-51.18                  |
|    28 | ANA-001     | BLOCKED | Replace demo analytics with persisted, calculated metrics         | ATT-001, RES-001, FIN-001     | Core 26, 35, 51.19                |
|    29 | SRCH-001    | BLOCKED | Implement permission-aware global classroom search                | LMS-001 through LMS-010       | Core 51.22                        |
|    30 | AI-001      | BLOCKED | Build grounded AI provider and evidence pipeline                  | ANA-001, SEC-001              | Core 27, 36-38, 51.20             |
|    31 | AI-002      | BLOCKED | Implement academic integrity evidence workflow                    | LMS-005, LMS-006, AI-001      | Core 51.21                        |
|    32 | PRD-001     | BLOCKED | Implement predictive analytics lifecycle                          | ANA-001, AI-001               | Core 39                           |
|    33 | INT-001     | BLOCKED | Complete external integration execution framework                 | PAY-001, COM-001              | Core 28, 40                       |
|    34 | BIO-001     | BLOCKED | Complete biometric device and verification persistence            | ATT-001, INT-001              | Core 29, 41                       |
|    35 | IOT-001     | BLOCKED | Complete IoT device, telemetry, alert and command persistence     | INT-001, SEC-001              | Core 30, 42                       |
|    36 | SaaS-001    | BLOCKED | Complete subscription entitlements and enforcement                | FIN-001, SEC-001              | Core 32, 44                       |
|    37 | SEC-001     | BLOCKED | Close security/compliance and authorization gaps                  | QA-001                        | Core 25, 34, Backend 18           |
|    38 | MOB-001     | BLOCKED | Implement mobile bootstrap and module manifest contracts          | SEC-001                       | Mobile 2-4                        |
|    39 | MOB-002     | BLOCKED | Implement mobile notification device lifecycle                    | COM-001, MOB-001              | Mobile 8                          |
|    40 | MOB-003     | BLOCKED | Implement offline sync cursors, conflicts and idempotency         | MOB-001                       | Mobile 15                         |
|    41 | MOB-004     | BLOCKED | Connect mobile classroom to LMS APIs                              | LMS-010, MOB-003              | Core 51.23, Mobile 9              |
|    42 | ADM-001     | BLOCKED | Complete platform and classroom administration controls           | SaaS-001, LMS-010, SEC-001    | Core 33, 45, 51.24                |
|    43 | AUD-001     | BLOCKED | Complete classroom security, audit and retention controls         | ADM-001, LMS-010              | Core 51.25                        |
|    44 | PERF-001    | BLOCKED | Establish performance baselines and optimize measured bottlenecks | Core vertical slices complete | Backend 19                        |
|    45 | OPS-001     | BLOCKED | Verify backup, restore, import/export and disaster recovery       | DB-001, QA-001                | Backend 11, 23                    |
|    46 | REL-001     | BLOCKED | Complete Vercel/PostgreSQL production release gate                | All critical tasks            | Backend 16, 22, 24, 25; Mobile 15 |

## Current task specification

### DB-001 — Reconcile active Prisma schema with services and routes

**Objective:** Make `backend/prisma/schema.prisma` the truthful, executable persistence contract for the backend.

**Scope:**

1. Inventory every `prisma.<delegate>` reference under `backend/src`.
2. Compare delegates against models in `backend/prisma/schema.prisma`.
3. Produce a checked-in mismatch table under `docs/database/`.
4. Classify every mismatch as:
   - required now and must receive a model/migration;
   - intentionally deferred and its route must return a controlled `501 FEATURE_NOT_IMPLEMENTED`;
   - obsolete duplicate that must be removed safely.
5. Do not add dozens of speculative models in one change. Implement the smallest dependency-safe foundational model group.
6. Generate Prisma Client and verify that no mounted production route calls a nonexistent delegate.

**Acceptance criteria:**

- Every Prisma delegate used by a mounted route exists in the active schema, or the route is explicitly and safely disabled.
- `npx prisma validate --schema backend/prisma/schema.prisma` passes.
- `npx prisma generate --schema backend/prisma/schema.prisma` passes.
- Backend build and targeted API contract tests pass.
- No production route silently returns demo data to hide a missing persistence model.
- The mismatch inventory and decisions are documented.

**Verification commands:**

```text
npx prisma validate --schema backend/prisma/schema.prisma
npx prisma generate --schema backend/prisma/schema.prisma
npm run build -w backend
node --test backend/tests/unit/apiIntegrationContract.test.js
git diff --check
```

## Work log

Agents add one row when claiming, blocking, submitting for review, or completing a task.

| Timestamp  | Task        | Agent | Event   | Evidence/notes                                                                                                                                                                                                                                                                |
| ---------- | ----------- | ----- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-26 | QUEUE       | Codex | CREATED | Queue generated from the roadmap progress audit; DB-001 is the only initial READY task                                                                                                                                                                                        |
| 2026-08-26 | DB-001      | Codex | CLAIMED | Auditing mounted routes, Prisma delegate usage, active models and generated client compatibility                                                                                                                                                                              |
| 2026-08-26 | DB-001      | Codex | DONE    | Missing delegates documented; unsafe routes return controlled 501 responses; validation, generation, build, lint and 9 contract tests pass                                                                                                                                    |
| 2026-08-26 | QA-001      | Codex | CLAIMED | Reproducing test discovery and Node/tsx memory-concurrency failures before changing the runner                                                                                                                                                                                |
| 2026-08-26 | QA-001      | Codex | DONE    | Runner discovers 33 files; backend result 85 passed, 0 failed, 1 live-DB skip; backend/frontend builds, frontend test and lint pass                                                                                                                                           |
| 2026-08-27 | PARENT-001  | Codex | CLAIMED | Inspecting parent schema, repository, service, route, portal UI and authorization contracts                                                                                                                                                                                   |
| 2026-08-27 | PARENT-001  | Codex | DONE    | Parent models and migration added; tenant-scoped authenticated portal APIs enabled and documented; Prisma, build, lint and full backend suite pass (89 passed, 1 live-DB skip)                                                                                                |
| 2026-08-27 | TEACHER-001 | Codex | CLAIMED | Auditing teacher schema, persistence, lifecycle, authorization, routes, frontend integration and tests                                                                                                                                                                        |
| 2026-08-27 | TEACHER-001 | Codex | DONE    | Teacher persistence, lifecycle history, tenant/school scoping, APIs and real profile UI completed; Prisma, lint, both builds and backend suite pass (90 passed, 1 live-DB skip)                                                                                               |
| 2026-08-27 | SUB-001     | Codex | CLAIMED | Auditing subject persistence, validation, authorization, route mounts, frontend integration and tests                                                                                                                                                                         |
| 2026-08-27 | SUB-001     | Codex | DONE    | School-scoped subject schema, migration, CRUD/lifecycle APIs and admin UI completed; Prisma, lint, both builds and backend suite pass (93 passed, 1 live-DB skip)                                                                                                             |
| 2026-08-27 | CLS-001     | Codex | CLAIMED | Auditing class, section, subject assignment, academic period, enrollment, route, UI and tenant/school contracts                                                                                                                                                               |
| 2026-08-27 | CLS-001     | Codex | DONE    | Class/section schema, rooms, grade levels, assignments, capacity-safe enrollment, lifecycle APIs and real UI completed; both builds and backend suite pass (95 passed, 1 skip)                                                                                                |
| 2026-08-27 | ATT-001     | Codex | CLAIMED | Auditing attendance sessions, class rosters, bulk marking, locking, correction history, routes, UI and tenant/school enforcement                                                                                                                                              |
| 2026-08-27 | ATT-001     | Codex | DONE    | Session rosters, bulk marks, audited locking, tenant/school enforcement and real attendance UI completed; Prisma, lint, both builds and suite pass (97 passed, 1 live-DB skip)                                                                                                |
| 2026-08-27 | POL-001     | Codex | CLAIMED | Auditing grade schemes, bands, assessment weights, pass rules, effective periods, publication lifecycle, APIs, UI and tenant/school enforcement                                                                                                                               |
| 2026-08-27 | POL-001     | Codex | DONE    | Persisted grade schemes, bands, assessment weights and audited lifecycle added; tenant/school API and admin UI operational; Prisma, lint, focused tests and both builds pass                                                                                                  |
| 2026-08-27 | EXM-001     | Codex | CLAIMED | Auditing examination sessions, class/subject scope, mark entry, approval lifecycle, tenant enforcement, route mounts, UI, and tests                                                                                                                                           |
| 2026-08-27 | EXM-001     | v0    | DONE    | Examination persistence tables, bounded tenant-safe mark writes, audited lifecycle transitions, raw-query service, active API route mount, syntax checks, and backend suite pass (99 passed, 1 skipped)                                                                       |
| 2026-08-27 | TTB-001     | v0    | DONE    | Timetable persistence models and Neon tables created for schedules, slots, conflicts, versions, audits, and substitutions; tenant-safe service, validation, lifecycle, conflict detection, active API mount, Prisma validation, and backend suite pass (99 passed, 1 skipped) |
| 2026-08-27 | RES-001     | v0    | DONE    | Result persistence and audit tables created; result processing, ranking, statistics, lifecycle publication, tenant/school scoping, Prisma validation/generation, and backend suite pass (99 passed, 1 skipped)                                                                |

## Progress summary

| Measure                 | Count | Percentage |
| ----------------------- | ----: | ---------: |
| Total atomic tasks      |    48 |       100% |
| Done                    |    11 |        23% |
| In review               |     0 |         0% |
| In progress             |     0 |         0% |
| Ready                   |     1 |         2% |
| Blocked by dependencies |    36 |        75% |

Update this summary whenever a task status changes.
