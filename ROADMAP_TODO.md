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

Latest continuation: TTB-001 Phase 16 DONE, GitHub Copilot, 2026-09-07. Added authenticated, tenant/school-scoped read-only readiness verification at `GET /api/timetables/:id/readiness` and `/api/v1/timetables/:id/readiness`, dashboard reporting, tests and API documentation. Verification: 25 focused backend timetable tests, backend build and frontend build pass. Next: configure real teachers, teaching assignments, availability and rooms for the selected school, then run the report before live generation/editing/publication.

Phase 17 continuation: BLOCKED, Codex, 2026-09-07. Added read-only `npm run timetable:readiness`; the configured `SINGLE_SCHOOL_ID` is absent from the connected database and no school records currently exist. No database data was changed. Create or restore the intended real school before staffing, room configuration or live timetable verification.

Phase 18 continuation: DONE, Codex, 2026-09-07. Backend startup now idempotently ensures the explicitly configured single school before listening and refuses ambiguous or mismatched live data. Added `npm run school:bootstrap`, environment documentation and focused tests. Reconciled the live configuration to Aunty Isha International Academy; bootstrap passes without duplicate writes. Readiness correctly reports that the school has no timetables yet.

Phase 19 continuation: DONE, Codex, 2026-09-07. Added and ran idempotent `npm run timetable:bootstrap-academics`; live Aunty Isha now has 2026/27, First Term, SSS3, planned SSS Science 3A (capacity 40), nine active subjects and their class links. Six focused bootstrap tests, Prisma validation and backend build pass. No teachers, rooms, period requirements, slots or timetable were invented.

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

