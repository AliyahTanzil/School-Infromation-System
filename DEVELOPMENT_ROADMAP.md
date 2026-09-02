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

- [ ] LMS-007: persisted gradebook, rubrics, grading workflow, feedback, and release controls.
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
