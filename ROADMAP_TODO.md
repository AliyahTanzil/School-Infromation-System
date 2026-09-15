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

SEC-001 logout completion checkpoint (2026-09-15), Codex: delayed logout success/failure preserves a newer token and React user through revision guards. Five new regressions; all 26 authentication-client/provider tests, targeted ESLint and frontend production build pass. Local cleanup on failed logout remains covered. SEC-001 stays IN_PROGRESS; browser cookie and server revocation ordering remain unverified.

SEC-001 continuation (2026-09-15), Codex: IN_PROGRESS. Prevent delayed logout success/failure from clearing a newer client token or React user, while retaining failed-request local logout.

SEC-001 startup restoration checkpoint (2026-09-15), Codex: the React authentication provider ignores startup identity success/failure after an explicit authentication action and skips identity reads after invalidation or unmount. Eight new provider regressions and thirteen authentication-client tests pass, along with targeted ESLint, formatting and frontend production build. Authentication contract updated. SEC-001 remains IN_PROGRESS; live browser/server ordering remains unverified.

SEC-001 continuation (2026-09-15), Codex: IN_PROGRESS. Prevent startup session restoration from replacing React user state after an explicit authentication action or provider unmount.

SEC-001 delayed authentication checkpoint (2026-09-15), Codex: login/registration responses reject before installing credentials when the authentication revision changes during the request. Six regressions cover logout, replacement sessions and uninterrupted success; all thirteen authentication-client tests, targeted ESLint and frontend production build pass. Updated the authentication contract. SEC-001 remains IN_PROGRESS; live browser cookie ordering is not certified.

SEC-001 continuation (2026-09-15), Codex: IN_PROGRESS. Guard delayed login/registration responses against logout or replacement sessions and verify normal authentication still succeeds.

SEC-001 timetable context checkpoint (2026-09-15), Codex: timetable/staffing reads and mutations no longer send school headers; timetable loading no longer writes legacy school storage. Fifteen focused timetable tests, targeted ESLint and frontend production build pass. Frontend source scan finds no remaining x-school-id headers. Server authenticated ownership and school readiness remain authoritative. SEC-001 acceptance remains open; no live staffing or timetable changes.

SEC-001 continuation (2026-09-15), Codex: IN_PROGRESS. Remove timetable and staffing request school overrides and legacy school storage writes. Verify mocked reads and mutations; live staffing remains paused.

SEC-001 communication/payment checkpoint (2026-09-15), Codex: removed obsolete school headers from communications, notification inbox/preferences and payment reads/mutations. Nineteen focused context tests, targeted ESLint, formatting and frontend production build pass. Remaining module migrations and SEC-001 acceptance stay open; no live notifications or payments were initiated.

SEC-001 continuation (2026-09-15), Codex: IN_PROGRESS. Remove obsolete school headers from communications, notification inbox/preferences and payment requests; preserve authenticated school readiness and verify the checkpoint.

SEC-001 boarding/transport/inventory checkpoint (2026-09-14), Codex: removed obsolete school headers from reads and mutations in all three workspaces. Authenticated school readiness and server ownership remain authoritative. Fifteen focused operational/boarding/context tests, targeted ESLint, formatting and frontend production build pass. Remote editor-status update fast-forwarded without conflicts. Remaining module migrations and SEC-001 acceptance stay open; no live data changes.

SEC-001 continuation (2026-09-14), Codex: IN_PROGRESS. Remove boarding, transport and inventory school header overrides, extend operational context coverage and publish the verified checkpoint.

SEC-001 operational context checkpoint (2026-09-14), Codex: finance, HR and library reads/mutations no longer send school header overrides. Existing authenticated school readiness and server ownership guards remain in force. Seven focused operational/context tests, targeted ESLint, formatting and frontend production build pass. Other module migrations and SEC-001 acceptance remain open; no live data changes.

SEC-001 continuation (2026-09-14), Codex: IN_PROGRESS. Remove obsolete school headers from finance, HR and library requests, preserving authenticated context and server-side ownership; verify and publish.

SEC-001 examination context checkpoint (2026-09-14), Codex: removed school header overrides from examination lifecycle, candidate registration/roster reads and subject scheduling. Existing server-resolved school context, selectors and cancellation remain intact. All 24 examination frontend tests, targeted ESLint, formatting and frontend production build pass. Remaining module migrations and SEC-001 acceptance stay open; no live data changes.

SEC-001 continuation (2026-09-14), Codex: IN_PROGRESS. Remove obsolete examination school headers across lifecycle, scheduling and candidate workflows while preserving authenticated context, request cancellation and scoped selectors. Verify and publish.

SEC-001 academic-policy context checkpoint (2026-09-14), Codex: removed obsolete school headers from policy reads, creation and activation. Existing authenticated context and school-admin API guards remain authoritative; UI school loading/retry and missing-school behavior are preserved. Seven focused policy/context tests, targeted ESLint, formatting and frontend production build pass. Remaining module header migrations and SEC-001 acceptance stay open; no live data changes.

SEC-001 continuation (2026-09-14), Codex: IN_PROGRESS. Remove academic-policy school header overrides from reads, creation and activation; verify authenticated context boundaries and publish the checkpoint.

SEC-001 student-home aggregation checkpoint (2026-09-14), Codex: assignments and calendar events now include every classroom returned by the accessible-classroom API, with a shared 30-day calendar interval and chronological event order. Reads run one classroom at a time (two requests concurrently); failures clear the aggregate and offer retry. Nine focused tests, targeted ESLint, formatting and frontend production build pass. The existing classroom API's 100-record limit and remaining SEC-001 acceptance remain open; no live data changes.

SEC-001 continuation (2026-09-14), Codex: IN_PROGRESS. Aggregate student-home assignments and calendar records across returned accessible classrooms, retaining scoped reads, bounded concurrency and retryable failures. Verify and publish.

SEC-001 student-home checkpoint (2026-09-14), Codex: student home now waits for authenticated school context, ignores cached school identity and omits school request headers. Failures in classroom, notification, assignment or calendar reads show a retryable error and clear stale results. Seven focused dashboard/context tests, targeted ESLint, formatting and frontend production build pass. Assignment/calendar coverage still uses the first accessible classroom; broader aggregation and remaining SEC-001 acceptance remain open. No live data changes.

SEC-001 continuation (2026-09-14), Codex: IN_PROGRESS. Migrate student home to authenticated school context and show retryable data failures; verify the scoped request flow and publish the checkpoint.

SEC-001 live-learning checkpoint (2026-09-14), Codex: Live learning now waits for authenticated school context, ignores cached school identity and omits school header overrides. Session or recording read failures show a retryable error instead of silently appearing empty; selection no longer triggers redundant reloads, and refreshed lists reconcile the selected session. Five focused workspace/context tests, targeted ESLint, formatting and frontend production build pass. No backend or live data changes; SEC-001 remains IN_PROGRESS for remaining migrations and acceptance work.

SEC-001 continuation (2026-09-14), Codex: IN_PROGRESS. Migrate live learning away from cached school identity, enforce context loading/recovery boundaries, and surface failed session/recording reads rather than presenting failed requests as empty data. Verify and publish this checkpoint.

SEC-001 GitHub delivery checkpoint (2026-09-14), Codex: full verification found and fixed the teacher self-profile owner-bypass regression using explicit role membership, and updated the administration navigation expectation for Email setup. Backend: 743 passed, zero failed, one intentional database skip; frontend: 131 passed across 38 files. Repository lint, staged-file formatting/diff checks, Prisma generation, backend compilation/runtime copy and compiled-route smoke checks, and frontend production build pass. Frontend build/tests required outside-sandbox execution after esbuild directory-access failures. Live browser/recovery delivery and remaining SEC-001 acceptance are still outstanding; timetable staffing remains paused. Publication excludes editor status and local verification logs.

