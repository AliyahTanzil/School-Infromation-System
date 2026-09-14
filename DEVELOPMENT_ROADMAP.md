# SAIS Development Roadmap

Updated: 2026-09-14

Boarding/transport/inventory checkpoint (2026-09-14): removed obsolete client school headers from these operational workflows. Fifteen focused tests, targeted ESLint, formatting and frontend production build pass. Remaining module migrations and SEC-001 acceptance stay open.

Operational context checkpoint (2026-09-14): removed client school headers from finance, HR and library requests. Seven focused tests, targeted ESLint, formatting and frontend production build pass. Other module migrations and remaining SEC-001 acceptance stay open.

Examination context checkpoint (2026-09-14): examination lifecycle, scheduling and candidate workflows now omit client school headers and retain authenticated scope. All 24 examination tests, targeted ESLint, formatting and frontend production build pass. Remaining module migrations and SEC-001 acceptance stay open.

Academic-policy context checkpoint (2026-09-14): removed school header overrides from policy list/create/activation requests while retaining authenticated school context and administrator guards. Seven focused tests, targeted ESLint, formatting and frontend production build pass. Other module migrations and SEC-001 acceptance remain open.

Student-home aggregation checkpoint (2026-09-14): removed the first-classroom-only restriction for work and calendar events. The dashboard aggregates every classroom returned by the scoped API, orders calendar events chronologically, and rejects partial results on failure. Nine focused tests, targeted ESLint, formatting and frontend production build pass. The API's existing 100-classroom cap and remaining SEC-001 acceptance stay open.

Student-home checkpoint (2026-09-14): migrated student home to authenticated school context and removed cached school headers. Data failures now offer retry rather than silently showing empty learning data. Seven focused tests, targeted ESLint, formatting and frontend production build pass. Multi-classroom assignment/calendar aggregation and remaining SEC-001 acceptance stay open.

Live-learning checkpoint (2026-09-14): migrated live learning to authenticated school context and removed cached school headers. Failed session/recording reads now offer retry, and selecting a session no longer causes a reload. Five focused tests, targeted ESLint, formatting and frontend production build pass. Remaining single-school migrations and live acceptance remain open under SEC-001.

GitHub delivery checkpoint (2026-09-14): corrected the teacher self-profile owner-bypass regression while preserving teacher administration access, and updated the navigation test for Email setup. Backend: 743 passed, one intentional database skip; frontend: 131 passed. Repository lint, changed-file formatting, Prisma generation, backend compilation/runtime smoke checks and frontend production build pass. SEC-001 remains IN_PROGRESS for live browser/recovery delivery and remaining acceptance work. Timetable staffing stays paused.

Assessment classroom checkpoint (2026-09-14): replaced the assessment Classroom UUID input with accessible classroom choices, including loading/retry/empty states. Switching classrooms clears quiz/attempt/editor state and prevents old responses from restoring the previous selection. Six focused tests, targeted ESLint, formatting and frontend production build pass. The existing 100-classroom API limit and remaining workspace migrations remain open; SEC-001 remains IN_PROGRESS.

Assessment school-context checkpoint (2026-09-14): Classroom quizzes now resolves authenticated school context and offers loading/retry/missing-school states. Manual and stored school identity and school request-header overrides were removed. Four focused tests, targeted ESLint, formatting and frontend production build pass. Assessment classroom selection and remaining single-school migrations are still open; SEC-001 remains IN_PROGRESS.

Student classroom selector checkpoint (2026-09-14): replaced the My work Classroom UUID field with accessible classroom choices from the existing authenticated API. Cached classroom IDs no longer drive requests. Loading/retry/empty states and stale-response protection are covered alongside draft saving and retraction. Six focused tests, targeted ESLint, formatting and frontend production build pass. The existing endpoint's 100-classroom cap and other workspace migrations remain open; SEC-001 remains IN_PROGRESS.

Student submission context checkpoint (2026-09-14): My work now uses the authenticated school context instead of an editable School UUID or session-stored school identity. Assignment/submission reads and draft/retraction writes omit client school overrides. Loading, retry and missing-school states prevent workspace access until context is available. Four focused tests, targeted ESLint, formatting and the frontend production build pass. Classroom selection and other single-school migrations remain open; SEC-001 remains IN_PROGRESS.

