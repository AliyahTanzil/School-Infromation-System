# SAIS Development Roadmap

Updated: 2026-08-30

## Product goal

Deliver a secure, reliable, single-school information system in which administrators, teachers, students, and parents can complete their daily academic and operational work on web and mobile clients.

## Current baseline

- The application is a Node.js monorepo with an Express/Prisma backend, React/Vite frontend, and Expo mobile client.
- Core persistence and APIs exist for users, students, parents, teachers, academic periods, subjects, classes, enrollment, attendance, examinations, results, timetables, finance, payments, notifications, HR, library, assets, transport, boarding, and the first six LMS slices.
- The verified code baseline is 180 passing backend tests, one intentionally skipped live-database test, two passing frontend tests, clean lint, successful production builds, valid Prisma schema, and a passing mobile TypeScript check.
- Development is currently blocked at runtime because the configured Neon PostgreSQL endpoint cannot establish a Prisma connection.
- Several web modules expose implementation-oriented UUID fields or incomplete workspaces. The mobile application remains mostly a contract and navigation foundation.

## Delivery principles

1. Restore and protect the data layer before adding features.
2. Complete one end-to-end workflow at a time: schema, migration, API, authorization, UI, tests, and documentation.
3. Derive school and user identity from the authenticated session; do not ask users to enter internal UUIDs.
4. Do not use static or demo data in production workflows.
5. Keep the main branch releasable. Every change must pass the release checks listed below.
6. Treat security, accessibility, auditability, backup, and recovery as acceptance criteria rather than later enhancements.

## Phase 0 — Restore the development environment

Target: immediate

- [x] Restore Prisma runtime connectivity to the configured Neon development database.
- [x] Upgrade Prisma CLI and Client together to 6.19.0 and regenerate the client.
- [x] Apply all 29 reviewed migrations to the intended development database.
- [x] Provision and verify the configured application-owner login with `npm run db:seed:owner -w backend`.
- [x] Run the current-schema bootstrap and verify school-admin, teacher, student, and parent development accounts.
- [ ] Verify login, refresh-token rotation, logout, and password recovery in the browser.
- [ ] Document local setup, database reset, migration, and recovery commands in one current runbook.

Current note: owner provisioning and the transactional role-account bootstrap are isolated, idempotent commands. The older aggregate seed files remain unsupported and must not be used as the single-school bootstrap contract.

Exit criteria: a clean checkout can be configured and started, all four roles can authenticate, and the full verification suite passes against a disposable development database.

## Phase 1 — Authentication, authorization, and application shell

Target: first stable development milestone

- [ ] Redirect unauthenticated users away from protected routes instead of rendering partial workspaces.
- [ ] Verify role and permission checks for every mounted API and frontend route.
- [ ] Remove stale multi-tenant assumptions and enforce the single-school context consistently.
- [ ] Complete invitation, account activation/deactivation, password reset, session revocation, and profile management.
- [ ] Add consistent loading, empty, offline, forbidden, and service-unavailable states.
- [ ] Replace raw backend messages such as `Database client error` with actionable, non-sensitive user messages.
- [ ] Add end-to-end tests for administrator, teacher, student, and parent authentication journeys.

Exit criteria: protected pages cannot be accessed anonymously, each role lands on the correct workspace, and authorization regression tests cover all sensitive routes.

## Phase 2 — Complete daily school operations

Target: minimum usable product

- [x] Class creation uses a year-only selector and the canonical Pre-School Nursery, Primary School, Junior Secondary, and Senior Secondary stages; missing year/stage records are provisioned atomically within the authenticated school context.
- [x] Attendance derives the school from the authenticated session, uses an assigned-class selector, and limits teacher access to current class or teaching assignments.
- [x] Canonical student administration validates strict student and guardian inputs, derives tenant ownership from the authenticated school context, bounds list pagination, and reports only persisted student metrics.
- [x] Teacher administration applies authenticated school scope to self-service and administrator routes, validates lifecycle identifiers and strict payloads, and bounds staff-directory queries.
- [x] User administration validates every dynamic identity route, tenant-scopes profile and image operations, prevents push-token ownership forgery, and exposes only supported non-administrator account types in normal provisioning.
- [x] School administration validates main-school and Campus branch requests, derives ownership from authentication, forbids deleting the configured main school, and fails unavailable administrator assignments closed.
- [ ] Administrator: school setup, users, academic periods, classes, sections, subjects, enrollment, and staff assignment.
- [ ] Teacher: assigned classes, timetable, attendance, classwork, assessments, mark entry, gradebook, and feedback.
- [ ] Student: timetable, attendance, classwork, submissions, results, announcements, and account profile.
- [ ] Parent: linked learners, attendance, results, fees, announcements, and teacher feedback.
- [ ] Remove manual `School UUID`, `Student UUID`, `Class UUID`, and similar fields from normal workflows; replace them with scoped selectors or session-derived values.
- [ ] Complete import/export for student, staff, enrollment, attendance, and result data with validation and error reports.
- [ ] Add browser end-to-end coverage for one complete academic cycle from setup through published results.