SEC-001 delivery continuation (2026-09-14), Codex: IN_PROGRESS. Validate accumulated roadmap work for GitHub publication. Full frontend testing found one stale administration navigation expectation after adding Email setup; update that contract, normalize changed-file formatting, and complete backend/frontend verification before pushing.

SEC-001 assessment classroom checkpoint (2026-09-14), Codex: Classroom quizzes now uses accessible classroom choices from the existing scoped API instead of a cached/manual classroom UUID. Added loading/retry/empty states, clears quiz/attempt/editor state on switches, and ignores responses from previous classroom selections. Six focused assessment/context tests, targeted ESLint, formatting and frontend production build pass. Existing classroom API pagination limits and remaining workspace migrations remain open; SEC-001 remains IN_PROGRESS. No live records changed.

SEC-001 continuation (2026-09-14), Codex: IN_PROGRESS. Replace AssessmentEngine manual classroom identity with accessible classroom choices, loading/retry/empty states, and stale-response guards across classroom switches.

SEC-001 assessment school-context checkpoint (2026-09-14), Codex: AssessmentEngine now uses authenticated school context, with loading/retry/missing-school states. Removed the editable and session-stored school identity and all school header overrides across quiz reads, authoring, publication and attempt operations. Four focused assessment/context tests, targeted ESLint, formatting and frontend production build pass. The assessment Classroom UUID input remains a follow-up; SEC-001 remains IN_PROGRESS. No live records changed.

SEC-001 continuation (2026-09-14), Codex: IN_PROGRESS. Migrate AssessmentEngine school identity to authenticated context, remove stored/manual school identity and header overrides across quiz operations, and verify context recovery and mutation requests. Classroom selector migration remains a subsequent step.

SEC-001 classroom selection checkpoint (2026-09-14), Codex: My work now lists accessible classrooms from the existing membership-scoped API and ignores cached classroom IDs. Added classroom loading/retry/empty states; selection changes clear assignment details and abort/ignore prior reads. Six focused workspace/context tests, targeted ESLint, formatting and frontend production build pass. The existing classroom API returns at most 100 records; pagination and other workspace migrations remain outstanding. No live school records changed; SEC-001 remains IN_PROGRESS.

SEC-001 continuation (2026-09-14), Codex: IN_PROGRESS. Replace the student submission Classroom UUID field with accessible classroom choices from the existing scoped API, including loading/retry/empty states and protection against stale assignment responses when switching classrooms.

SEC-001 student submission checkpoint (2026-09-14), Codex: My work now resolves the authenticated school through useSchoolContext, waits for context recovery, and shows missing-school guidance. Removed the editable/session-stored school ID and x-school-id overrides from assignment reads, submission reads, saves and retractions. Four focused workspace/context tests, targeted ESLint, formatting and frontend production build pass. The classroom UUID input and other workspace migrations remain outstanding; SEC-001 remains IN_PROGRESS. No live school data changed.

SEC-001 continuation (2026-09-14), Codex: IN_PROGRESS. Migrate the student submission workspace from session-stored/manual school identity to authenticated school context, remove school header overrides, and verify loading/error/missing-school boundaries. Classroom selection and the remaining workspace migrations are separate follow-ups.

SEC-001 email setup verification checkpoint (2026-09-14), Codex: persisted SMTP settings/access/email tests: 12 passed; frontend email setup/reset/authentication-client tests: 16 passed. Targeted ESLint and frontend production build pass. Frontend tests required an outside-sandbox retry after esbuild directory-access denial. No implementation failures were found in these checks; no live settings, credentials or school records were changed. Provider delivery, browser journeys and remaining SEC-001 acceptance remain unverified, so SEC-001 is not DONE. Timetable staffing remains paused.

SEC-001 continuation (2026-09-14), Codex: IN_PROGRESS. Resume roadmap work at the administrator email setup checkpoint: verify persisted SMTP settings, authorization and frontend recovery/setup behavior, address any failures, and record the checks separately from live provider delivery. Timetable staffing remains paused pending school-provided mappings.

SEC-001 continuation (2026-09-14), Codex: IN_PROGRESS. User requested an administrator SMTP setup page. Add encrypted persisted email settings, verify the SMTP connection before activation, and apply saved settings to recovery emails without a server restart. Live delivery still requires provider credentials and a connected browser.

SEC-001 verification checkpoint (2026-09-14), Codex: BLOCKED on external browser/recovery prerequisites. All four configured development roles passed live API login, httpOnly refresh-cookie rotation, identity, configured-school access, logout and revoked-credential rejection; the parent check respected the 296-second Retry-After. Correct-loader backend recovery suites: 22 passed; frontend recovery/session suites: 11 passed. Browser discovery returned no connected browsers/apps. Configuration presence checks confirmed SMTP_HOST, SMTP_USER and SMTP_PASSWORD absent; the JSON transport does not deliver recovery mail. No credentials changed and no recovery email was sent. Connect a browser and configure the intended SMTP transport before completing browser/recovery acceptance. Later dependent tasks remain blocked.

SEC-001 continuation (2026-09-14), Codex: IN_PROGRESS. Recheck live development-role authentication after teacher profile reconciliation and inspect recovery transport readiness without exposing credentials or sending recovery messages.

SEC-001 teacher-account checkpoint (2026-09-14), Codex: completed the previously blocked live reconciliation subtask. Preview found seven active teacher accounts and six missing links. Repair created five school teacher profiles and linked one existing profile. A second apply found zero missing profiles and performed zero writes. All eight focused reconciliation/atomic-creation tests passed. No credentials or timetable teaching assignments changed. SEC-001 remains IN_PROGRESS; browser authentication, recovery delivery and remaining security acceptance criteria are not certified by this repair.

SEC-001 continuation (2026-09-14), Codex: IN_PROGRESS. Resume the pending teacher-account reconciliation checkpoint using the restored hosted-database connection: preview account/profile links, verify the existing reconciliation tests, apply unambiguous repairs, and verify idempotency. Timetable subject staffing remains explicitly paused by the user.

SEC-001 owner teacher-workspace continuation (2026-09-13), Codex: IN_PROGRESS. Correcting /teachers to open school teacher management for authenticated owners/administrators, while preserving the personal teacher dashboard and its teacher-only API.

Teacher-account checkpoint (2026-09-13), Codex: user-management creation now atomically creates school-owned teacher profiles for TEACHER accounts; an idempotent preview/apply repair links existing accounts without changing credentials or existing lifecycle state. Eight focused tests pass, including account/profile/audit rollback; full backend run: 722 passed, zero failures, one intentional skip (the two new creation tests also passed separately). Lint, formatting, compilation/runtime copy and smoke checks pass. Live preview found seven active teacher accounts and six missing profiles. Repair could not run because subsequent connections target unavailable localhost:5432. User confirmed the existing hosted database is intended; awaiting its connection configuration. No existing teacher records were changed. SEC-001 remains IN_PROGRESS; live repair is blocked on hosted database access.

SEC-001 teacher-account continuation (2026-09-13), Codex: IN_PROGRESS. Repairing the missing school teacher records for existing teacher login accounts and creating linked records atomically for future teacher accounts. Preserve existing profiles, lifecycle state, school ownership and credentials.

SEC-001 live diagnostic checkpoint (2026-09-13), Codex: ran the compiled backend with updated transaction diagnostics on an ephemeral localhost port, leaving the existing server untouched. The sandboxed attempt returned DATABASE_UNAVAILABLE; the approved outside-sandbox retry passed the complete STUDENT login, refresh rotation, identity, school, logout and revoked-credential journey. The temporary server and database client closed afterward. P2028 did not recur, so its cause remains unconfirmed. The live verifier now supports a validated SAIS_VERIFY_BACKEND_PORT override for temporary local servers; formatting and live execution pass. No account credentials or environment files changed. SEC-001 remains IN_PROGRESS.

