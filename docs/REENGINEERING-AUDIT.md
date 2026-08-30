# Single-School Re-engineering Audit

Date: 2026-08-30

## Purpose and safety boundary

This document records the pre-change audit required before converting the repository from a multi-tenant SAAS platform into a single-school School Information System. No application feature, database model, migration, or route was removed during this phase. No commit or push was made.

The working tree already contained unrelated modifications when this audit began. They must be reviewed and preserved during later work, especially the current Prisma schema, user-management files, and the untracked gradebook migration.

## Repository and Git state

- Branch: `main`.
- Origin: `https://github.com/AliyahTanzil/School-Infromation-System.git` for fetch and push.
- The remote repository name contains the spelling `Infromation`; confirm whether that is intentional before the first push.
- The repository has not been pushed by this audit.
- Existing working-tree changes are present in `.vscode/gemini-mcp/status.json`, `ROADMAP_TODO.md`, the Prisma schema, user-management code/tests, and an untracked gradebook migration.

## Current technology stack

### Monorepo

- npm workspaces at the repository root for `backend` and `frontend`.
- Node.js 20 or later.
- Root scripts coordinate the backend and frontend, linting, formatting, tests, and Prisma generation.

### Backend

- Express 5, primarily JavaScript domain modules mounted by a TypeScript foundation/server.
- PostgreSQL through Prisma 5.22.
- Zod validation, JWT access tokens, rotating opaque refresh tokens, bcrypt password hashing, Helmet, CORS, Express rate limiting, Winston logging, Multer uploads, Nodemailer, and Swagger UI.
- Vercel serverless entry points coexist with the local Node server.

### Web frontend

- React 18, Vite 5, React Router 6, Axios, Zod, React Hook Form, Tailwind/PostCSS, and Vitest.
- The frontend is mostly a broad set of top-level dashboard components, with substantial routing and authentication behavior concentrated in `frontend/src/App.jsx`.

### Mobile client

- Expo 57, React Native 0.86, React 19, Expo Router, TypeScript, SecureStore, notifications, image picking, and network-state support.
- It consumes the backend HTTP API and has its own package lock rather than participating in the root npm workspace.

## Active backend architecture

The active development command runs `src/main.ts`, which starts `src/server.ts`, which obtains `createApp` from `src/app.ts`. That file re-exports `src/foundation/app.ts`. The TypeScript foundation then mounts many legacy JavaScript routers.

A second complete JavaScript bootstrap path also exists through `src/main.js`, `src/app.js`, and `src/bootstrap/createApp.js`. The Vercel entry points currently import the JavaScript app. This means local TypeScript execution and serverless deployment do not share one unambiguous composition root.

This dual-entry architecture is significant technical debt. Re-engineering must first select one application factory and make local, test, and deployment entry points use it consistently.

The intended backend layering is already recognizable:

- presentation routes and controllers;
- application services, validators, DTOs, and gateways;
- domain lifecycle/calculation modules;
- infrastructure repositories, Prisma, authentication, email, logging, and notifications;
- middleware and shared errors/utilities.

The layering should be retained and normalized rather than replaced wholesale.

## Existing functional modules

Operational or substantially implemented domains include:

- authentication, sessions, email verification, password recovery, and account activation;
- RBAC, users, profiles, parents/guardians, teachers, staff, and HR;
- school/campus configuration, academic periods/policies, classes, subjects, and enrollment;
- attendance;
- examinations, marks, results, timetables, and scheduling;
- fees, invoices, payments, ledger transactions, billing, and Monime checkout/webhooks;
- notifications and preferences;
- libraries, assets/inventory, transport, and boarding;
- digital classrooms, streams, assignments, materials, submissions, quizzes, rubrics, grades, and feedback.

Several AI, analytics, security, smart-identity, IoT, biometric, and integration surfaces contain prototypes, demo data, or controlled `501` placeholders. They must not be represented as production-complete features.

## API architecture

- Most domains are exposed under both `/api/...` and `/api/v1/...` compatibility paths.
- The JavaScript router composition and TypeScript foundation mount overlapping but non-identical route sets.
- Authentication is custom and database-backed.
- School-domain routes commonly derive a tenant from the authenticated user and require a caller-provided school header, query value, or body field.
- API responses are generally JSON envelopes, but controllers are not fully consistent about `success`, `data`, and typed errors.
- Several routes use role-name checks while others use permission codes, leaving two authorization models in active use.