Exit criteria: a school can configure a term, enroll learners, teach classes, record attendance and marks, publish results, and expose them to students and parents without direct database intervention.

## Phase 3 — Finish the digital classroom

Target: learning-management milestone

- [x] LMS-007: persisted gradebook, rubrics, grading workflow, feedback, and release controls.
- [ ] LMS-008: calendar integration and classroom notification delivery.
- [ ] Connect teacher, student, and parent dashboards to real LMS data.
- [ ] Complete classroom discussions, moderation, live-learning sessions, recordings, and attendance linkage.
- [ ] Add permission-aware classroom search.
- [ ] Add file security controls: size/type validation, malware-scanning integration point, signed access, retention, and deletion.
- [ ] Test assignment creation, submission, grading, feedback, release, and notification as a single workflow.

Exit criteria: the LMS journey works end to end with persisted data, correct membership authorization, audit history, and no production placeholders.

## Phase 4 — Finance, communication, and operations

Target: operational completeness

- [ ] Finish fee configuration, invoicing, discounts, receipts, refunds, reconciliation, and finance reports.
- [ ] Complete Monime payment sandbox testing, webhook signature verification, retry handling, and idempotency tests.
- [ ] Complete notification templates, preferences, delivery retries, and email/SMS/push provider adapters.
- [ ] Complete HR/payroll, library, inventory, transport, and boarding user workflows and reports.
- [ ] Add scheduled jobs for reminders, overdue items, payment reconciliation, and notification retries.
- [ ] Add auditable CSV/PDF exports where schools require printable operational records.

Exit criteria: financial and operational records reconcile, provider failures are recoverable, and administrators can audit every material transaction.

## Phase 5 — Mobile application and offline support

Target: mobile beta

- [ ] Implement real authentication and secure token storage.
- [ ] Add role-aware navigation guards and server-driven module availability.
- [ ] Connect student, parent, and teacher dashboards to production APIs.
- [ ] Implement attendance, assessment, finance, classroom, and notification workflows in dependency order.
- [ ] Add device registration and push-notification lifecycle management.
- [ ] Implement offline caching, sync cursors, idempotent writes, conflict handling, and retry visibility.
- [ ] Test on supported Android and iOS versions, slow networks, expired sessions, and interrupted uploads.

Exit criteria: core role journeys work on physical devices and safely recover from network loss without duplicate or lost writes.

## Phase 6 — Analytics, search, and responsible AI

Target: post-MVP

- [ ] Replace demo analytics with calculated, persisted, permission-scoped metrics.
- [ ] Build school-wide search with role-aware result filtering.
- [ ] Define metric ownership, refresh frequency, lineage, and correction procedures.
- [ ] Add grounded AI features only after source data, authorization, audit trails, cost limits, and evaluation datasets exist.
- [ ] Require citations/evidence for generated insights and prevent cross-role data disclosure.
- [ ] Add predictive features only with documented accuracy, bias review, human oversight, and opt-out controls.

Exit criteria: analytics are reproducible and AI output is grounded, evaluated, permission-safe, and clearly identified as advisory.

## Phase 7 — Security, reliability, and production release

Target: production candidate

- [ ] Complete threat modeling, dependency review, secret rotation, rate-limit verification, and penetration testing.
- [ ] Verify audit coverage, retention rules, privacy exports, account deletion, and sensitive-data redaction.
- [ ] Establish performance budgets and load-test login, dashboards, bulk attendance, results, and payment webhooks.
- [ ] Test backup restoration, point-in-time recovery, migration rollback, and disaster-recovery procedures.
- [ ] Add health, readiness, structured logging, error tracking, metrics, alerts, and provider status monitoring.
- [ ] Create staging and production release gates with environment validation and post-deployment smoke tests.
- [ ] Complete accessibility, responsive-layout, browser-compatibility, and user-acceptance testing.