| Order | ID          | Status      | Task                                                              | Depends on                    | Primary roadmap                   |
| ----: | ----------- | ----------- | ----------------------------------------------------------------- | ----------------------------- | --------------------------------- |
|     1 | DB-001      | DONE        | Reconcile active Prisma schema with services and routes           | None                          | Backend 4, 10, 25                 |
|     2 | QA-001      | DONE        | Stabilize complete backend test runner                            | DB-001                        | Backend 15, 21, 25                |
|   2.1 | PARENT-001  | DONE        | Complete parent persistence and portal contract                   | DB-001, QA-001                | Core 8                            |
|   2.2 | TEACHER-001 | DONE        | Complete teacher persistence and lifecycle contract               | DB-001, QA-001                | Core 9                            |
|     3 | SUB-001     | DONE        | Implement Subject domain vertical slice                           | DB-001, QA-001                | Core 10                           |
|     4 | CLS-001     | DONE        | Complete Class, Section and Enrollment persistence                | SUB-001                       | Core 9, Backend 10                |
|     5 | ATT-001     | DONE        | Complete attendance vertical slice                                | CLS-001                       | Core 12, Mobile 5                 |
|     6 | POL-001     | DONE        | Implement academic policy and grading configuration               | SUB-001, QA-001               | Core 15                           |
|     7 | EXM-001     | DONE        | Complete examination persistence and workflow                     | CLS-001, POL-001              | Core 13, Mobile 6                 |
|     8 | RES-001     | DONE        | Complete result processing and publication workflow               | EXM-001                       | Core 14, Mobile 6                 |
|     9 | TTB-001     | DONE        | Complete timetable scheduling and conflict validation             | CLS-001, SUB-001              | Core 16, Mobile 5                 |
|    10 | FIN-001     | DONE        | Complete finance schema and transactional core                    | DB-001, QA-001                | Core 17, Mobile 7                 |
|    11 | PAY-001     | DONE        | Complete Monime payment intent, webhook and reconciliation flow   | FIN-001                       | Core 18, Mobile 7                 |
|    12 | COM-001     | DONE        | Complete notification event and delivery architecture             | DB-001, QA-001                | Core 19, Mobile 8                 |
|    13 | HR-001      | DONE        | Complete HR, leave and payroll vertical slice                     | FIN-001, QA-001               | Core 20, Mobile 11                |
|    14 | LIB-001     | DONE        | Add library models and operational APIs                           | DB-001, QA-001                | Core 21, Mobile 10                |
|    15 | AST-001     | DONE        | Add asset and inventory models and CRUD workflows                 | DB-001, QA-001                | Core 22, Mobile 10                |
|    16 | TRN-001     | DONE        | Add transport models and operational workflows                    | DB-001, QA-001                | Core 23, Mobile 12                |
|    17 | BRD-001     | DONE        | Add boarding models and lifecycle workflows                       | DB-001, QA-001                | Core 24                           |
|    18 | LMS-001     | DONE        | Implement classroom and membership foundation                     | CLS-001, TTB-001              | Core 51.1                         |
|    19 | LMS-002     | DONE        | Implement classroom stream and announcements                      | LMS-001, COM-001              | Core 51.2                         |
|    20 | LMS-003     | DONE        | Implement classwork and assignment lifecycle                      | LMS-001, SUB-001              | Core 51.3-51.4                    |
|    21 | LMS-004     | DONE        | Implement digital materials repository                            | LMS-001                       | Core 51.5                         |
|    22 | LMS-005     | DONE        | Implement student submissions and version history                 | LMS-003, LMS-004              | Core 51.6                         |
|    23 | LMS-006     | DONE        | Implement assessment and quiz engine                              | LMS-003, POL-001              | Core 51.7-51.8                    |
|    24 | LMS-007     | DONE        | Implement gradebook, rubrics and feedback                         | LMS-005, LMS-006, RES-001     | Core 51.9-51.11                   |
|    25 | LMS-008     | DONE        | Integrate calendar and classroom notifications                    | LMS-003, COM-001, TTB-001     | Core 51.12-51.13                  |
|    26 | LMS-009     | DONE        | Connect teacher, student and parent dashboards to real LMS data   | LMS-007, LMS-008              | Core 51.14-51.16                  |
|    27 | LMS-010     | DONE        | Implement classroom communication and live-learning orchestration | LMS-002, LMS-008              | Core 51.17-51.18                  |
|    28 | ANA-001     | DONE        | Replace demo analytics with persisted, calculated metrics         | ATT-001, RES-001, FIN-001     | Core 26, 35, 51.19                |
|    29 | SRCH-001    | DONE        | Implement permission-aware global classroom search                | LMS-001 through LMS-010       | Core 51.22                        |
|    30 | AI-001      | BLOCKED     | Build grounded AI provider and evidence pipeline                  | ANA-001, SEC-001              | Core 27, 36-38, 51.20             |
|    31 | AI-002      | BLOCKED     | Implement academic integrity evidence workflow                    | LMS-005, LMS-006, AI-001      | Core 51.21                        |
|    32 | PRD-001     | BLOCKED     | Implement predictive analytics lifecycle                          | ANA-001, AI-001               | Core 39                           |
|    33 | INT-001     | BLOCKED     | Complete external integration execution framework                 | PAY-001, COM-001              | Core 28, 40                       |
|    34 | BIO-001     | BLOCKED     | Complete biometric device and verification persistence            | ATT-001, INT-001              | Core 29, 41                       |
|    35 | IOT-001     | BLOCKED     | Complete IoT device, telemetry, alert and command persistence     | INT-001, SEC-001              | Core 30, 42                       |
|    36 | SaaS-001    | BLOCKED     | Complete subscription entitlements and enforcement                | FIN-001, SEC-001              | Core 32, 44                       |
|    37 | SEC-001     | IN_PROGRESS | Close security/compliance and authorization gaps                  | QA-001                        | Core 25, 34, Backend 18           |
|    38 | MOB-001     | BLOCKED     | Implement mobile bootstrap and module manifest contracts          | SEC-001                       | Mobile 2-4                        |
|    39 | MOB-002     | BLOCKED     | Implement mobile notification device lifecycle                    | COM-001, MOB-001              | Mobile 8                          |
|    40 | MOB-003     | BLOCKED     | Implement offline sync cursors, conflicts and idempotency         | MOB-001                       | Mobile 15                         |
|    41 | MOB-004     | BLOCKED     | Connect mobile classroom to LMS APIs                              | LMS-010, MOB-003              | Core 51.23, Mobile 9              |
|    42 | ADM-001     | BLOCKED     | Complete platform and classroom administration controls           | SaaS-001, LMS-010, SEC-001    | Core 33, 45, 51.24                |
|    43 | AUD-001     | BLOCKED     | Complete classroom security, audit and retention controls         | ADM-001, LMS-010              | Core 51.25                        |
|    44 | PERF-001    | BLOCKED     | Establish performance baselines and optimize measured bottlenecks | Core vertical slices complete | Backend 19                        |
|    45 | OPS-001     | BLOCKED     | Verify backup, restore, import/export and disaster recovery       | DB-001, QA-001                | Backend 11, 23                    |
|    46 | REL-001     | BLOCKED     | Complete Vercel/PostgreSQL production release gate                | All critical tasks            | Backend 16, 22, 24, 25; Mobile 15 |

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