Email setup verification checkpoint (2026-09-14): resumed SEC-001 and verified the existing administrator SMTP implementation. All 12 focused backend settings/access/email tests and 16 frontend setup/reset/authentication-client tests pass, along with targeted ESLint and the frontend production build. No application fixes or live configuration changes were needed. Actual provider delivery, browser journeys and the remaining security acceptance criteria are still outstanding; SEC-001 is not complete. Timetable staffing remains paused.

Authentication verification checkpoint (2026-09-14): all four development roles passed the live login/refresh/identity/school/logout/revocation journey. Backend recovery suites passed 22 tests using the required TypeScript loader; frontend recovery/session suites passed 11 tests. SEC-001 is now BLOCKED on browser and recovery-delivery acceptance: no connected browser is available and SMTP is unconfigured. No credentials changed. Configure the intended mail transport and connect a browser to resume; timetable staffing remains paused.

SEC-001 teacher-account checkpoint (2026-09-14): completed the pending live profile reconciliation against the configured hosted database. Seven active teacher accounts now have profile links: five profiles created and one existing profile linked. Repeating the repair performed zero writes. Eight focused tests passed. Credentials and timetable staffing were preserved; timetable subject assignment remains paused by user request. SEC-001 remains IN_PROGRESS pending its remaining verification criteria.

## Product goal

Deliver a secure, reliable, single-school information system in which administrators, teachers, students, and parents can complete their daily academic and operational work on web and mobile clients.

## Current baseline

Password-recovery continuation (2026-09-13): added the missing public `/reset-password?token=...` page targeted by recovery emails. The form checks link presence/length and password confirmation, handles API failures, and provides replacement-link/sign-in navigation. Successful reset clears local auth state and removes the URL token. Frontend suite: 109 tests pass, including the mounted public route, successful reset, invalid-link and mismatch handling, expired-token errors, and credential clearing. Browser interaction and actual recovery-email delivery remain unverified; no live password was changed.

Authentication diagnostics continuation (2026-09-13): the previously unexplained administrator login HTTP 500 is identified in the runtime log as `DB_P2028` (request `6c366596-759d-49ec-92d4-a0bcb9d5afb4`). The normalizer now returns 503 with a fixed temporary-unavailability message while preserving the diagnostic code and redacting database metadata. The live verifier prints bounded error codes and request IDs for server failures. Twenty focused normalization/HTTP tests and targeted lint pass. The underlying transaction failure cause remains unproven; no automatic mutation retry was introduced.

Live authentication continuation (2026-09-13): provisioned the four configured development accounts in the existing main school. Live checks exposed a shared dashboard endpoint mismatch: `useSchoolContext` requested `/api/school-setup` (404), while the mounted API is `/api/school`. The hook and regression fixtures now use the canonical endpoint. Frontend verification: 103 tests pass, targeted lint and production build pass. No connected browser is available; browser authentication and password-recovery delivery remain outstanding.

Live API verification: all four roles pass login, httpOnly refresh-cookie rotation, identity, configured-school access, logout, and revoked access/refresh rejection. The administrator passed on an isolated retry after one HTTP 500; its cause was not established. The verifier respected shared login/refresh rate limits. Backend suite: 711 passed, zero failures, one intentional database skip. These results do not certify browser cookie behavior or recovery-email delivery.

Phase 0 continuation (2026-09-13): read-only verification found that none of the four configured development accounts exists in the current database. The development-account bootstrap now resolves the existing configured school instead of creating a separate development school, and rejects missing/ambiguous schools or inactive tenants before provisioning. Four focused tests pass. Live account provisioning and browser authentication journeys remain outstanding; SEC-001 remains IN_PROGRESS.

Latest authentication-client checkpoint (2026-09-13): logout clears in-memory credentials even when its HTTP request fails, and refresh ordering protects logout and newer sessions. Frontend verification: 102 tests pass with two workers, lint and production build pass. The initial default-concurrency run hit two app-loading timing failures. Local app/database startup works; the configured four development-role logins returned 401, and no browser is connected. Live authenticated journeys remain outstanding.

Latest frontend checkpoint (2026-09-13): recovered the unfinished single-school dashboard migration. Operational workspaces now resolve the configured school and show loading, retryable error, or setup-required states. Obsolete school-ID editors and setters and malformed Boarding JSX are removed. The full frontend suite passes (96 tests), with two additional Boarding recovery/missing-school regressions passing separately; frontend lint and production build pass. Browser journeys remain outstanding.