SEC-001 diagnostic checkpoint (2026-09-13), Codex: both HTTP error handlers now log fixed server-only P2028 categories with request correlation; raw Prisma diagnostics remain excluded from the field and API responses. Twenty-two focused tests pass; full backend: 716 passed, zero failures, one intentional live-database skip. Targeted lint/formatting, compilation/runtime copy and compiled-route smoke checks pass. Updated the runbook and authentication contract. A fresh failure on the updated runtime is still needed to identify the recurring login transaction cause; SEC-001 remains IN_PROGRESS.

SEC-001 continuation (2026-09-13), Codex: IN_PROGRESS. Adding allowlisted, server-only transaction failure categories to correlated error logs so recurring P2028 failures can be investigated without exposing raw database diagnostics.

SEC-001 live checkpoint (2026-09-13), Codex: administrator, teacher and parent passed live login, refresh-cookie rotation, identity, configured-school access, logout and revoked-credential rejection. Student login returned HTTP 503 / DB_P2028, request ID `fc859ddb-df6a-4135-9e47-429ca50b3418`; the earlier transaction issue therefore affects more than the administrator role and is not resolved. Rate-limit Retry-After was respected. Read-only configuration inspection confirmed SMTP_HOST is absent: the current JSON transport cannot deliver recovery email. Added SMTP/recovery setup instructions to docs/RUNBOOK.md and corrected stale logging comments. No credentials or environment values changed. SEC-001 remains IN_PROGRESS.

SEC-001 verification (2026-09-13), Codex: authentication email logs no longer include rendered message previews containing reset/verification tokens. Nine focused recovery tests pass; full backend suite: 714 passed, zero failures, one intentional live-database skip. Targeted lint/formatting, compilation/runtime copy and compiled-route smoke checks pass. External delivery, browser journeys and the earlier administrator transaction failure remain unresolved; SEC-001 remains IN_PROGRESS.

SEC-001 continuation (2026-09-13), Codex: IN_PROGRESS. Removing authentication email bodies and bearer links from development transport logs and verifying reset/verification delivery payloads with a captured transport.

SEC-001 verification checkpoint (2026-09-13), Codex: frontend production build and all 109 tests across 33 files pass. Tests required an outside-sandbox retry after esbuild directory-access denial. Browser discovery returned no connected apps or browsers, so live UI verification could not proceed; recovery email delivery also remains unverified. SEC-001 remains IN_PROGRESS. No application code or live credentials changed in this checkpoint.

SEC-001 verification (2026-09-13): completed the missing public reset-password page and successful-reset local session clearing. All 109 frontend tests pass, including public route and recovery-flow regressions. No live credentials changed; browser and email-delivery verification remain outstanding. SEC-001 remains IN_PROGRESS.

SEC-001 continuation (2026-09-13), Codex: IN_PROGRESS. Completing the missing public `/reset-password` frontend journey linked from recovery emails, including validation, failed-link handling, and local session clearing after reset.

SEC-001 verification (2026-09-13): correlated administrator failure to `DB_P2028`; mapped transaction errors to a redacted HTTP 503 response and added safe server-error correlation output to the live verifier. Twenty focused tests and targeted lint pass. Underlying transaction failure investigation, browser verification, and recovery delivery remain open; SEC-001 remains IN_PROGRESS.

SEC-001 continuation (2026-09-13), Codex: IN_PROGRESS. Investigating the administrator login failure. Runtime log correlates request `6c366596-759d-49ec-92d4-a0bcb9d5afb4` with `DB_P2028`; improving the transaction-failure response and live-verifier diagnostics without retrying authentication mutations automatically.

SEC-001 verification (2026-09-13): all four development roles pass live API login, refresh-cookie rotation, identity, configured school, logout, and revoked-credential rejection. Administrator passed on isolated retry following one unexplained HTTP 500; rate-limit waits were respected. Backend: 711 passed, zero failures, one intentional skip. Phase 0 account-bootstrap checkbox completed; browser and password-recovery delivery verification remain open. SEC-001 remains IN_PROGRESS.

SEC-001 continuation (2026-09-13), Codex: provisioned the four configured development accounts in the existing school. Fixed the shared frontend school-context request from the nonexistent `/school-setup` API to `/school`; page navigation stays `/school-setup`. Added a canonical-response regression and reusable live authentication verifier. Frontend: 103 tests, targeted lint and production build pass. Browser verification remains unavailable because no browser is connected.

SEC-001 continuation (2026-09-13), Codex: IN_PROGRESS. Aligning the development-role bootstrap with the configured single school before Phase 0 authentication verification. Read-only database checks found none of the four configured development accounts; no live accounts have been changed.

SEC-001 verification (2026-09-13): development bootstrap selects the configured or sole existing school without creating/renaming schools or tenants. Missing/ambiguous schools and inactive tenants fail before provisioning. Four focused bootstrap tests pass. Runbook ordering corrected to bootstrap the school before role accounts. Live provisioning and browser journeys remain outstanding.

SEC-001 continuation (2026-09-11): session deletion validates UUID parameters after authentication, with regressions for invalid IDs and server-controlled revocation context. Focused route/revocation suites: 13 passed; full backend: 684 passed, one intentional database skip. Compilation/runtime copy, runtime smoke, targeted lint and formatting pass. See `docs/security/backend-twelve-authentication.md`. SEC-001 remains IN_PROGRESS.

SEC-001 continuation (2026-09-11): fail-closed user/session identity checks before session listing or revocation. Regression coverage verifies 28 invalid-input combinations make zero database calls. Focused session suites: 27 passed; full backend: 681 passed, one intentional database skip. Compilation/runtime copy, runtime smoke, targeted lint and formatting pass. See `docs/security/backend-twelve-authentication.md`. SEC-001 remains IN_PROGRESS.

SEC-001 continuation (2026-09-11): atomic reset/verification token replacement with delivery after commit. Eight new regressions cover success and invalidation/insertion/commit failures across both token types. Focused issuance/reset suites: 18 passed; full backend: 680 passed, one intentional database skip. Compilation/runtime copy, runtime smoke, targeted lint and formatting pass. See `docs/security/backend-twelve-authentication.md`. SEC-001 remains IN_PROGRESS; live concurrent issuance and email delivery reliability remain outstanding.

SEC-001 continuation (2026-09-11): password resets conditionally update non-deleted accounts and reject missing/deleted targets with full transaction rollback. Focused password suites: 19 passed; full backend: 672 passed, one intentional database skip. Backend compilation/runtime copy, runtime smoke, targeted lint and formatting pass. See `docs/security/backend-twelve-authentication.md`. SEC-001 remains IN_PROGRESS; live concurrency verification is outstanding.

SEC-001 continuation (2026-09-11): normalized recognized body-parser failures into safe 400/413/415 responses with active API regression coverage. Error suites: 23 passed; full backend: 670 passed, one intentional database skip. Backend compilation/runtime copy, runtime smoke, targeted lint and formatting pass. See `docs/backend/error-contract.md`. SEC-001 remains IN_PROGRESS.

SEC-001 continuation (2026-09-11): closed the active HTTP handler's structural error-trust bypass and null/undefined failure handling. Seventeen focused tests pass; full backend 664 passed, one intentional database skip. Backend compilation/runtime copy, runtime smoke, targeted lint and formatting pass. See `docs/backend/error-contract.md`. SEC-001 remains IN_PROGRESS.

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

### DB-001 â€” Reconcile active Prisma schema with services and routes

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

| 2026-09-08 | SEC-001 | Codex | IN_PROGRESS | Phase 9: remove sign-in account enumeration across missing, suspended, pending and temporarily locked identities while retaining internal failure telemetry. |

| 2026-09-08 | SEC-001 | Codex | CHECKPOINT | Phase 9 completed: sign-in now returns one generic authentication failure for missing, suspended, pending and locked accounts, performs bcrypt work for unknown identities, and retains specific internal failure telemetry. The focused regression, backend build, targeted lint and diff check pass. Full backend suite reports 336 passed/1 intentional skip/3 pre-existing subject-class contract failures unrelated to SEC-001. SEC-001 remains IN_PROGRESS. |