Exit criteria: release evidence demonstrates secure configuration, recoverable data, acceptable performance, observable failures, and approved user acceptance tests.

## Suggested milestone order

| Milestone | Outcome                                             | Depends on              |
| --------- | --------------------------------------------------- | ----------------------- |
| M0        | Working database and reproducible local environment | None                    |
| M1        | Secure authentication and role-based shell          | M0                      |
| M2        | Complete academic operations MVP                    | M1                      |
| M3        | Complete digital classroom                          | M1, M2                  |
| M4        | Finance and operational modules                     | M1, M2                  |
| M5        | Mobile beta with offline safety                     | M1, stable APIs         |
| M6        | Analytics, search, and responsible AI               | M2–M4                   |
| M7        | Production release candidate                        | All critical milestones |

## Definition of done

A roadmap item is done only when applicable schema and migration changes, seed data, backend contract, authorization, user interface, error states, automated tests, documentation, and operational monitoring are complete. It must use persisted data and pass the release checks.

## Release checks

```powershell
npm run lint
npm test
npm run build
npm run format:check
npm run db:generate
cd mobile
npx tsc --noEmit
```

Database-dependent releases must additionally validate migrations against a disposable database and run browser-based smoke tests for every supported role.

## Roadmap maintenance

- Use `ROADMAP_TODO.md` for atomic engineering task status and work logs.
- Use `PROJECT_PROGRESS.md` for measured completion evidence.
- Review this roadmap after every milestone or material architecture change.
- Each active milestone should have one owner, a target date, named dependencies, and linked acceptance evidence.

SEC-001 Phase 29 checkpoint (2026-09-09): canonical subject administration now validates UUID identifiers on detail, edit, delete and status routes; rejects unknown list-query and nested assignment fields; and rejects empty updates. Eight focused tests and the full backend suite pass (402 passed, one intentional live-database skip). Backend build, targeted lint, formatting and diff checks pass. SEC-001 remains in progress.

SEC-001 Phase 30 checkpoint (2026-09-09): class administration now validates route UUIDs, rejects unknown request and nested subject fields, bounds pagination and validates list lifecycle states. Controllers preserve authenticated tenant/school scope, actor and route identities after applying client input. Ten focused class tests and the full backend suite pass (406 passed, one intentional live-database skip). Backend build, targeted lint, formatting and diff checks pass. SEC-001 remains in progress.

SEC-001 Phase 31 checkpoint (2026-09-09): academic-period requests now reject unknown fields; controllers preserve authenticated context and route identity; year, term and event lifecycle writes include ownership predicates. Calendar creation sends only endpoint-supported fields. Full backend suite: 410 passed, one intentional live-database skip. Two focused frontend tests, both production builds, targeted lint, formatting and diff checks pass. SEC-001 remains in progress. The pre-existing academic-year CLOSED-state persistence limitation is documented in docs/security/security-administration-phase31.md.

SEC-001 Phase 32 checkpoint (2026-09-09): parent profile and unlink writes enforce parent tenant/school ownership and non-deleted state; link requests verify parent and student through the same transaction as persistence; portal relationships explicitly require student tenant ownership. Missing service scope fails closed. Ten focused tests and a clean full backend rerun pass (415 passed, one intentional live-database skip). Backend build, targeted lint, formatting and diff checks pass. SEC-001 remains in progress.

SEC-001 Phase 33 checkpoint (2026-09-09): academic-policy creation validates referenced subject tenant/school ownership within its persistence transaction. Detail UUID validation, strict top-level/nested schemas and scoped lifecycle writes close request-boundary gaps. Seven focused tests and the full backend suite pass (420 passed, one intentional live-database skip). Backend build, targeted lint, formatting and diff checks pass. SEC-001 remains in progress.

SEC-001 Phase 34 checkpoint (2026-09-09): communication schemas reject unknown fields and malformed quiet-hour values; services require tenant/school context; recipient ownership checks share the event/delivery transaction. Nine focused tests and the full backend suite pass (425 passed, one intentional live-database skip). Backend build, targeted lint, formatting and diff checks pass. SEC-001 remains in progress.