Latest authentication checkpoint (2026-09-12): current-user lookup and password changes reject missing or malformed authenticated identities before persistence access. Together with the pending recovery-token, session-revocation, password-change input and HTTP error-safety changes, the full backend suite passes with 689 tests passed, zero failures and one intentional live-database skip. Fourteen focused identity/password-change tests, targeted lint/formatting, Prisma generation, backend compilation/runtime copying and compiled health/protected-route smoke checks pass. Live browser authentication and database concurrency verification remain outstanding; SEC-001 remains IN_PROGRESS.

- The application is a Node.js monorepo with an Express/Prisma backend, React/Vite frontend, and Expo mobile client.
- Core persistence and APIs exist for users, students, parents, teachers, academic periods, subjects, classes, enrollment, attendance, examinations, results, timetables, finance, payments, notifications, HR, library, assets, transport, boarding, and the first six LMS slices.
- The verified code baseline is 180 passing backend tests, one intentionally skipped live-database test, two passing frontend tests, clean lint, successful production builds, valid Prisma schema, and a passing mobile TypeScript check.
- The current database was reachable during the latest read-only check; the earlier database-connectivity blocker is historical. Development-role accounts are missing from the current database.
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
- [x] Run the current-schema bootstrap and verify school-admin, teacher, student, and parent development accounts in the current configured database (live API authentication verified 2026-09-13).
- [ ] Verify login, refresh-token rotation, logout, and password recovery in the browser.
- [x] Document local setup, database reset, migration, and recovery commands in one current runbook (see [docs/RUNBOOK.md](docs/RUNBOOK.md)).

Current note: owner provisioning and the transactional role-account bootstrap are isolated, idempotent commands. The older aggregate seed files remain unsupported and must not be used as the single-school bootstrap contract.

Exit criteria: a clean checkout can be configured and started, all four roles can authenticate, and the full verification suite passes against a disposable development database.

## Phase 1 — Authentication, authorization, and application shell

Target: first stable development milestone

- [x] Redirect unauthenticated users away from protected routes instead of rendering partial workspaces (verified: every non-public route is wrapped in the `Protected` guard in `frontend/src/App.jsx`, which redirects to `/login`).
- [x] Verify role and permission checks for every mounted API and frontend route (see [docs/security/route-authorization-matrix.md](docs/security/route-authorization-matrix.md); mechanized by `backend/tests/unit/routeAuthorizationCoverage.test.js`). Endpoint-level permission detail continues under SEC-001.
- [ ] Remove stale multi-tenant assumptions and enforce the single-school context consistently. Partial: removed the client-controllable `requireSchoolContext` middleware (`middleware/auth/schoolContext.js`) and the orphaned `studentRoutes`, `tenantAdminRoutes`, `tenantLifecycleRoutes`, and `platformAdminRoutes` modules. Remaining: frontend `x-school-id` headers, manual school-ID fields, and the `useSchoolSelection` picker.
- [ ] Complete invitation, account activation/deactivation, password reset, session revocation, and profile management.
- [ ] Add consistent loading, empty, offline, forbidden, and service-unavailable states.
- [x] Replace raw backend messages such as `Database client error` with actionable, non-sensitive user messages (see `backend/src/shared/errors/normalizeError.js`).
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
- [ ] Complete import/export for student, staff, enrollment, attendance, and result data with validation and error reports. Partial: protected CSV/TSV/JSON/XLSX **import** with per-row validation and error reports now covers students, teachers, and subjects (see [docs/backend/data-import-api.md](docs/backend/data-import-api.md)); export and the remaining entities are outstanding.
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

## Missing capabilities register

Compiled 2026-09-11 from a documentation and code review of the repository. Each item below is
absent or incomplete; the evidence column names the supporting document or source file. Items that
duplicate an existing phase item are cross-referenced instead of restated.

### Security and compliance

- [ ] Multi-factor authentication (MFA). Only placeholder references exist
      (`frontend/src/SecurityAdminDashboard.jsx`, `backend/src/application/services/securityAdminService.js`);
      `docs/security/security-administration-phase1.md` records MFA evidence as still required.
- [ ] CSRF protection tokens. Only a `SameSite` cookie posture is in place;
      `docs/security/backend-twelve-authentication.md` flags the CSRF model as explicitly unreviewed.