| 2026-09-08 | SEC-001 | Codex | IN_PROGRESS | Phase 10: make successful login state, session/token/device issuance and success auditing one atomic transaction with rollback coverage. |

| 2026-09-08 | SEC-001 | Codex | CHECKPOINT | Phase 10 completed: successful-login state, login-attempt telemetry, session, initial refresh token, remembered device and success audit now commit through the same transaction. Failures return no credentials and roll back the entire issuance. Nine focused auth/session tests, backend build, targeted lint and diff check pass. SEC-001 remains IN_PROGRESS. |

| 2026-09-08 | SEC-001 | Codex | IN_PROGRESS | Phase 11: make failed-password counter/lockout changes, attempt telemetry and security auditing atomic under concurrent requests. |

| 2026-09-08 | SEC-001 | Codex | CHECKPOINT | Phase 11 completed: invalid-password counter/lockout updates, attempt telemetry and login auditing now commit in one serializable transaction. Current account state is re-read inside the transaction, and write failures roll back every related record. Thirteen focused auth/session tests, backend build, targeted lint and diff check pass. SEC-001 remains IN_PROGRESS. |

| 2026-09-08 | SEC-001 | Codex | IN_PROGRESS | Phase 12: add configurable database-backed per-IP login throttling so brute-force limits survive restarts and multiple application instances. |

| 2026-09-08 | SEC-001 | Codex | CHECKPOINT | Phase 12 completed: login now checks persisted recent failure counts for both the submitted email and client IP before credential lookup. The configurable per-IP threshold defaults to 25 to accommodate shared school networks and complements the process-local HTTP limiter. Fourteen focused auth/session tests, backend build, targeted lint and diff check pass; environment and backend configuration docs are updated. SEC-001 remains IN_PROGRESS. |

| 2026-09-08 | SEC-001 | Codex | IN_PROGRESS | Phase 13: fail startup for invalid brute-force thresholds or lockout durations instead of silently accepting unsafe zero, negative, fractional or malformed values. |

| 2026-09-08 | SEC-001 | Codex | CHECKPOINT | Phase 13 completed: explicit brute-force thresholds and lockout durations must be positive safe integers; invalid zero, negative, fractional, malformed or unsafe values fail startup while omitted values retain defaults. Fifteen focused tests, backend build, targeted lint and diff check pass. SEC-001 remains IN_PROGRESS. |

| 2026-09-08 | SEC-001 | Codex | IN_PROGRESS | Phase 14: prevent forged `x-forwarded-for` headers from bypassing login throttling or corrupting audit IP attribution when proxy trust is disabled. |

| 2026-09-08 | SEC-001 | Codex | CHECKPOINT | Phase 14 completed: request context and rate-limit keys now use only Express-resolved `req.ip`, which applies the configured proxy-trust policy. Direct `x-forwarded-for` parsing was removed, spoofed headers are ignored without trusted proxy configuration, and trusted deployments retain resolved client IPs. Eighteen focused tests, backend build, targeted lint and diff check pass; environment and backend docs are updated. SEC-001 remains IN_PROGRESS. |

| 2026-09-08 | SEC-001 | Codex | IN_PROGRESS | Phase 15: normalize IPv6 login-throttle identities to a /64 allocation so rotating interface addresses cannot reset HTTP or persisted brute-force counters. |

| 2026-09-08 | SEC-001 | Codex | CHECKPOINT | Phase 15 completed: process-local and persisted login throttles share a canonical IP identity; IPv6 addresses are grouped by /64, while IPv4 and IPv4-mapped addresses remain address-specific. Login-attempt throttle records use the normalized key, while sessions and security audits retain the full Express-resolved IP. Nineteen focused auth/context tests, backend build, targeted lint and diff check pass. SEC-001 remains IN_PROGRESS. |

| 2026-09-08 | SEC-001 | Codex | IN_PROGRESS | Phase 16: prevent unauthenticated self-registration of immediately active staff, teacher, parent or student identities; retain only the approval-based administrator application flow. |

| 2026-09-08 | SEC-001 | Codex | CHECKPOINT | Phase 16 completed: the public registration validator accepts only `TENANT_ADMIN`, and the controller enforces that type independently. Staff, teacher, parent and student identities must use authenticated administrator provisioning. The frontend no longer submits staff self-registration and directs staff back to administrator-issued sign-in. Four focused backend tests, 37 frontend tests, both production builds, targeted lint and diff check pass. SEC-001 remains IN_PROGRESS. |

| 2026-09-08 | SEC-001 | Codex | CHECKPOINT | Phase 13 completed: `MAX_FAILED_LOGINS`, `MAX_FAILED_LOGINS_PER_IP` and `ACCOUNT_LOCKOUT_MINUTES` now accept only positive safe integers when explicitly configured; zero, negative, fractional, malformed and unsafe numeric values fail startup. Defaults remain unchanged when variables are omitted. Fifteen focused auth/config/session tests, backend build, targeted lint and diff check pass; configuration documentation is updated. SEC-001 remains IN_PROGRESS. |
| 2026-09-07 | SEC-001 | Codex | IN_PROGRESS | Phase 9: reject access tokens without expiry, with empty identity claims or inconsistent session aliases; preserve valid legacy sid-only tokens. |

| 2026-09-07 | SEC-001 | Codex | CHECKPOINT | Phase 9 implemented: access tokens require HS256, finite expiry, nonblank identity and consistent session aliases while retaining valid sid-only compatibility. All 13 focused token tests, backend build, focused lint and diff check pass. Full backend suite fails in subject-creation coverage requiring classAssignments (including recordCode.test.js and subjectDomain.test.js); subject implementation was not modified by this checkpoint. SEC-001 remains IN_PROGRESS, full-suite acceptance not achieved. |

User-directed scope change, 2026-09-07: prioritize application-wide CRUD completion. Begin with subject end-to-end editing and soft deletion; inventory in docs/audit/crud-coverage-2026-09-07.md. SEC-001 remains unfinished; no completion claim.

| 2026-09-08 | SEC-001 | Codex | IN_PROGRESS | Phase 17: eliminate deployment-dependent security drift by making the compiled TypeScript backend the only application composition root. |

| 2026-09-08 | SEC-001 | Codex | CHECKPOINT | Phase 17 completed: removed duplicate JavaScript bootstraps; development, npm production startup, Docker and serverless deployment now share the compiled TypeScript app. Docker builds and runs `dist/main.js`, its health check uses `/api/v1/health/live`, configured proxy/CORS and compatibility routes are preserved, and rejected origins receive request IDs. The 25-test route/composition suite, backend build, compiled-artifact verification, targeted lint and diff check pass. Full backend suite: 369 passed, one intentional skip and one pre-existing class contract failure. Docker unavailable locally; static definition coverage passes. SEC-001 remains IN_PROGRESS. |

User-directed UI checkpoint, 2026-09-08: repaired shared light/dark theme boundaries so authentication and operational page text remains readable. WCAG contrast regressions, all 40 frontend tests, production build, targeted lint and diff check pass. Browser screenshot verification remains pending because no browser-control surface was available. SEC-001 status is unchanged.

| 2026-09-08 | SEC-001 | Codex | IN_PROGRESS | Phase 18: begin the mounted-route authorization and single-school scope audit with canonical permission-code validation and digital-classroom mutation boundaries. |

| 2026-09-08 | SEC-001 | Codex | CHECKPOINT | Phase 18 authorization wave 1 completed: corrected active student `students.*` and school administrator `schools.assign` permission checks, added a repository-wide route-to-catalog drift regression, and role-gated digital-classroom create/member/archive mutations while retaining service owner and school-scope enforcement. Eight focused tests, backend build, targeted lint and diff check pass. Full backend suite: 372 passed, one intentional skip and the same pre-existing class source-contract failure. SEC-001 remains IN_PROGRESS for the remaining mounted routers and compliance controls. |