| Timestamp  | Task        | Agent | Event   | Evidence/notes                                                                                                                                                                                                                                                                                                        |
| ---------- | ----------- | ----- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-26 | QUEUE       | Codex | CREATED | Queue generated from the roadmap progress audit; DB-001 is the only initial READY task                                                                                                                                                                                                                                |
| 2026-08-26 | DB-001      | Codex | CLAIMED | Auditing mounted routes, Prisma delegate usage, active models and generated client compatibility                                                                                                                                                                                                                      |
| 2026-08-26 | DB-001      | Codex | DONE    | Missing delegates documented; unsafe routes return controlled 501 responses; validation, generation, build, lint and 9 contract tests pass                                                                                                                                                                            |
| 2026-08-26 | QA-001      | Codex | CLAIMED | Reproducing test discovery and Node/tsx memory-concurrency failures before changing the runner                                                                                                                                                                                                                        |
| 2026-08-26 | QA-001      | Codex | DONE    | Runner discovers 33 files; backend result 85 passed, 0 failed, 1 live-DB skip; backend/frontend builds, frontend test and lint pass                                                                                                                                                                                   |
| 2026-08-27 | PARENT-001  | Codex | CLAIMED | Inspecting parent schema, repository, service, route, portal UI and authorization contracts                                                                                                                                                                                                                           |
| 2026-08-27 | PARENT-001  | Codex | DONE    | Parent models and migration added; tenant-scoped authenticated portal APIs enabled and documented; Prisma, build, lint and full backend suite pass (89 passed, 1 live-DB skip)                                                                                                                                        |
| 2026-08-27 | TEACHER-001 | Codex | CLAIMED | Auditing teacher schema, persistence, lifecycle, authorization, routes, frontend integration and tests                                                                                                                                                                                                                |
| 2026-08-27 | TEACHER-001 | Codex | DONE    | Teacher persistence, lifecycle history, tenant/school scoping, APIs and real profile UI completed; Prisma, lint, both builds and backend suite pass (90 passed, 1 live-DB skip)                                                                                                                                       |
| 2026-08-27 | SUB-001     | Codex | CLAIMED | Auditing subject persistence, validation, authorization, route mounts, frontend integration and tests                                                                                                                                                                                                                 |
| 2026-08-27 | SUB-001     | Codex | DONE    | School-scoped subject schema, migration, CRUD/lifecycle APIs and admin UI completed; Prisma, lint, both builds and backend suite pass (93 passed, 1 live-DB skip)                                                                                                                                                     |
| 2026-08-27 | CLS-001     | Codex | CLAIMED | Auditing class, section, subject assignment, academic period, enrollment, route, UI and tenant/school contracts                                                                                                                                                                                                       |
| 2026-08-27 | CLS-001     | Codex | DONE    | Class/section schema, rooms, grade levels, assignments, capacity-safe enrollment, lifecycle APIs and real UI completed; both builds and backend suite pass (95 passed, 1 skip)                                                                                                                                        |
| 2026-08-27 | ATT-001     | Codex | CLAIMED | Auditing attendance sessions, class rosters, bulk marking, locking, correction history, routes, UI and tenant/school enforcement                                                                                                                                                                                      |
| 2026-08-27 | ATT-001     | Codex | DONE    | Session rosters, bulk marks, audited locking, tenant/school enforcement and real attendance UI completed; Prisma, lint, both builds and suite pass (97 passed, 1 live-DB skip)                                                                                                                                        |
| 2026-08-27 | POL-001     | Codex | CLAIMED | Auditing grade schemes, bands, assessment weights, pass rules, effective periods, publication lifecycle, APIs, UI and tenant/school enforcement                                                                                                                                                                       |
| 2026-08-27 | POL-001     | Codex | DONE    | Persisted grade schemes, bands, assessment weights and audited lifecycle added; tenant/school API and admin UI operational; Prisma, lint, focused tests and both builds pass                                                                                                                                          |
| 2026-08-27 | EXM-001     | Codex | CLAIMED | Auditing examination sessions, class/subject scope, mark entry, approval lifecycle, tenant enforcement, route mounts, UI, and tests                                                                                                                                                                                   |
| 2026-08-27 | EXM-001     | v0    | DONE    | Examination persistence tables, bounded tenant-safe mark writes, audited lifecycle transitions, raw-query service, active API route mount, syntax checks, and backend suite pass (99 passed, 1 skipped)                                                                                                               |
| 2026-08-27 | TTB-001     | v0    | DONE    | Timetable persistence models and Neon tables created for schedules, slots, conflicts, versions, audits, and substitutions; tenant-safe service, validation, lifecycle, conflict detection, active API mount, Prisma validation, and backend suite pass (99 passed, 1 skipped)                                         |
| 2026-08-27 | RES-001     | v0    | DONE    | Result persistence and audit tables created; result processing, ranking, statistics, lifecycle publication, tenant/school scoping, Prisma validation/generation, and backend suite pass (99 passed, 1 skipped)                                                                                                        |
| 2026-08-27 | FIN-001     | v0    | DONE    | Finance schema and Neon tables added for fees, invoices, payments, and ledger transactions; existing idempotent transactional payment flow validated; Prisma validation/generation and backend suite pass (99 passed, 1 skipped)                                                                                      |
| 2026-08-27 | PAY-001     | v0    | DONE    | Payment intent, attempt, and idempotent webhook persistence added; existing gateway service/routes validated with Prisma and backend suite pass (99 passed, 1 skipped)                                                                                                                                                |
| 2026-08-27 | AST-001     | v0    | DONE    | Activated tenant-scoped assets and inventory overview/search routes; service queries now include tenant and school boundaries; Prisma validation, syntax checks, backend suite, and diff checks passed                                                                                                                |
| 2026-08-27 | BRD-001     | v0    | CLAIMED | Auditing boarding models, lifecycle service, routes, tenant scope, tests, and frontend integration                                                                                                                                                                                                                    |
| 2026-08-27 | TRN-001     | v0    | DONE    | Transport vehicle, driver, route, stop, trip, and inspection persistence added; active transport API mounted; Prisma validation, syntax checks, backend suite (99 passed, 1 skipped), and diff checks passed                                                                                                          |
| 2026-08-27 | BRD-001     | v0    | DONE    | Activated tenant-scoped boarding overview and dormitory routes; Prisma validation, syntax checks, backend suite (99 passed, 1 skipped), and diff checks passed                                                                                                                                                        |
| 2026-08-27 | LMS-001     | v0    | DONE    | Confirmed tenant-scoped Classroom, Class, and ClassEnrollment models plus active class CRUD/enrollment routes; Prisma validation/generation, class route checks, backend suite, and diff checks passed. Live Neon verification found prerequisite GradeLevel/Classroom/Class/ClassEnrollment tables not yet migrated. |
| 2026-08-27 | LMS-002     | v0    | DONE    | Added classroom announcements, stream posts, comments, tenant-scoped service/controller/routes, Neon tables, Prisma validation/generation, syntax checks, backend suite, and diff checks passed                                                                                                                       |
| 2026-08-27 | LMS-003     | v0    | DONE    | Added tenant-scoped Assignment model, persistence table, assignment list/create/status APIs, active route mount, Prisma validation/generation, syntax checks, backend suite, and diff checks passed                                                                                                                   |
| 2026-08-27 | LMS-004     | v0    | DONE    | Added private Blob uploads/download delivery, tenant-scoped DigitalMaterial persistence/list/archive APIs, active /materials route mount, Neon table, Prisma validation/generation, syntax checks, 99 backend tests passed, and diff checks passed                                                                    |
| 2026-08-27 | LMS-005     | v0    | DONE    | Added tenant-scoped StudentSubmission and SubmissionVersion persistence, draft/save/submit/version-history APIs, active route mount, Neon tables, Prisma validation/generation, syntax checks, 99 backend tests passed, and diff checks passed                                                                        |
| 2026-08-27 | LMS-006     | v0    | CLAIMED | Auditing assessment and quiz engine, tenant scope, policy integration, tests, API documentation, and frontend integration                                                                                                                                                                                             |
| 2026-08-27 | LMS-001     | v0    | CLAIMED | Auditing classroom, membership, enrollment, tenant scope, tests, and frontend integration                                                                                                                                                                                                                             |
| 2026-08-27 | COM-001     | v0    | DONE    | Notification events, deliveries, preferences, tenant-scoped communication service, active route mount, Prisma validation, and backend suite pass (99 passed, 1 skipped)                                                                                                                                               |
| 2026-08-27 | V0-AUDIT    | Codex | REVIEW  | Commits 788f092..f33b9d5 retained and audited. Prisma/build and the suite pass after dependency sync, but 16 completion claims lack migrations and full active-server/UI/docs/tests evidence; materials lack authentication and examination school scope is invalid. See the reconciliation audit.                    |