- [ ] Distributed rate-limit store for multi-instance deployments —
      `docs/security/backend-eighteen-nineteen.md:47` records it as "Not yet enabled".
- [ ] Secret rotation policy and tooling; current docs cover secret presence and validation only.
- [ ] Encryption at rest / field-level encryption; only bcrypt and SHA-256 hashing exist.
- [ ] Resolve open dependency advisories (`xlsx`, `nodemailer`) —
      `docs/deployment/backend-sixteen-audit.md:5-7`, `docs/remediation/backend-twenty-five-remediation.md:8`.
- [ ] Penetration test, threat model, threat detection, and log retention.
- [ ] Data retention windows, GDPR/DSAR export, and account erasure.
- [ ] Complete the 20 unchecked items in `docs/security/security-checklist.md`.
- [ ] Finish SEC-001: remaining mounted-router authorization waves and the final acceptance audit.

### Operations and reliability

- [ ] Application error tracking (for example Sentry) — none is configured.
- [ ] External/uptime alerting, status monitoring, and a durable metrics backend —
      `docs/operations/backend-seventeen-observability.md:8,14-16`.
- [ ] Backups/disaster recovery: define and test RPO, RTO, retention, region, failover, and restore
      ownership — `docs/deployment/backend-twenty-two-architecture.md:29`,
      `docs/data/backend-twenty-three-recovery-checklist.md`.
- [ ] Load/stress testing and capacity planning (PERF-001).
- [ ] On-call rotation, paging, and escalation runbook.
- [ ] Staging/production release gate with environment validation and post-deployment smoke tests (REL-001).
- [ ] Execute backup restore, point-in-time recovery, and migration rollback drills (OPS-001).

### Testing

- [ ] Browser end-to-end tests for administrator, teacher, student, and parent journeys (no
      Playwright/Cypress is present) — required by Phases 1 and 2.
- [ ] Mobile test runner and the planned unit/integration/navigation/e2e tiers —
      `mobile/tests/README.md:3-8`.

### Backend and architecture

- [ ] Converge the dual composition root (`foundation/app.ts` versus `app.js`) —
      `docs/database/prisma-route-reconciliation.md:72`.
- [ ] Replace controlled `501 FEATURE_NOT_IMPLEMENTED` surfaces: billing (SaaS-001),
      school-administrator assignment (RBAC-002), and `/security-admin` routes.
- [ ] Resolve the Prisma Windows engine DLL `EPERM` build blocker (Phase 51+ checkpoints).
- [ ] Complete and certify CRUD coverage, including DELETE across route families —
      `docs/audit/crud-coverage-2026-09-07.md:69`.
- [ ] Live-database concurrency verification for payment, payroll, and library flows.

### Frontend

- [ ] Remove raw UUID inputs from normal workflows in favor of scoped selectors (Phase 2).
- [x] Replace raw backend messages with actionable, non-sensitive user messages (Phase 1).
- [ ] Complete import/export for student, staff, enrollment, attendance, and result data (Phase 2).

### Mobile

- [ ] Mobile bootstrap and permission-filtered module manifest (MOB-001) —
      `mobile/docs/missing-api-register.md:7-12`.
- [ ] Notification device lifecycle (MOB-002).
- [ ] Offline sync cursors, conflict handling, and idempotency (MOB-003).
- [ ] Classroom module connected to LMS APIs (MOB-004).
- [ ] App-store release pipeline documentation (EAS configuration exists; no release doc).
- [ ] Deep-linking configuration documentation.
- [ ] Camera/QR attendance capture — no dependency or documentation.
- [ ] Reconcile docs with code: push registration and offline attendance sync are implemented but
      still documented as gaps.

### Blocked domains

These roadmap tasks remain `BLOCKED` pending upstream dependencies (see `ROADMAP_TODO.md:83-99`):
AI-001, AI-002, PRD-001, INT-001, BIO-001, IOT-001, SaaS-001, ADM-001, AUD-001, PERF-001, OPS-001,
REL-001.

### Documentation reconciliation

- [ ] CI exists at `.github/workflows/ci.yml`, but operations docs describe no CI platform; the
      workflow also omits frontend lint and mobile typecheck listed under Release checks.