| 2026-09-08 | SEC-001 | Codex | IN_PROGRESS | Phase 19: continue the mounted-route audit by preventing analytics controllers from discarding the resolved single-school context and by protecting analytics export mutations. |

| 2026-09-08 | SEC-001 | Codex | CHECKPOINT | Phase 19 authorization wave 2 completed: analytics overview, KPIs, learning data and exports now use server-resolved tenant/school context and fail closed when either value is absent; export requests require administrator roles. Corrected the stale class contract to require the implementation's stronger tenant, school and soft-delete lookup. Eighteen focused tests, backend build, targeted lint and diff check pass. Full backend suite passes: 374 tests, one intentional live-database skip. SEC-001 remains IN_PROGRESS for remaining mounted routers and compliance controls. |

| 2026-09-08 | SEC-001 | Codex | IN_PROGRESS | Phase 20: audit the actively mounted billing surface and prevent incomplete lifecycle or unsigned webhook processing while SaaS-001 remains blocked. |

| 2026-09-08 | SEC-001 | Codex | CHECKPOINT | Phase 20 authorization wave 3 completed: `/api/billing` and `/api/v1/billing` now fail closed with `501 FEATURE_NOT_IMPLEMENTED` and `requiredTask: SaaS-001`; provisional lifecycle mutations and unsigned webhook handlers are no longer mounted. Seventeen focused runtime/composition/authorization tests, backend build, targeted lint and diff check pass. Full backend suite passes: 375 tests, one intentional live-database skip. SEC-001 remains IN_PROGRESS for remaining mounted routers and compliance controls. |

| 2026-09-08 | SEC-001 | Codex | IN_PROGRESS | Phase 21: reconcile the owner activation workflow with the canonical server, strict input validation and defense-in-depth owner/lifecycle authorization. |

| 2026-09-08 | SEC-001 | Codex | CHECKPOINT | Phase 21 authorization wave 4 completed: mounted activation requests on both API prefixes; require authenticated `APPLICATION_MANAGER` plus `OWNER` at route and service layers; validate UUID and explicit approve/reject decisions; and conditionally activate only current, non-deleted pending applicants so lifecycle drift rolls back. Payment webhook verification was reviewed and retained. Five focused and nineteen combined tests, backend build, targeted lint and diff check pass. Full backend suite passes: 378 tests, one intentional live-database skip. SEC-001 remains IN_PROGRESS for remaining mounted routers and compliance controls. |

| 2026-09-08 | SEC-001 | Codex | IN_PROGRESS | Phase 22: audit parent-to-student authorization, configured-school boundaries and mutation validation. |

| 2026-09-08 | SEC-001 | Codex | CHECKPOINT | Phase 22 authorization wave 5 completed: parent routes now resolve the configured school before parent context; portal relationships and link targets require active enrollment in that school; self-requested links remain pending; and profile/link/unlink schemas now match the shared validator with strict body and UUID validation. Eight focused tests, backend build, targeted lint and diff check pass. Full backend suite passes: 378 tests, one intentional live-database skip. SEC-001 remains IN_PROGRESS for remaining mounted routers and compliance controls. |

| 2026-09-09 | CLS-001 | Codex | CHECKPOINT | Class setup refinement completed: the UI offers a year-only selector and exactly four canonical school stages (Pre-School Nursery, Primary School, Junior Secondary, Senior Secondary). The API validates the taxonomy, reuses or provisions the selected tenant academic year and school grade level, and creates the class in one transaction. Six focused backend tests, one focused frontend behavior test, both production builds, targeted lint and diff check pass. Full backend suite: 380 passed, one intentional database skip. Full frontend suite: 41 passed. SEC-001 remains IN_PROGRESS. |

| 2026-09-09 | SEC-001 | Codex | IN_PROGRESS | Phase 23: audit examination and result lifecycle authorization, teacher mark-entry ownership, school-scoped candidate lookup, and route identifier validation. |

| 2026-09-09 | SEC-001 | Codex | CHECKPOINT | Phase 23 authorization wave 6 completed: teachers retain scoped examination/result reads but exam creation, candidate/schedule administration, lifecycle transitions, result processing, publishing and locking require platform or school administration. Teacher mark entry now requires an active school teacher identity and matching active class-subject teaching assignment; administrators retain override access. Candidate lookup includes tenant, school and soft-delete scope, and examination detail IDs require UUID validation. Twenty-one focused tests, backend build, targeted lint and diff check pass. Full backend suite: 386 passed, one intentional live-database skip. SEC-001 remains IN_PROGRESS. |

| 2026-09-09 | SEC-001 | Codex | IN_PROGRESS | Phase 24: audit attendance teacher ownership, session identifier validation, authenticated actor persistence, and removal of manual school/class UUIDs from the normal workflow. |

| 2026-09-09 | SEC-001 | Codex | CHECKPOINT | Phase 24 authorization wave 7 completed: attendance list/options/create/read/mark/status operations now limit teachers to active class or teaching assignments while administrators retain school-wide access. Session IDs are UUID-validated, session creation records the authenticated actor correctly, and the UI derives school scope from authentication and uses an authorized class selector instead of School/Class UUID fields. Eight focused backend tests and one focused frontend behavior test pass. Full backend suite: 390 passed, one intentional live-database skip; full frontend suite: 42 passed. Both builds, targeted lint, formatting and diff check pass. SEC-001 remains IN_PROGRESS. |

| 2026-09-09 | SEC-001 | Codex | IN_PROGRESS | Phase 25: audit canonical student-administration input validation, authenticated tenant ownership, bounded listing, and dashboard evidence accuracy. |

| 2026-09-09 | SEC-001 | Codex | CHECKPOINT | Phase 25 authorization wave 8 completed: student list/detail/create/update/guardian requests now use strict bounded schemas, validate UUIDs, reject future birth dates and caller-controlled ownership fields, and derive tenant scope only from the authenticated school context. The dashboard now displays persisted totals and visible records instead of fabricated enrollment/review metrics. Five focused backend tests and one focused frontend behavior test pass. Full backend suite: 393 passed, one intentional live-database skip; full frontend suite: 42 passed. Both builds, targeted lint, formatting and diff check pass. SEC-001 remains IN_PROGRESS. |

| 2026-09-09 | SEC-001 | Codex | IN_PROGRESS | Phase 26: audit canonical teacher self-service and administration for configured-school ownership, strict lifecycle inputs, bounded directory reads, and removal of client-selected school headers. |

| 2026-09-09 | SEC-001 | Codex | CHECKPOINT | Phase 26 authorization wave 9 completed: teacher self-service now resolves the authenticated single-school context before a tenant-and-school-scoped profile lookup. Administrator list/detail/create/status routes include platform owners, validate strict persisted fields and UUIDs, reject forged ownership and unsupported status values, and cap pages at 100 records. The teacher workspace no longer reads or sends a school-selection header. Focused backend teacher suite: 5 passed; focused frontend contract: 1 passed. Full backend suite: 395 passed, one intentional live-database skip; full frontend suite: 43 passed. Both builds, targeted lint, formatting and diff check pass. SEC-001 remains IN_PROGRESS. |

| 2026-09-09 | SEC-001 | Codex | IN_PROGRESS | Phase 27: audit canonical user-management identity scoping, dynamic-route validation, profile/image transaction boundaries, push-token ownership, and provisioning UI account types. |

| 2026-09-09 | SEC-001 | Codex | CHECKPOINT | Phase 27 authorization wave 10 completed: all dynamic user routes validate UUIDs and strict active-schema inputs; profile and profile-image operations verify authenticated tenant ownership and commit mutations with their audits; push-token registration cannot override the authenticated user; preference fields map into the persisted JSON settings column; and the provisioning UI exposes only supported non-administrator account types with page-limited metrics labeled as visible. Focused backend user suite: 6 passed; focused frontend contract: 1 passed. Full backend suite: 399 passed, one intentional live-database skip; full frontend suite: 44 passed. Both builds, targeted lint, formatting and diff check pass. SEC-001 remains IN_PROGRESS. |