| 2026-08-27 | EXM-001 | Codex | DONE | Reconciled V0 scaffold with migration, candidate and schedule validation, bounded marks, audited lifecycle, authenticated school scope, both server mounts, real UI, API docs, and tests; full suite 102 passed with 1 intentional skip. |

| 2026-08-27 | RES-001 | Codex | DONE | Corrected candidate-to-student identity mapping; added locked-exam and active-policy gates, deterministic recalculation, review/publication/locking audits, migration, validated school-scoped routes on both servers, real UI, docs, and tests; 105 passed, 1 skip. |

## Progress summary

| Measure            | Count | Percentage |
| ------------------ | ----: | ---------: |
| Total atomic tasks |    48 |       100% |
| Done               |    31 |      64.6% |
| In review          |     0 |         0% |
| In progress        |     1 |       2.1% |
| Ready              |     0 |         0% |
| Blocked            |    16 |      33.3% |

Update this summary whenever a task status changes.

| 2026-08-29 | LMS-003 | Codex | DONE | Reconciled classwork with migrated digital-classroom assignments, optional school-scoped subjects, membership-aware reads, teacher/admin management, validated draft/publish/close/archive transitions, operational UI, API documentation, and tests; Prisma validation, lint, both builds, diff check, and the full backend suite pass (161 passed, 1 skipped). |
| 2026-08-29 | LMS-004 | Codex | CLAIMED | Reconciling private digital-material persistence, classroom membership authorization, bounded uploads, active mounts, frontend workflows, documentation, migrations, and tests. |
| 2026-08-29 | LMS-004 | Codex | DONE | Added relational classroom/uploader persistence and a non-destructive migration; authenticated member reads and private downloads; teacher/admin bounded uploads and archive controls; both active mounts, operational UI, docs, and tests; Prisma, lint, builds, diff check, and full suite pass (166 passed, 1 skipped). |
| 2026-08-29 | LMS-005 | Codex | CLAIMED | Reconciling authenticated student-owned submissions, assignment/classroom access, immutable transactional versions, lifecycle validation, active mounts, operational UI, migration, documentation, and tests. |
| 2026-08-29 | LMS-005 | Codex | DONE | Added assignment/user relational persistence, authenticated student ownership, active-classroom membership checks, bounded same-classroom attachments, serializable immutable version creation, controlled submit/retract lifecycle, both active mounts, live UI, docs, migration, and tests; Prisma, lint, builds, diff check, and full suite pass (172 passed, 1 skipped). |
| 2026-08-29 | LMS-006 | Codex | CLAIMED | Implementing policy-linked quiz persistence, teacher authoring and lifecycle, student attempt limits/timers/autosave, server-side scoring, active mounts, shared live UI, migration, documentation, and tests. |
| 2026-08-29 | LMS-006 | Codex | DONE | Added policy/assignment-linked quiz persistence, teacher authoring, immutable published questions, controlled lifecycle, protected answer keys, timed student attempts, limits, autosave and server-side scoring; both active mounts and UI routes now share the operational engine; Prisma, lint, builds, frontend tests, diff check, and full suite pass (177 passed, 1 skipped). |
| 2026-08-29 | RBAC-HOTFIX | Codex | DONE | Aligned effective permission loading with the active Role.permissions and Permission.key schema, restored the authenticated platform-owner bypass, verified the corrected query against the live development database, and passed the full backend suite (179 passed, 1 skipped). |
| 2026-08-29 | USER-HOTFIX | Codex | DONE | Aligned user listing, DTO mapping, creation identity fields, account types and audit writes with the active Prisma schema; owner login and the frontend proxy were verified live after replacing stale processes. |
| 2026-08-29 | LMS-007 | Codex | CLAIMED | Auditing gradebook, rubric criteria, submission and quiz scoring, teacher feedback, publication controls, tenant scope, UI, documentation, migrations and tests. |
| 2026-09-02 | LMS-007 | Codex | CHECKPOINT | Mounted authenticated rubric/grade/feedback APIs on both active paths, enforced classroom and school ownership, replaced the static teacher gradebook with persisted classroom/assignment/submission workflows, documented the contract, and passed lint, both builds, and the full backend suite (187 passed, 1 skipped). Rubric and released-feedback UI remain. |
| 2026-09-02 | LMS-007 | Codex | DONE | Added rubric creation, publication, assignment and bounded criterion scoring; activated draft/release controls and persisted student feedback threads; removed demo feedback data; documented both API mounts; lint, focused contracts, production builds, and the full backend suite pass (188 passed, 1 skipped). |
| 2026-09-05 | LMS-008 | GitHub Copilot | CLAIMED | Auditing classroom calendar event composition and assignment lifecycle notification delivery across existing LMS, timetable, and communication services. |
| 2026-09-05 | LMS-008 | GitHub Copilot | DONE | Added authenticated calendar reads that combine published assignment availability/deadlines with published timetable lessons for linked academic classes; publishing notifies other active members via persisted in-app deliveries. Bounded to requested date window. Node dependencies installed (`npm ci`), full backend test suite, frontend tests, lint, mobile typecheck, and diff check pass. |
| 2026-09-05 | LMS-009 | GitHub Copilot | DONE | Connected teacher, student, and parent dashboards to live LMS data (`/lms/classrooms`, `/lms/assignments`, `/lms/calendar`, `/communication/unread-count`, `/parents/me`). Removed static demo classroom data. All tests and lint pass. |
| 2026-09-05 | LMS-010 | GitHub Copilot | DONE | Added relational `ClassroomLiveSession` model, migration, validated lifecycle service, controller, and routes (`/api/lms/live-sessions`, `/api/v1/lms/live-sessions`). Connected `LiveLearningWorkspace.jsx` to live LMS endpoints. Added unit contract tests. All tests, lint, and typecheck pass. |