- [ ] Update `README.md` from the legacy Docker/multi-tenant description to the single-school target.
- [ ] Reconcile date-layered documents that contradict one another (older "missing" inventories
      versus later "DONE" checkpoints).

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

Session-route checkpoint (2026-09-11): device revocation now mounts its existing UUID validator after authentication and rejects undeclared parameter fields. Tests cover malformed IDs before service access and protected user/target/reason values. Focused route/revocation suites: 13 passed; full backend: 684 passed, one intentional database skip. Compilation/runtime copy, runtime smoke, targeted lint and formatting pass. See `docs/security/backend-twelve-authentication.md`; SEC-001 remains IN_PROGRESS.

Session-identity checkpoint (2026-09-11): session listing and revocation reject absent, blank and non-string identities before persistence, preventing omitted Prisma ownership filters. Focused session suites: 27 passed; full backend: 681 passed, one intentional database skip. Compilation/runtime copy, runtime smoke, targeted lint and formatting pass. See `docs/security/backend-twelve-authentication.md`; SEC-001 remains IN_PROGRESS.

Recovery-token checkpoint (2026-09-11): reset and verification token replacement now atomically invalidates prior links and creates the new hash; persistence failures preserve existing links and prevent uncommitted-token delivery. Focused issuance/reset suites: 18 passed; full backend: 680 passed, one intentional database skip. Compilation/runtime copy, runtime smoke, targeted lint and formatting pass. See `docs/security/backend-twelve-authentication.md`; SEC-001 remains IN_PROGRESS. Live concurrent issuance and email delivery reliability remain outstanding.

Password-reset checkpoint (2026-09-11): credential replacement now requires a non-deleted target user at write time; a missing/deleted account returns the generic invalid-link error and rolls back token consumption. Focused password suites: 19 passed; full backend: 672 passed, one intentional database skip. Backend compilation/runtime copy, runtime smoke, targeted lint and formatting pass. See `docs/security/backend-twelve-authentication.md`; SEC-001 remains IN_PROGRESS and live concurrency verification is outstanding.

Request-body checkpoint (2026-09-11): recognized malformed JSON, size-limit and unsupported-encoding failures now return safe 400/413/415 contracts instead of 500 errors. Submitted content and parser metadata are omitted. Error suites: 23 passed; full backend: 670 passed, one intentional database skip. Backend compilation/runtime copy, runtime smoke, targeted lint and formatting pass. See `docs/backend/error-contract.md`; SEC-001 remains IN_PROGRESS.

Error-boundary checkpoint (2026-09-11): the active TypeScript HTTP handler now normalizes untrusted errors regardless of attached status/code fields and safely handles null/undefined failures. Genuine application error contracts remain supported. Error suites: 17 passed; full backend: 664 passed, one intentional database skip. Backend compilation/runtime copy, runtime smoke, targeted lint and formatting pass. See `docs/backend/error-contract.md`; SEC-001 remains IN_PROGRESS.

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

SEC-001 Phase 45 checkpoint (2026-09-10): payroll creation requires the authenticated actor and atomically commits a CREATE audit with the draft and employee items. Persistence copies only period dates from caller input. Four new regression tests cover controller identity, empty payrolls, missing actors, field overrides and run/item/audit/commit failures. Focused HR/payroll: 21 passed. Full backend: 476 passed, one intentional live-database skip. Backend build, targeted lint, formatting and diff checks pass. SEC-001 remains IN_PROGRESS for live transaction verification and remaining module/compliance audits.

SEC-001 Phase 46 checkpoint (2026-09-10): library services reject missing school ownership before persistence. Returns conditionally claim the original scoped BORROWED loan before releasing its scoped BORROWED copy, preventing stale duplicate returns from releasing re-borrowed copies. Six behavioral regressions cover ownership, stale claims and transaction failures. Focused library suite: 10 passed. Full backend: 482 passed, one intentional live-database skip. Backend build, targeted lint, formatting and diff checks pass. SEC-001 remains IN_PROGRESS; live race verification and remaining library/module/compliance audits are outstanding.

SEC-001 Phase 47 checkpoint (2026-09-10): library creation operations persist only supported fields and retain server-controlled ownership and initial status. Book/copy creation and borrowing verify active scoped library/book references inside their transactions. Strict parameter/query objects reject unknown fields. Seven new regressions; focused library suite 17 passed. Full backend 489 passed, one intentional database skip. Backend build, targeted lint, formatting and diff checks pass. SEC-001 remains IN_PROGRESS for borrower eligibility, nested read ownership, audit evidence and live concurrency verification.