| 2026-09-09 | SEC-001 | Codex | IN_PROGRESS | Phase 28: audit canonical school administration for active-schema validation, authenticated tenant ownership, main-school lifecycle safety, and unsupported child-resource behavior. |

| 2026-09-09 | SEC-001 | Codex | CHECKPOINT | Phase 28 authorization wave 11 completed: school/list/branch requests use strict bounded schemas and UUID validation; controller-level tenant derivation rejects client scope overrides; real Campus branch routes remain mounted; and obsolete school-context plus generic nonexistent-model routes were removed. Deleting the configured main school returns a controlled conflict. Administrator-assignment routes require `schools.assign` and then fail closed with `501 FEATURE_NOT_IMPLEMENTED` tied to RBAC-002 until persistence exists. Branch loading/saving replacement characters were fixed. Eleven focused backend tests and one focused frontend contract test pass. Full backend suite: 401 passed, one intentional live-database skip; full frontend suite: 45 passed. Both production builds pass. SEC-001 remains IN_PROGRESS. |

| 2026-09-09 | SEC-001 | Codex | IN_PROGRESS | Phase 29: harden canonical subject identifiers, nested assignment payloads and strict request contracts. |

| 2026-09-09 | SEC-001 | Codex | CHECKPOINT | Phase 29 completed: strict subject UUIDs, queries, nested assignments and nonempty updates. Eight focused tests; full backend 402 passed/one intentional skip; build, targeted lint, formatting and diff checks pass. SEC-001 remains IN_PROGRESS. |

| 2026-09-09 | SEC-001 | Codex | IN_PROGRESS | Phase 30: harden class administration request contracts and controller-derived ownership. |

| 2026-09-09 | SEC-001 | Codex | CHECKPOINT | Phase 30 completed: strict class request contracts and controller-owned scope. Ten focused tests; full backend 406 passed/one intentional skip; backend build, targeted lint, formatting and diff checks pass. SEC-001 remains IN_PROGRESS. |

| 2026-09-09 | SEC-001 | Codex | IN_PROGRESS | Phase 31: harden academic-period request ownership and scoped lifecycle writes. |

| 2026-09-09 | SEC-001 | Codex | CHECKPOINT | Phase 31 completed: academic-period request contracts, controller ownership and scoped lifecycle writes; calendar payload alignment. Backend 410 passed/one intentional skip; two frontend tests, both builds, targeted lint, formatting and diff checks pass. SEC-001 remains IN_PROGRESS; academic-year CLOSED-state persistence limitation documented. |

| 2026-09-09 | SEC-001 | Codex | IN_PROGRESS | Phase 32: enforce parent-portal mutation ownership and exclude deleted or foreign students. |

| 2026-09-09 | SEC-001 | Codex | CHECKPOINT | Phase 32 completed: parent mutation ownership, transactional link eligibility and scoped portal students. Ten focused tests; backend 415 passed/one intentional skip; build, targeted lint, formatting and diff checks pass. SEC-001 remains IN_PROGRESS. |

| 2026-09-09 | SEC-001 | Codex | IN_PROGRESS | Phase 33: academic-policy subject ownership, strict payloads and scoped lifecycle writes. |

| 2026-09-09 | SEC-001 | Codex | CHECKPOINT | Phase 33 completed: academic-policy subject ownership, strict payloads and scoped lifecycle writes. Seven focused tests; backend 420 passed/one intentional skip; build, targeted lint, formatting and diff checks pass. SEC-001 remains IN_PROGRESS. |

| 2026-09-09 | SEC-001 | Codex | IN_PROGRESS | Phase 34: communication request contracts, required scope and transactional recipient checks. |

| 2026-09-09 | SEC-001 | Codex | CHECKPOINT | Phase 34 completed: strict communication contracts, required service scope and transactional recipient checks. Nine focused tests; backend 425 passed/one intentional skip; build, targeted lint, formatting and diff checks pass. SEC-001 remains IN_PROGRESS. |

| 2026-09-09 | SEC-001 | Codex | IN_PROGRESS | Phase 35: finance schema-safe ownership, strict requests and transaction pagination validation. |

| 2026-09-09 | SEC-001 | Codex | CHECKPOINT | Phase 35 completed: schema-safe finance ownership, strict requests and validated transaction limits. Seven focused tests; backend 429 passed/one intentional skip; build, targeted lint, formatting and diff checks pass. SEC-001 remains IN_PROGRESS. |

| 2026-09-09 | SEC-001 | Codex | IN_PROGRESS | Phase 36: reject payment idempotency-key reuse with changed payment details. |

| 2026-09-09 | SEC-001 | Codex | CHECKPOINT | Phase 36 completed: payment idempotency payload matching. Eight focused tests; backend 433 passed/one intentional skip; build, targeted lint, formatting and diff checks pass. SEC-001 remains IN_PROGRESS. |

| 2026-09-09 | SEC-001 | Codex | IN_PROGRESS | Phase 37: transactionally verify invoice student and fee eligibility before persistence. |

| 2026-09-09 | SEC-001 | Codex | CHECKPOINT | Phase 37 completed: transactional invoice eligibility. Nine focused tests; backend 438 passed/one intentional skip; build, targeted lint, formatting and diff checks pass. SEC-001 remains IN_PROGRESS. |

| 2026-09-09 | SEC-001 | Codex | IN_PROGRESS | Phase 38: conditional invoice balance updates prevent stale concurrent payment writes. |

| 2026-09-09 | SEC-001 | Codex | CHECKPOINT | Phase 38 completed: conditional payment balance updates. Eleven focused tests; backend 441 passed/one intentional skip; build, targeted lint, formatting and diff checks pass. Live concurrency verification outstanding. SEC-001 remains IN_PROGRESS. |

| 2026-09-09 | SEC-001 | Codex | IN_PROGRESS | Phase 39: validate payment precision and ledger-compatible monetary bounds. |

| 2026-09-09 | SEC-001 | Codex | CHECKPOINT | Phase 39 completed: payment precision and ledger-compatible bounds. Fourteen focused tests; backend 444 passed/one intentional skip; build, targeted lint, formatting and diff checks pass. SEC-001 remains IN_PROGRESS. |

| 2026-09-09 | SEC-001 | Codex | IN_PROGRESS | Phase 40: invoice monetary precision, decimal-column bounds and minor-unit totals. |

| 2026-09-09 | SEC-001 | Codex | CHECKPOINT | Phase 40 completed: invoice precision, decimal bounds and minor-unit totals. Sixteen focused tests; backend 448 passed/one intentional skip; build, targeted lint, formatting and diff checks pass. SEC-001 remains IN_PROGRESS. |

| 2026-09-09 | SEC-001 | Codex | IN_PROGRESS | Phase 41: recover matching committed payments after concurrent submission conflicts. |

| 2026-09-09 | SEC-001 | Codex | CHECKPOINT | Phase 41 completed: matching committed-payment recovery after submission conflicts. Eleven focused tests; backend 448 passed/one intentional skip; build, targeted lint, formatting and diff checks pass. SEC-001 remains IN_PROGRESS. |

| 2026-09-09 | SEC-001 | Codex | IN_PROGRESS | Phase 42: audit HR request validation, controller-derived ownership, and scoped employee, leave and payroll operations. |

| 2026-09-09 | SEC-001 | Codex | CHECKPOINT | Phase 42 completed: HR ownership guards, authenticated controller identity, transactional employee/leave reference checks, strict request boundaries and server-controlled creation defaults. Twelve focused tests; full backend 459 passed/one intentional skip; build, targeted lint, formatting and diff checks pass. API contract: docs/backend/hr-administration-api.md. SEC-001 remains IN_PROGRESS. |