Target recommendation: keep `/api/v1` as the canonical contract, retain compatibility aliases only for a documented transition period, and derive the one configured school on the server rather than accepting school or tenant selection from clients.

## Authentication and authorization

Working foundations worth preserving:

- short-lived JWT access tokens with issuer, audience, expiry, and token-type checks;
- database-backed sessions checked on each authenticated request;
- hashed, rotating refresh tokens with reuse detection;
- password reset and email-verification tokens stored as hashes;
- password hashing and account lockout;
- session listing/revocation and audit records.

Multi-tenant/platform concepts to remove or redesign:

- `APPLICATION_MANAGER`, platform-owner tenant selection, tenant-admin activation approval, and platform tenant lifecycle management;
- `x-tenant-id`, client-selected `scopeKey`, and tenant-aware access-context resolution;
- roles whose sole purpose is managing other independent schools.

The target role model should include a single system administrator plus school roles such as principal/headteacher, registrar, teacher, accountant/bursar, parent, student, and other staff. Permission checks must remain enforced in backend services/routes.

Security problems discovered during the audit must be fixed as part of the conversion:

- user-management reads and mutations are not reliably school/tenant scoped;
- user creation can default to `APPLICATION_MANAGER`;
- RBAC accepts a scope key but its permission query does not enforce that scope;
- public diagnostics expose process and runtime detail;
- deployment and test tooling contain unsafe fallback credentials;
- detailed authentication responses permit some account enumeration;
- upload buffering can cause memory pressure;
- the mobile application-token screen performs no server validation.

## Database audit

The active Prisma schema contains 124 models, 81 direct `tenantId` fields, and 71 direct `schoolId` fields. It has extensive historical migrations and a broad normalized domain model.

The central hierarchy is currently:

`Tenant -> School -> school-owned resources`

Many records redundantly store both `tenantId` and `schoolId`. This supports cross-tenant isolation but creates duplicated ownership constraints and a large refactoring surface.

The `School` model remains useful and should become the single source of truth for school identity and settings. The `Tenant` model and tenant foreign keys are candidates for removal, but this must be staged because they participate in relations, compound unique constraints, indexes, middleware, tests, seeders, and nearly every service.

Important model groups include:

- identity/security: `User`, roles/permissions, devices, sessions, recovery tokens, login/audit models;
- school/academics: `School`, `Campus`, academic years/terms, grade schemes, grade levels, subjects, classes, enrollments;
- people: students, guardians, parents, teachers, staff, employees, qualifications and employment records;
- learning: digital classrooms, streams, assignments, materials, submissions, versions, rubrics, quizzes and grades;
- operations: attendance, examinations, results, timetable, notifications, HR/payroll, library, inventory, boarding and transport;
- finance: fees, invoices, payments, payment intents/attempts/webhooks and ledger transactions.

Potential database debt requiring focused review:

- overlapping concepts such as `Classroom` versus `Class` versus `DigitalClassroom`, `Staff` versus `Employee`, and multiple notification models;
- a schema/seed mismatch around `UserRole.scopeKey` in the current working tree;
- large numbers of compound indexes and uniqueness rules that include both tenant and school;
- nullable school ownership on some identity records;
- an existing untracked gradebook migration that must not be overwritten;
- duplicate JavaScript and TypeScript seed paths.

No destructive migration should directly drop `Tenant` or dozens of tenant columns. A safe migration needs a preflight assertion that exactly one tenant and one school are selected, a data backfill/normalization step, constraint changes, application cutover, verification, and only then removal of obsolete columns/tables.

## Frontend audit

The web application includes working or substantial dashboards for most backend domains. However, routing, role selection, registration, branding, and workspace navigation contain platform/tenant concepts throughout `App.jsx` and several dedicated dashboards.

Remove or replace:

- tenant login and tenant registration paths;
- platform administration and tenant lifecycle dashboards;
- tenant administration navigation;
- tenant billing/subscription controls that exist only for the SaaS platform;
- language about active tenants, tenant-safe workspaces, school switching, and platform owners.

Preserve and reorganize the operational screens around one-school navigation: dashboard, administration, students, academics, attendance, examinations/results, finance, communication, reports, and optional operational modules.

The current component organization is flat and `App.jsx` is oversized. Re-engineering should move route definitions, layout/navigation, authentication screens, and feature pages into focused modules incrementally without rewriting functioning dashboards.