SEC-001 Phase 48 checkpoint (2026-09-10): catalog search filters nested copies and validates parent library ownership; circulation reads require ownership throughout loan/copy/book/library relationships. Overview counts share those predicates, retaining owned historical circulation. Five query-contract regressions; focused library suite 22 passed. Full backend 494 passed, one intentional live-database skip. Backend build, targeted lint, formatting and diff checks pass. SEC-001 remains IN_PROGRESS for borrower eligibility, circulation audits, live verification and remaining module/compliance work.

SEC-001 Phase 49 checkpoint (2026-09-10): borrowing and returns require the authenticated actor and commit LibraryLoan audit evidence with loan/copy transitions. Audit failures roll back circulation writes. Focused library suite: 24 passed. Full backend: 496 passed, one intentional live-database skip. Backend build, targeted lint, formatting and diff checks pass. SEC-001 remains IN_PROGRESS for borrower eligibility, live verification and remaining module/compliance work.

SEC-001 Phase 50 checkpoint (2026-09-10): library borrowing verifies an active, non-deleted tenant user inside the circulation transaction before claiming a copy. Missing/inaccessible borrowers cannot trigger circulation writes; historical returns remain available. Focused library suite: 33 passed. Full backend: 512 passed, one intentional database skip. Backend TypeScript compilation/runtime copy, targeted lint, formatting and diff checks pass. SEC-001 remains IN_PROGRESS for live concurrency verification and remaining module/compliance audits.

SEC-001 Phase 51 checkpoint (2026-09-10): library and HR administration now recognize authenticated platform owners without duplicate role assignments. Existing PLATFORM_ADMIN and SCHOOL_ADMIN access is preserved; authentication and school context precede both guards. Six behavioral regressions cover accepted identities, rejected ordinary/forged claims and middleware ordering. Full backend run: 516 passed, two stale source-contract failures and one intentional database skip; both contracts were updated and the affected 15-test suite passed. Backend TypeScript compilation/runtime copy and targeted lint pass. Standard build remains blocked by an EPERM replacing the Prisma Windows engine DLL. SEC-001 remains IN_PROGRESS for live verification and remaining module/compliance audits.

SEC-001 Phase 52 checkpoint (2026-09-10): seven administrator-only routers (academic policies, assets, boarding, finance, payments, timetables and transport) now recognize authenticated platform owners through a shared school administrator guard. Ten new regressions cover identity acceptance/rejection, school-context ordering, endpoint placement and the separate payment webhook entry point. Verification: 29 focused tests pass. Full backend suite: 528 passed, zero failures and one intentional live-database skip. Backend TypeScript compilation, runtime copying, compiled health/protected-route smoke checks, targeted lint, formatting and diff checks pass. Standard npm build remains blocked during Prisma generation by an EPERM replacing query_engine-windows.dll.node; compilation used the existing generated client. SEC-001 remains IN_PROGRESS for mixed-role owner consistency, live verification and remaining compliance work.

SEC-001 Phase 53 checkpoint (2026-09-10): examination/result routes recognize authenticated platform owners while retaining teacher read/mark versus administrator lifecycle boundaries. Mark entry receives authenticated roles/platform ownership separately from caller input, preserving scoped teacher assignments and examination validity checks. Eight new behavioral regressions cover route guards and controller-to-persistence behavior. Verification: 26 focused tests pass. Full backend suite: 536 passed, zero failures and one intentional live-database skip. Backend TypeScript compilation, runtime copying, compiled health/protected-route smoke checks, targeted lint, formatting and diff checks pass using the existing generated Prisma client. Standard npm build was not rerun; the Prisma Windows engine DLL replacement error recorded in Phase 52 remains unverified. SEC-001 remains IN_PROGRESS for attendance, other mixed-role owner consistency, live verification and compliance work.