| 2026-09-09 | SEC-001 | Codex | IN_PROGRESS | Phase 43: validate payroll salary references, nonnegative integer minor units and database-compatible totals before financial writes. |

| 2026-09-09 | SEC-001 | Codex | CHECKPOINT | Phase 43 completed: scoped salary references, integer salary validation and payroll aggregate bounds checked before financial writes. Sixteen focused tests; full backend 463 passed/one intentional skip; build, targeted lint, formatting and diff checks pass. SEC-001 remains IN_PROGRESS. |

| 2026-09-10 | SEC-001 | Codex | IN_PROGRESS | Phase 44: reconcile persisted payroll drafts before finalization and record authenticated transactional audit evidence. |

| 2026-09-10 | SEC-001 | Codex | CHECKPOINT | Phase 44: reconciled payroll finalization and atomic actor audit. Backend 472 passed/one intentional skip; frontend 94 passed; lint and builds pass. See docs/security/security-administration-phase44.md. SEC-001 remains IN_PROGRESS. |

| 2026-09-10 | SEC-001 | Codex | IN_PROGRESS | Phase 45: require authenticated payroll creation audit evidence in the same transaction as the run and items. |

| 2026-09-10 | SEC-001 | Codex | CHECKPOINT | Phase 45: atomic authenticated payroll creation audit. Focused 21 passed; backend 476 passed/one intentional skip; backend build, targeted lint, formatting and diff checks pass. See docs/security/security-administration-phase45.md. SEC-001 remains IN_PROGRESS. |

| 2026-09-10 | SEC-001 | Codex | IN_PROGRESS | Phase 46: fail closed on missing library ownership and conditionally claim loan returns before releasing scoped copies. |

| 2026-09-10 | SEC-001 | Codex | CHECKPOINT | Phase 46: scoped conditional library returns and fail-closed ownership. Focused 10 passed; backend 482 passed/one intentional skip; backend build, targeted lint, formatting and diff checks pass. See docs/security/security-administration-phase46.md. SEC-001 remains IN_PROGRESS. |

| 2026-09-10 | SEC-001 | Codex | IN_PROGRESS | Phase 47: constrain library creation fields, verify active library/book references transactionally, and reject undeclared query/identifier fields. |

| 2026-09-10 | SEC-001 | Codex | CHECKPOINT | Phase 47: library creation fields and transactional active reference checks. Focused 17 passed; backend 489 passed/one intentional skip; backend build, targeted lint, formatting and diff checks pass. See docs/security/security-administration-phase47.md. SEC-001 remains IN_PROGRESS. |

| 2026-09-10 | SEC-001 | Codex | IN_PROGRESS | Phase 48: enforce ownership throughout nested library reads and align overview counts with scoped catalog/circulation records. |

| 2026-09-10 | SEC-001 | Codex | CHECKPOINT | Phase 48: nested library read ownership and consistent overview counts. Focused 22 passed; backend 494 passed/one intentional skip; backend build, targeted lint, formatting and diff checks pass. See docs/security/security-administration-phase48.md. SEC-001 remains IN_PROGRESS. |

| 2026-09-10 | SEC-001 | Codex | IN_PROGRESS | Phase 49: require authenticated actor identity and transactional audit evidence for library borrowing and returns. |

| 2026-09-10 | SEC-001 | Codex | CHECKPOINT | Phase 49: authenticated transactional circulation audits. Focused library suite: 24 passed. Full backend: 496 passed, one intentional live-database skip. Backend build, targeted lint, formatting and diff checks pass. See docs/security/security-administration-phase49.md. SEC-001 remains IN_PROGRESS. |

| 2026-09-10 | SEC-001 | Codex | IN_PROGRESS | Phase 50: verify library borrower user identity, tenant ownership and active non-deleted eligibility before circulation writes. |

| 2026-09-10 | SEC-001 | Codex | CHECKPOINT | Phase 50: transactional active tenant-user borrower eligibility. Focused library suite: 33 passed. Full backend: 512 passed, one intentional database skip. Backend TypeScript compilation/runtime copy, targeted lint, formatting and diff checks pass. See docs/security/security-administration-phase50.md. SEC-001 remains IN_PROGRESS. |

| 2026-09-10 | SEC-001 | Codex | CHECKPOINT | Phase 51: library/HR platform-owner access aligned with academic administration. Six behavioral regressions; affected 15-test suite passes after updating two stale contracts. TypeScript/runtime copy and lint pass; standard build blocked by Prisma engine DLL EPERM. See docs/security/security-administration-phase51.md. SEC-001 remains IN_PROGRESS. |

| 2026-09-10 | SEC-001 | Codex | CHECKPOINT | Phase 52: shared owner-aware authorization across seven administrator-only modules. Focused 29 passed; backend 528 passed/one intentional skip; compilation, runtime smoke, lint, formatting and diff checks pass. Standard build blocked by Prisma engine DLL EPERM. See docs/security/security-administration-phase52.md. SEC-001 remains IN_PROGRESS. |

| 2026-09-10 | SEC-001 | Codex | CHECKPOINT | Phase 53: owner access for examinations/results and authenticated mark-service access context. Focused 26 passed; backend 536 passed/one intentional skip; compilation, runtime smoke, lint, formatting and diff checks pass. Prior Prisma DLL build issue not retested. See docs/security/security-administration-phase53.md. SEC-001 remains IN_PROGRESS. |

| 2026-09-10 | SEC-001 | Codex | CHECKPOINT | Phase 54: attendance owner access across six controller/service paths, protected context precedence and explicit creation fields. Focused 20 passed; backend 548 passed/one intentional skip; compilation, runtime smoke, lint, formatting and diff checks pass. Prior Prisma DLL build issue not retested. See docs/security/security-administration-phase54.md. SEC-001 remains IN_PROGRESS. |

| 2026-09-10 | SEC-001 | Codex | CHECKPOINT | Phase 55: owner access for analytics exports and communication administration, retaining personal notification access. Focused 24 passed; backend 555 passed/one intentional skip; compilation, runtime smoke, lint, formatting and diff checks pass. Prior Prisma DLL build issue not retested. See docs/security/security-administration-phase55.md. SEC-001 remains IN_PROGRESS. |

| 2026-09-10 | SEC-001 | Codex | CHECKPOINT | Phase 56: teacher administration accepts persisted platform ownership; self-profile remains teacher-only. Nine focused tests, compilation, runtime smoke, lint, formatting and diff checks pass. Full suite and Prisma regeneration not rerun. See docs/security/security-administration-phase56.md. SEC-001 remains IN_PROGRESS. |

| 2026-09-10 | SEC-001 | Codex | CHECKPOINT | Phase 57: digital classroom owner access across routes and service membership checks. Nineteen focused tests, compilation, runtime smoke, lint, formatting and diff checks pass. Full suite and Prisma regeneration not rerun. See docs/security/security-administration-phase57.md. SEC-001 remains IN_PROGRESS. |

| 2026-09-10 | SEC-001 | Codex | CHECKPOINT | Phase 58: assignment owner access with protected learner visibility and classroom teacher membership. Nineteen focused tests, compilation, runtime smoke, lint, formatting and diff checks pass. Full suite and Prisma regeneration not rerun. See docs/security/security-administration-phase58.md. SEC-001 remains IN_PROGRESS. |

| 2026-09-11 | SEC-001 | Codex | CHECKPOINT | Phase 59: material owner access and classroom authorization before blob upload. Twelve focused tests, compilation, runtime smoke, lint, formatting and diff checks pass. Full suite and Prisma regeneration not rerun. See docs/security/security-administration-phase59.md. SEC-001 remains IN_PROGRESS. |