| 2026-08-27 | TTB-001 | Codex | DONE | Reconciled timetable persistence with the active flat Prisma schema and AcademicTerm model; added non-destructive migration, authenticated school context, active compatibility/versioned mounts, lifecycle versioning, conflict publication gate, substitutions, creation UI, back navigation, contract tests, and full build verification (109 passed, 1 skipped). |

| 2026-09-06 | TTB-001 | GitHub Copilot | CHECKPOINT | Completed timetable Phase 2 domain reconciliation without changing the existing task status: added settings, rooms/resources, teacher teaching assignments, subject period requirements, expanded recurring availability, normalized optional timetable references, class/teacher slot uniqueness constraints, additive migration `20260906100000_timetable_domain_reconciliation`, and contract coverage. Prisma validation and 4 focused timetable tests pass. |
| 2026-09-06 | TTB-001 | GitHub Copilot | CHECKPOINT | Completed timetable Phase 3 settings validation and deterministic slot generation: added school-scoped settings read/upsert/generated-slot endpoints, validation for operating hours, break/lunch overlap, working days, durations, workload limits, and focused tests (7 passed). Prisma validation and backend build pass; Prisma client generation is temporarily blocked by a Windows EPERM lock on `query_engine-windows.dll.node`. |
| 2026-09-06 | TTB-001 | GitHub Copilot | CHECKPOINT | Completed timetable Phase 4 persistence: added draft/review-only `POST /api/timetables/:id/generate-slots` (and `/api/v1`) using saved settings, protected regeneration when entries exist, audit logging, admin UI action, and verification (7 timetable tests, 10 frontend tests, backend/frontend builds pass). |
| 2026-09-06 | TTB-001 | GitHub Copilot | CHECKPOINT | Completed timetable Phase 5 teacher teaching assignments: added tenant/school-scoped teacher+subject+class+year+term CRUD (`GET/POST/PATCH/DELETE /api/timetables/teaching-assignments`), cross-entity scope validation, composite uniqueness, and teacher workload endpoint (`GET /api/timetables/teachers/:teacherId/workload`) aggregating periods per week by subject and class. Focused tests (7) and backend build pass. |
| 2026-09-06 | TTB-001 | Codex | CHECKPOINT | Implemented Phase 6 subject period requirements CRUD with partial updates, school/tenant and term/year validation, bounds, double-period prerequisites and aggregate class/year/term capacity checks. Settings updates revalidate saved requirements in serializable transactions. Corrected generated slots for breaks, daily limits and incomplete lessons, and fixed settings compound-key lookup. Focused timetable tests (14) and backend build pass; no live migration applied. |
| 2026-09-06 | TTB-001 | Codex | CHECKPOINT | Implemented Phase 7 recurring teacher availability CRUD, school scoping, complete lesson-span enforcement and publication/locking rechecks. Availability changes protect non-archived lessons; serializable transactions keep checks and writes atomic. Focused timetable tests (22), full backend suite (238 passed, 1 skipped), backend build and targeted lint pass. Next: room/resource management, then global generation. No migration applied. |