SEC-001 Phase 35 checkpoint (2026-09-09): finance writes persist only supported tenant/school context fields, balance updates retain ownership, request schemas reject unknown fields and transaction listing validates limits. Seven focused tests and the full backend suite pass (429 passed, one intentional live-database skip). Backend build, targeted lint, formatting and diff checks pass. SEC-001 remains in progress.

SEC-001 Phase 36 checkpoint (2026-09-09): existing payment idempotency keys require matching amount, provider and reference as well as tenant, school and invoice. Conflicting retries return 409 before writes; equivalent decimal representations remain accepted. Eight focused tests and the full backend suite pass (433 passed, one intentional live-database skip). Backend build, targeted lint, formatting and diff checks pass. SEC-001 remains in progress.

SEC-001 Phase 37 checkpoint (2026-09-09): invoice student and optional active fee eligibility checks now share the invoice creation transaction; invalid amounts fail before opening the transaction. Nine focused tests and the full backend suite pass (438 passed, one intentional live-database skip). Backend build, targeted lint, formatting and diff checks pass. SEC-001 remains in progress.

SEC-001 Phase 38 checkpoint (2026-09-09): payment transactions conditionally claim the scoped invoice balance before creating payment and ledger records; stale balance claims return 409. Eleven focused tests and the full backend suite pass (441 passed, one intentional live-database skip). Backend build, targeted lint, formatting and diff checks pass. Live concurrency verification remains outstanding; SEC-001 remains in progress.

SEC-001 Phase 39 checkpoint (2026-09-09): payment amounts require positive two-decimal values within the ledger integer limit; service and HTTP validation share a predicate; balance subtraction and ledger values use validated minor units. Fourteen focused tests and the full backend suite pass (444 passed, one intentional live-database skip). Backend build, targeted lint, formatting and diff checks pass. SEC-001 remains in progress.

SEC-001 Phase 40 checkpoint (2026-09-09): invoice subtotal and discount require two-decimal nonnegative values within Decimal(12,2) bounds, with discount no greater than subtotal. Domain totals use integer minor-unit subtraction. Sixteen focused tests and the full backend suite pass (448 passed, one intentional live-database skip). Backend build, targeted lint, formatting and diff checks pass. SEC-001 remains in progress.

SEC-001 Phase 41 checkpoint (2026-09-09): failed concurrent payment submissions re-read the idempotency key after transaction exit and return only a matching committed payment. Ownership/payload mismatches remain conflicts; unrelated persistence errors propagate. Eleven focused tests and the full backend suite pass (448 passed, one intentional live-database skip), including all four new race-recovery tests. Backend build, targeted lint, formatting and diff checks pass. Live database race verification remains outstanding; SEC-001 remains in progress.

SEC-001 Phase 42 checkpoint (2026-09-09): HR services reject missing school ownership; controllers preserve authenticated ownership and approver identity; employee and leave reference checks share creation transactions; employee, leave and payroll initial status and scope remain server-controlled. Strict employee queries and identifier objects reject unknown fields. Twelve focused HR tests and the full backend suite pass (459 passed, one intentional live-database skip). Backend build, targeted lint, formatting and diff checks pass. No schema or live HR/payroll data changes. SEC-001 remains in progress; live concurrency verification and payroll monetary limits remain outstanding.

SEC-001 Phase 43 checkpoint (2026-09-09): payroll creation requires scoped employee positions and validates nonnegative integer salaries plus aggregate totals against signed 32-bit database bounds before any payroll writes. Explicit zero salaries remain supported; missing positions no longer silently yield zero. Sixteen focused tests and the full backend suite pass (463 passed, one intentional live-database skip). Backend build, targeted lint, formatting and diff checks pass. No schema or live payroll changes. SEC-001 remains in progress; existing-draft finalization reconciliation and payroll audit coverage remain outstanding.

SEC-001 Phase 44 checkpoint (2026-09-10): payroll finalization reconciles persisted item amounts, deductions, employee school ownership and net totals before a conditional DRAFT transition. Authenticated audit evidence commits in the same serializable transaction; conflicts return 409. Six focused tests and the full backend suite pass (472 passed, one intentional database skip). All 94 frontend tests pass with bounded concurrency, including retained setup and examination changes and the corrected academic-year accessible label. Full lint and production builds pass. SEC-001 remains IN_PROGRESS; live race verification and remaining audit/compliance work are outstanding.