| 2026-09-11 | SEC-001 | Codex | CHECKPOINT | Phase 60: live-session and recording owner access with scoped member/teacher boundaries. Eleven focused tests, compilation, runtime smoke, lint, formatting and diff checks pass. Full suite and Prisma regeneration not rerun. See docs/security/security-administration-phase60.md. SEC-001 remains IN_PROGRESS. |

| 2026-09-11 | SEC-001 | Codex | IN_PROGRESS | Phase 61: quiz owner authorization while preserving learner visibility and attempt ownership. |

| 2026-09-11 | SEC-001 | Codex | CHECKPOINT | Phase 61: quiz owner access with learner visibility and attempt ownership preserved. Eleven focused tests, compilation, runtime smoke and targeted lint pass. Full suite and Prisma regeneration not rerun. See docs/security/security-administration-phase61.md. SEC-001 remains IN_PROGRESS. |

| 2026-09-11 | SEC-001 | Codex | IN_PROGRESS | Phase 62: submission owner review access with learner write ownership preserved. |

| 2026-09-11 | SEC-001 | Codex | CHECKPOINT | Phase 62: scoped submission owner review with learner write ownership preserved. Focused 12 passed; full backend 599 passed/one intentional database skip. Compilation, runtime smoke, targeted lint, formatting and diff checks pass. Prisma regeneration not rerun. See docs/security/security-administration-phase62.md. SEC-001 remains IN_PROGRESS. |

| 2026-09-11 | SEC-001 | Codex | IN_PROGRESS | Phase 63: classroom calendar owner access with scoped membership and published-event visibility preserved. |

| 2026-09-11 | SEC-001 | Codex | CHECKPOINT | Phase 63: classroom calendar owner access with scoped membership and event visibility preserved. Nine focused tests, compilation, runtime smoke, targeted lint, formatting and diff checks pass. Full suite and Prisma regeneration not rerun. See docs/security/security-administration-phase63.md. SEC-001 remains IN_PROGRESS. |

| 2026-09-11 | SEC-001 | Codex | IN_PROGRESS | Phase 64: classroom stream owner access and protected creation identity. |

| 2026-09-11 | SEC-001 | Codex | CHECKPOINT | Phase 64: classroom stream owner access and explicit creation fields preserve school/classroom/author identity. Twelve focused tests, compilation, runtime smoke, targeted lint, formatting and diff checks pass. Full suite and Prisma regeneration not rerun. See docs/security/security-administration-phase64.md. SEC-001 remains IN_PROGRESS. |

| 2026-09-11 | SEC-001 | Codex | IN_PROGRESS | Phase 65: gradebook owner access with teacher management and learner grade privacy preserved. |

| 2026-09-11 | SEC-001 | Codex | CHECKPOINT | Phase 65: gradebook owner access across all eight operations with teacher management and learner grade privacy preserved. Focused 11 passed; full backend 619 passed/one intentional database skip. Compilation, runtime smoke, targeted lint, formatting and diff checks pass. Prisma regeneration not rerun. See docs/security/security-administration-phase65.md. SEC-001 remains IN_PROGRESS. |

| 2026-09-11 | SEC-001 | Codex | IN_PROGRESS | Phase 66: global search owner access and explicit school scope across categories. |

| 2026-09-11 | SEC-001 | Codex | CHECKPOINT | Phase 66: global search recognizes persisted platform ownership and explicitly scopes every category to tenant/school while retaining learner assignment visibility. Thirteen focused tests, compilation, runtime smoke, targeted lint, formatting and diff checks pass. Full suite and Prisma regeneration not rerun. See docs/security/security-administration-phase66.md. SEC-001 remains IN_PROGRESS. |

| 2026-09-11 | SEC-001 | Codex | IN_PROGRESS | Phase 67: bound classroom calendar date expansion and enforce event time-window boundaries. |

| 2026-09-11 | SEC-001 | Codex | CHECKPOINT | Phase 67: calendar ranges are valid, ordered and limited to 366 days at HTTP/service boundaries; lesson timestamps stay within the requested interval. Fourteen focused tests, compilation, runtime smoke, targeted lint, formatting and diff checks pass. Full suite and Prisma regeneration not rerun. See docs/security/security-administration-phase67.md. SEC-001 remains IN_PROGRESS. |

| 2026-09-11 | SEC-001 | Codex | IN_PROGRESS | Phase 68: validate and bound global search input before persistence access. |

| 2026-09-11 | SEC-001 | Codex | CHECKPOINT | Phase 68: global search validates supported aliases, rejects malformed/unknown query input and enforces a 200-character limit at HTTP/service boundaries. Seventeen focused tests, compilation, runtime smoke, targeted lint, formatting and diff checks pass. Full suite and Prisma regeneration not rerun. See docs/security/security-administration-phase68.md. SEC-001 remains IN_PROGRESS. |

| 2026-09-11 | SEC-001 | Codex | IN_PROGRESS | Phase 69: transactional submission retraction with conditional ownership and lifecycle checks. |

| 2026-09-11 | SEC-001 | Codex | CHECKPOINT | Error-message safety: remove unique-constraint metadata and add production redaction/database mapping regressions. Focused 10 passed; full backend 657 passed/one intentional database skip. Targeted lint/formatting, Prisma generation and separate backend compilation/runtime copy pass. Initial combined build exited without a compiler diagnostic. See docs/backend/error-contract.md. SEC-001 remains IN_PROGRESS. |

| 2026-09-12 | SEC-001 | Codex | CHECKPOINT | Current-user lookup and password changes reject incomplete authenticated identities before persistence. Fourteen focused tests pass; full backend 689 passed, zero failures and one intentional database skip. Targeted lint/formatting, Prisma generation, backend compilation/runtime copying and compiled route smoke checks pass. See docs/security/backend-twelve-authentication.md. Browser journeys and live concurrency verification remain outstanding. SEC-001 remains IN_PROGRESS. |

| 2026-09-13 | SEC-001 | Codex | CHECKPOINT | Import preview validation rejects malformed dryRun values instead of silently enabling writes; explicit boolean and multipart choices retain their meaning. Focused importer suite: 16 passed; full backend: 709 passed, one intentional database skip. Targeted lint and formatting pass. Frontend baseline: 81 passed, 13 failed across AcademicPolicyDashboard, ExaminationsDashboard and SubjectNavigation; dashboard failures include leftover school-selector variables after the single-school hook migration. These frontend issues, browser journeys and live concurrency verification remain outstanding. SEC-001 remains IN_PROGRESS. |

| 2026-09-13 | SEC-001 | Codex | CHECKPOINT | Frontend single-school migration recovery: corrected Boarding JSX, removed obsolete school-ID editors and setters, and added school loading/error/retry/setup states to ten operational workspaces. Removed unused context lookups from Classes and Subjects. Full frontend suite: 96 passed; two additional Boarding recovery/missing-school regressions pass. Frontend lint, production build, formatting and diff checks pass. Browser journeys and live database concurrency verification remain outstanding. SEC-001 remains IN_PROGRESS. |

| 2026-09-13 | SEC-001 | Codex | CHECKPOINT | Frontend logout clears in-memory credentials on request failure; late refresh responses cannot restore logged-out credentials or clear a newer session. Four new regressions, six authentication-client tests total. Full frontend suite: 102 passed with two workers; default concurrent run hit two app-loading timing failures. Frontend lint, production build, targeted formatting and diff checks pass. Local app/database startup succeeded; all four configured development-role login attempts returned 401. No browser connected; browser journeys and live concurrency verification remain outstanding. |

| 2026-09-13 | SEC-001 | Codex | CHECKPOINT | GitHub delivery verification: backend 709 passed, zero failed, one intentional live-database skip; frontend 102 passed with two workers at the preceding checkpoint. Repository lint, backend Prisma generation/build, compiled-route smoke checks, frontend production build, changed-file formatting and staged diff checks pass. Stopped the local development server to release the Windows Prisma engine lock. Browser authentication and live database concurrency checks remain outstanding. |