SEC-001 Phase 54 checkpoint (2026-09-10): attendance recognizes authenticated platform owners through its route and all six service paths, including the post-marking detail read. Authenticated scope/access fields take precedence over request input, and session creation maps only supported fields. Twelve behavioral regressions preserve teacher assignments, scoped reads/writes, lifecycle checks and actor audits. Verification: 20 focused attendance tests pass. Full backend suite: 548 passed, zero failures and one intentional live-database skip. Backend TypeScript compilation, runtime copying, compiled health/protected-route smoke checks, targeted lint, formatting and diff checks pass using the existing generated Prisma client. Standard npm build was not rerun; the Prisma Windows engine DLL replacement error recorded in Phase 52 remains unverified. SEC-001 remains IN_PROGRESS for remaining mixed-role owner consistency, live verification and compliance work.

SEC-001 Phase 55 checkpoint (2026-09-10): analytics exports and communication administration recognize authenticated platform owners through the shared administrator guard. Personal communication routes retain existing user access. Seven behavioral regressions cover ordering, four administrator endpoints, accepted/rejected identities and personal-route boundaries. Verification: 24 focused tests pass. Full backend suite: 555 passed, zero failures and one intentional live-database skip. TypeScript compilation, runtime copying, compiled health/protected-route smoke checks, targeted lint, formatting and diff checks pass using the existing generated Prisma client. Standard npm build was not rerun; the Prisma Windows engine DLL replacement issue recorded in Phase 52 remains unverified. SEC-001 remains IN_PROGRESS for remaining mixed-role authorization, live verification and compliance work.

SEC-001 Phase 56 checkpoint (2026-09-10): teacher administrator endpoints recognize authenticated platform owners while preserving existing administrator role codes and the teacher-only self-profile route. Verification: all nine focused teacher tests pass, including four new behavioral regressions. TypeScript compilation, runtime copying, compiled health/protected-route smoke checks, targeted lint, formatting and diff checks pass. The full suite was not rerun for this route-only change; the latest full run in Phase 55 had 555 passed and one intentional live-database skip. Compilation used the existing Prisma client; the prior Windows DLL regeneration issue remains unverified. SEC-001 remains IN_PROGRESS for remaining authorization, live verification and compliance work.

SEC-001 Phase 57 checkpoint (2026-09-10): digital classroom routes and membership services recognize persisted platform ownership through an authenticated access object. Teacher ownership, school scope and classroom-owner removal protection remain enforced. Verification: all 19 focused classroom/record-code tests pass, including nine new behavioral regressions. TypeScript compilation, runtime copying, compiled health/protected-route smoke checks, targeted lint, formatting and diff checks pass. Full backend suite and Prisma regeneration were not rerun; the latest full run in Phase 55 had 555 passed and one intentional database skip, and the prior Windows DLL regeneration issue remains unverified. SEC-001 remains IN_PROGRESS.

SEC-001 Phase 58 checkpoint (2026-09-10): assignment routes and services recognize authenticated platform owners while preserving classroom teacher membership, learner visibility, school scope and lifecycle checks. Verification: all 19 focused assignment, visibility and classroom-calendar tests pass, including six new behavioral regressions. TypeScript compilation, runtime copying, compiled health/protected-route smoke checks, targeted lint, formatting and diff checks pass. Full backend suite and Prisma regeneration were not rerun; the latest full run in Phase 55 had 555 passed and one intentional database skip. The prior Windows DLL regeneration issue remains unverified. SEC-001 remains IN_PROGRESS.

SEC-001 Phase 59 checkpoint (2026-09-11): materials recognize authenticated platform ownership across routes and services. Upload authorization now precedes private blob storage and remains checked before persistence. Verification: all 12 focused material tests pass, including seven new behavioral regressions. TypeScript compilation, runtime copying, compiled health/protected-route smoke checks, targeted lint, formatting and diff checks pass. Full backend suite and Prisma regeneration were not rerun; the latest full run in Phase 55 had 555 passed and one intentional database skip. The prior Windows DLL regeneration issue remains unverified. SEC-001 remains IN_PROGRESS.

SEC-001 Phase 60 checkpoint (2026-09-11): live-session and recording controllers/services recognize authenticated platform owners while retaining scoped classroom membership, teacher management and terminal lifecycle rules. Verification: all 11 focused live-session tests pass, including six new behavioral regressions. TypeScript compilation, runtime copying, compiled health/protected-route smoke checks, targeted lint, formatting and diff checks pass. Full backend suite and Prisma regeneration were not rerun; the latest full run in Phase 55 had 555 passed and one intentional database skip. The prior Windows DLL regeneration issue remains unverified. SEC-001 remains IN_PROGRESS.