## Mobile audit

The mobile client explicitly models owner, tenant, administrator, and staff workspaces. It includes tenant-listing and tenant-routing screens and derives roles through string heuristics. These concepts conflict with the single-school target.

The client should use one authenticated school context returned by a bootstrap/session endpoint, remove owner/tenant switching surfaces, and enforce server-provided roles and permissions. Its application-token enrollment is currently only a local non-empty-string check, and its browser-style refresh-cookie assumption requires a native-safe redesign.

## Configuration and deployment

- Root and backend Docker Compose files configure PostgreSQL; the root compose file also includes pgAdmin and currently provides predictable fallback credentials.
- Vercel configurations exist at root, backend, and frontend.
- `.gitignore` covers common `.env`, dependency, build, coverage, log, and Vercel metadata paths.
- `.env.example` includes concrete development defaults and a placeholder JWT secret, but it does not accurately document the split access/refresh secret configuration used by the active backend.
- Runtime logs, cookie files, demo-login spreadsheets, ZIPs, and extracted document artifacts exist at repository root. They should be classified and excluded from deployment and, where appropriate, source control.

The target configuration should require strong access and refresh secrets, identify the one school through a database singleton rather than client input, and fail production startup when mandatory settings are absent.

## Tests and current baseline

The backend has a large Node test suite covering contracts, security, lifecycle rules, persistence shape, route mounting, tenant scoping, and frontend-source expectations. The web frontend uses Vitest. Mobile tests are primarily type/config and source-level contract checks.

Baseline observed immediately before this audit document:

- 181 backend tests discovered;
- 179 passed;
- 1 failed;
- 1 skipped;
- the failure expects Monime bank payments to be disabled while the implementation enables them;
- the skipped test is the live database connectivity test.

Tenant-specific tests should be converted into single-school invariants rather than deleted. New tests must prove that no user can choose a school/tenant context and that every school-owned operation resolves the configured school server-side.

## Duplicate and suspicious architecture

- Two backend application/server compositions: legacy JavaScript and TypeScript foundation.
- Both legacy and versioned API mounts for most domains.
- Parallel JavaScript and TypeScript Prisma seeders.
- Root `src/pages/LandingPage.jsx` duplicates the frontend source boundary.
- Extracted module archives and generated repository-map artifacts live alongside source.
- Multiple dashboards and service files exist for prototype features that are not mounted operationally.
- Branding alternates between `SAIS`, School Administration Information System, and School Information System.

## Recommended staged implementation

1. Preserve the dirty working tree and establish a clean, reviewed baseline; reconcile the gradebook migration and current user-management edits.
2. Unify the backend composition root so local, tests, and Vercel run the same app.
3. Add a server-side `SchoolContext`/school-settings service that resolves the single configured school without request headers or query parameters.
4. Replace platform/tenant account types and authorization with single-school roles and explicit permissions; fix the discovered privilege and cross-school user-management flaws first.
5. Refactor services and repositories to accept the server-resolved school ID only. Stop accepting `tenantId`, `schoolId`, and `scopeKey` ownership fields from clients.
6. Introduce a non-destructive data migration that identifies and validates the retained school. Update compound constraints and relations in bounded domain groups.
7. Remove tenant routes, services, middleware, dashboards, onboarding, switching, and SaaS subscription behavior after their callers are gone.
8. Reorganize web and mobile navigation around one school and update branding.
9. Consolidate duplicate entry points, routes, seeders, dead prototypes, and documentation.
10. Run Prisma validation/generation, migrations against a disposable database, backend/frontend/mobile tests, lint, and production builds before any commit.

## Architectural decision required before schema changes

The largest decision is whether the application should support multiple campuses belonging to the one school.

- Recommended: retain one `School` and allow optional multiple `Campus` records. Remove tenant selection and tenant ownership, but keep `schoolId` relationships during the first conversion stage. This preserves clear referential ownership and makes a future second campus possible without restoring SaaS tenancy.
- More aggressive alternative: enforce a strict singleton school and eventually remove most `schoolId` columns. This reduces repeated columns but produces a much larger destructive migration and weaker explicit ownership in the relational model.

The recommended first implementation is the safer staged option: one School, optional campuses, no Tenant, and server-resolved school context. Approval of this direction is required before the Prisma migration and broad application refactor begin.