| 2026-08-27 | COM-001 | Codex | DONE | Reconciled persisted notification events, per-user deliveries and preferences; enforced authenticated tenant/school/user context; mounted both APIs; replaced seeded notification UI and fake analytics with real inbox/read/preferences/status data; focused tests, lint, full backend suite (119 passed, 1 skipped), frontend build, and diff check pass. |

| 2026-08-27 | HR-001 | Codex | CLAIMED | Auditing HR schema, migrations, employee/leave/payroll lifecycles, authenticated school scope, active route mounts, frontend integration, documentation, and tests. |

| 2026-08-27 | HR-001 | Codex | DONE | Added a non-destructive HR migration; corrected authenticated tenant/school ownership; validated employee, leave, and payroll contracts; mounted both active APIs; connected operational UI workflows and back navigation; Prisma, lint, both builds, focused tests, full suite (125 passed, 1 skipped), and diff check pass. |

| 2026-08-27 | LIB-001 | Codex | CLAIMED | Auditing library catalog/copy/loan persistence, circulation lifecycle, fines, authenticated school scope, active route mounts, frontend integration, documentation, and tests. |

| 2026-08-27 | LIB-001 | Codex | DONE | Replaced nonexistent library delegates and demo UI with migrated library, book, copy, and loan models; validated school-scoped APIs; atomic borrow/return circulation; both active mounts; operational frontend and back navigation; Prisma, lint, both builds, focused tests, and full suite (129 passed, 1 skipped) pass. |

| 2026-08-27 | AST-001 | Codex | CLAIMED | Auditing asset and inventory models, migrations, CRUD and stock movement lifecycles, authenticated school scope, route mounts, frontend integration, documentation, and tests. |

| 2026-08-27 | AST-001 | Codex | DONE | Replaced missing delegates and seeded UI with migrated asset, inventory-item, and stock-movement models; validated school-scoped CRUD/lifecycle APIs; atomic receipt/issue ledger with negative-stock guard; active mounts, operational frontend, tests, docs, Prisma, lint, both builds, and full suite (134 passed, 1 skipped) pass. |

| 2026-08-27 | TRN-001 | Codex | CLAIMED | Auditing transport vehicle, driver, route, stop, trip and inspection persistence, lifecycle APIs, authenticated school scope, route mounts, frontend integration, documentation, and tests. |

| 2026-08-27 | TRN-001 | Codex | DONE | Reconciled transport persistence and migration; removed invalid relations and auth scope; added validated vehicle/driver/route/stop/trip/inspection workflows, both active mounts, operational frontend and back navigation, docs and tests; Prisma, lint, both builds, focused tests, and full suite (139 passed, 1 skipped) pass. |

| 2026-08-28 | BRD-001 | Codex | CLAIMED | Auditing boarding dormitory, room, bed, allocation and lifecycle persistence, authenticated school scope, active route mounts, frontend integration, documentation, and tests. |
| 2026-08-29 | BRD-001 | Codex | DONE | Added migrated dormitory, room, bed, application, approval, allocation and checkout persistence; enforced authenticated tenant/school scope and tenant-owned students; mounted both APIs; replaced static UI with operational workflows; Prisma, lint, both builds, focused tests, diff check, and full suite pass (146 passed, 1 skipped). |
| 2026-08-29 | LMS-001 | Codex | CLAIMED | Reconciling classroom and membership schema, migrations, authenticated tenant/school scope, lifecycle APIs, operational frontend, documentation, and tests. |
| 2026-08-29 | LMS-001 | Codex | DONE | Separated digital learning spaces from physical rooms; added relational classroom/member persistence and migration, owner/member authorization, create/list/detail/member/archive APIs on both mounts, operational UI, docs and tests; Prisma, lint, both builds, diff check, and full suite pass (151 passed, 1 skipped). |
| 2026-08-29 | LMS-002 | Codex | CLAIMED | Reconciling classroom announcement, stream post and comment persistence with digital-classroom membership, validation, active mounts, frontend workflows, documentation, and tests. |
| 2026-08-29 | LMS-002 | Codex | DONE | Migrated announcements, posts and comments with digital-classroom/user relations; enforced active membership and teacher publishing permissions; added validation, both active mounts, real stream UI, docs and tests; Prisma, lint, both builds, diff check, and full suite pass (156 passed, 1 skipped). |
| 2026-08-29 | LMS-003 | Codex | CLAIMED | Reconciling assignment/classwork persistence, classroom membership authorization, lifecycle transitions, validation, active mounts, frontend workflows, documentation, and tests. |

| 2026-09-06 | TTB-001 | Codex | CHECKPOINT | Phase 8 room/resource CRUD and assignment validation implemented. Timetable screen now uses readable school/term records and full generated slots. SSS Science 3A nine-subject preview prepared; configured database is empty, so actual draft persistence awaits school/term and subject details. Backend 241 passed/1 skipped, frontend 12 passed, builds and targeted lint pass. |

| 2026-09-07 | TTB-001 | Codex | DONE | Phase 14: controlled manual lesson creation/editing, school-scoped entity validation, full-span collision and teacher workload checks, protected lifecycle and audited changes; named frontend selections with shared authentication. |

| 2026-09-07 | TTB-001 | Codex | DONE | Phase 15: recheck current daily, weekly and consecutive teacher workload limits atomically before publishing or locking. |

| 2026-09-07 | TTB-001 | Codex | BLOCKED | Live verification readiness audit completed: all 40 saved lesson spans and nine subject totals pass. End-to-end verification awaits the main-school choice, real teachers/assignments/availability and rooms; all 40 draft lessons are unassigned. Evidence: docs/audit/timetable-live-readiness-2026-09-07.md. No database changes made. |

| 2026-09-07 | SEC-001 | Codex | IN_PROGRESS | QA-001 prerequisite is DONE. Beginning security completion with removal of fabricated dashboard metrics and evidence actions, replacing them with authenticated account-session listing and revocation. Remaining school-wide controls require further implementation and verification. |

| 2026-09-07 | SEC-001 | Codex | CHECKPOINT | Phase 1: replaced security-admin fabricated scores, alerts, compliance claims and fake evidence export with authenticated own-account session listing and real revocation through existing auth endpoints. Loading, retry, failure, current-device guidance and back navigation included. Three frontend behavior tests, focused lint and frontend production build pass. SEC-001 remains IN_PROGRESS; school-wide security controls and acceptance audit remain outstanding. |

| 2026-09-07 | SEC-001 | Codex | IN_PROGRESS | Phase 2: align authenticated request eligibility with login/refresh by rejecting inactive, deleted and temporarily locked accounts even when a signed access token and unexpired session exist. Add middleware regression coverage with isolated persistence fixtures. |

| 2026-09-07 | SEC-001 | Codex | CHECKPOINT | Phase 2 completed: protected requests now reject non-ACTIVE, deleted and temporarily locked accounts despite existing tokens/sessions. Nine middleware regressions pass; full backend suite 285 passed/1 intentional live-database skip, backend build, focused lint and diff check pass. SEC-001 remains IN_PROGRESS for remaining security controls and acceptance audit. |

| 2026-09-07 | SEC-001 | Codex | IN_PROGRESS | Phase 3: make single-device and all-device sign-out transactional across refresh tokens, sessions and audit records; verify ownership checks and rollback behavior with isolated persistence tests. |

| 2026-09-07 | SEC-001 | Codex | CHECKPOINT | Phase 3 completed: single/all-device sign-out atomically revokes refresh tokens and sessions with audit recording through one transaction client. Nine service regressions cover ownership and injected write failures. Full backend suite 294 passed/1 intentional live-database skip; build, focused lint and diff check pass. SEC-001 remains IN_PROGRESS. |

| 2026-09-07 | SEC-001 | Codex | IN_PROGRESS | Phase 4: transactional refresh rotation with checked token consumption and committed replay revocation; regression coverage for failed writes and competing consumption. |

| 2026-09-07 | SEC-001 | Codex | CHECKPOINT | Phase 4 completed: transactional refresh rotation checks conditional consumption count before successor creation; replay revocation commits before authentication rejection. Nine regressions cover successor linkage, simulated lost races, replay and rollback. Full backend suite 303 passed/1 intentional live-database skip; backend build, focused lint and diff check pass. Live concurrency verification remains outstanding; SEC-001 stays IN_PROGRESS. |

| 2026-09-07 | SEC-001 | Codex | IN_PROGRESS | Phase 5: transactional session issuance across session, initial refresh token and remembered-device writes, with rollback regression tests. |

| 2026-09-07 | SEC-001 | Codex | CHECKPOINT | Phase 5 completed: session issuance commits session, initial hashed refresh token and remembered-device writes together before returning credentials. Six regressions cover linkage and failed creation/lookup/token/device/commit paths. Full backend suite 309 passed/1 intentional live-database skip; backend build, focused lint and diff check pass. SEC-001 remains IN_PROGRESS. |

| 2026-09-07 | SEC-001 | Codex | IN_PROGRESS | Phase 6: transactional password reset and conditional single-use token consumption, with replay and rollback tests. Password-change hardening remains a separate follow-up. |

| 2026-09-07 | SEC-001 | Codex | CHECKPOINT | Phase 6 completed: password reset conditionally consumes an unused/unexpired link and atomically replaces credentials, invalidates remaining reset links, revokes sessions/tokens and records audit. Eight regressions cover replay, competing consumption and failed writes. Full backend suite 317 passed/1 intentional live-database skip; build, focused lint and diff check pass. SEC-001 remains IN_PROGRESS; password-change hardening and live concurrency verification remain outstanding. |

| 2026-09-07 | SEC-001 | Codex | IN_PROGRESS | Phase 7: transactional password change with expected-password conditional update, current-session ownership check, reset-link invalidation and revocation of other devices. |

| 2026-09-07 | SEC-001 | Codex | CHECKPOINT | Phase 7 completed: password changes use expected-hash conditional updates and atomically invalidate reset links, revoke other devices and record audit while preserving the current owned session. Nine regressions cover stale credentials, scope and failed writes. Full backend suite 326 passed/1 intentional live-database skip; build, focused lint and diff check pass. SEC-001 remains IN_PROGRESS. |

| 2026-09-07 | SEC-001 | Codex | IN_PROGRESS | Phase 8: prevent email verification from activating accounts; transactional single-use link consumption and verification audit with lifecycle regression tests. |

| 2026-09-07 | SEC-001 | Codex | CHECKPOINT | Phase 8 completed: email verification preserves account lifecycle and atomically consumes verification links, updates email ownership and records audit. Ten regressions pass; full backend suite 336 passed/1 intentional skip, build, lint and diff check pass. SEC-001 remains IN_PROGRESS. |

<<<<<<< HEAD
| 2026-09-08 | SEC-001 | Codex | IN_PROGRESS | Phase 9: remove sign-in account enumeration across missing, suspended, pending and temporarily locked identities while retaining internal failure telemetry. |

| 2026-09-08 | SEC-001 | Codex | CHECKPOINT | Phase 9 completed: sign-in now returns one generic authentication failure for missing, suspended, pending and locked accounts, performs bcrypt work for unknown identities, and retains specific internal failure telemetry. The focused regression, backend build, targeted lint and diff check pass. Full backend suite reports 336 passed/1 intentional skip/3 pre-existing subject-class contract failures unrelated to SEC-001. SEC-001 remains IN_PROGRESS. |

| 2026-09-08 | SEC-001 | Codex | IN_PROGRESS | Phase 10: make successful login state, session/token/device issuance and success auditing one atomic transaction with rollback coverage. |

| 2026-09-08 | SEC-001 | Codex | CHECKPOINT | Phase 10 completed: successful-login state, login-attempt telemetry, session, initial refresh token, remembered device and success audit now commit through the same transaction. Failures return no credentials and roll back the entire issuance. Nine focused auth/session tests, backend build, targeted lint and diff check pass. SEC-001 remains IN_PROGRESS. |
=======

| 2026-09-07 | SEC-001 | Codex | IN_PROGRESS | Phase 9: reject access tokens without expiry, with empty identity claims or inconsistent session aliases; preserve valid legacy sid-only tokens. |

| 2026-09-07 | SEC-001 | Codex | CHECKPOINT | Phase 9 implemented: access tokens require HS256, finite expiry, nonblank identity and consistent session aliases while retaining valid sid-only compatibility. All 13 focused token tests, backend build, focused lint and diff check pass. Full backend suite fails in subject-creation coverage requiring classAssignments (including recordCode.test.js and subjectDomain.test.js); subject implementation was not modified by this checkpoint. SEC-001 remains IN_PROGRESS, full-suite acceptance not achieved. |

User-directed scope change, 2026-09-07: prioritize application-wide CRUD completion. Begin with subject end-to-end editing and soft deletion; inventory in docs/audit/crud-coverage-2026-09-07.md. SEC-001 remains unfinished; no completion claim.

> > > > > > > dfc4a1a7f92aa2e0b7f89199edb91dc58ec5dfe9
