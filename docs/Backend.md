# SAIS Backend Engineering Specification

## Purpose

This document is the source of truth for rebuilding and testing the SAIS backend. The backend must remain compatible with the existing Vite frontend, current authentication flow, Prisma schema, local development orchestration, Vercel deployment expectations, and the Digital Classroom roadmap.

## Runtime and package boundary

- Backend location: `/backend`.
- Runtime: Node.js 20+, ECMAScript modules.
- Framework: Express.
- ORM: Prisma with PostgreSQL.
- Development port: `4000`; frontend port: `3000`.
- Backend start command: `npm run dev --workspace backend`.
- Production start command: `npm start --workspace backend`.
- Prisma schema: `backend/prisma/schema.prisma`.
- Prisma client must be generated with `npm run db:generate --workspace backend`.
- Backend must not expose secrets or full database URLs in logs, errors, or test output.

## Environment variables

Required runtime variables:

- `DATABASE_URL`: pooled PostgreSQL connection for application queries.
- `DIRECT_URL`: direct PostgreSQL connection for Prisma migrations when available.
- `JWT_ACCESS_SECRET`: signing secret for short-lived access tokens.
- `JWT_REFRESH_SECRET`: signing secret for refresh tokens.
- `PORT`: injected by the development orchestrator; default `4000`.
- `NODE_ENV`: `development`, `test`, or `production`.

Never hardcode credentials. Fail clearly when required secrets are missing. Tests may use isolated test values supplied by the test environment.

## Application architecture

Use clear layers:

1. HTTP routes: URL mapping, authentication middleware, request parsing.
2. Controllers: translate HTTP requests into application operations and responses.
3. Services/use cases: business rules and authorization decisions.
4. Repositories: Prisma access and transaction boundaries.
5. Validators: Zod or equivalent schemas for all external input.
6. Shared errors: stable status codes and sanitized client messages.

Route modules must be registered from one route registry. All JSON responses should use a consistent shape:

```json
{ "success": true, "data": {}, "message": "optional" }
```

Errors should use:

```json
{ "success": false, "error": { "code": "STABLE_CODE", "message": "Safe message" } }
```

## Security baseline

- Use `helmet`, strict CORS configuration, JSON body limits, and rate limiting on authentication routes.
- Hash passwords with the existing password hashing utility; never store plaintext passwords.
- Use short-lived JWT access tokens and refresh-token rotation/revocation.
- Prefer HttpOnly, Secure, SameSite cookies for refresh tokens.
- Accept bearer access tokens where the existing frontend requires it.
- Authentication middleware must distinguish missing, malformed, expired, and revoked tokens.
- Every user-owned query must be scoped to the authenticated user or authorized school/classroom.
- Validate and normalize email addresses.
- Do not leak whether sensitive records exist beyond the intended API contract.
- Add audit-friendly logging without tokens, passwords, cookies, or database URLs.

## Health and readiness

Required endpoint:

- `GET /api/health` returns HTTP 200 and a small JSON payload when the process is alive and the database dependency is available.

On startup:

1. Load and validate environment configuration.
2. Initialize Prisma.
3. Register middleware and routes.
4. Listen on `PORT` (default `4000`).
5. Write `backend/.sais-port` for the local readiness orchestrator.
6. Handle SIGTERM/SIGINT by closing the HTTP server and disconnecting Prisma.

## Authentication API contract

Required endpoints:

- `POST /api/auth/register`
  - Input: email, password, firstName, lastName, optional schoolName/role fields according to validator.
  - Success: HTTP 201 with user-safe profile and access/refresh session information.
  - Duplicate email: HTTP 409.
  - Invalid input: HTTP 422.
- `POST /api/auth/login`
  - Valid credentials: HTTP 200.
  - Invalid credentials: HTTP 401 with a safe message.
- `POST /api/auth/refresh`
  - Valid refresh cookie/token: HTTP 200 and rotated session tokens.
  - Missing/invalid/revoked refresh token: HTTP 401.
- `GET /api/auth/me`
  - Authenticated: HTTP 200 with safe current-user profile.
  - Unauthenticated: HTTP 401.
- `POST /api/auth/logout`
  - Revoke/clear refresh session and return HTTP 200; safe to call repeatedly.

Authentication tests must cover valid and invalid inputs, duplicate registration, wrong password, token expiry/revocation, refresh rotation, protected routes, logout, and user scoping.

## Core data model

The Prisma schema is authoritative and must be preserved or intentionally migrated. Core domains include:

- User, role, school/tenant, and refresh/session records.
- Classroom, classroom membership, teacher/student relationships.
- Classroom stream posts, comments, announcements, and attachments.
- Topics, assignments, materials, submissions, grades, and feedback.
- Calendar/events, attendance, notifications, and communication records.
- Finance/payments and administrative records already represented in the schema.

Use foreign keys, unique constraints, indexes for common filters, timestamps, and explicit cascade/restrict behavior. Avoid destructive schema changes without a migration and backup.

## Digital Classroom roadmap requirements

The backend must support the Classroom foundation and later roadmap modules:

### Foundation

- List classrooms visible to the current user.
- Create a classroom for authorized staff.
- Retrieve classroom metadata: name/subject, code, teacher, academic year, term, student count, pending grading, upcoming work, and progress.
- Retrieve classroom header and membership summary.
- Enforce role-based classroom access.

### Stream and People

- List/create stream posts and comments.
- Manage announcements and pinned posts.
- List members by role and manage authorized membership changes.

### Classwork

- Topics, assignments, materials, due dates, submission status, grading, feedback, and student/teacher views.

### Calendar, grading, and notifications

- Classroom events and due dates.
- Gradebook and assignment status.
- Notification creation, read state, preferences, and communication audit records.

All list endpoints require pagination, stable ordering, and authorization checks. Mutations require validation and must return the created/updated resource.

## Testing standard

Before considering the backend complete, run:

- Prisma generation.
- Prisma schema validation.
- Backend unit/service tests.
- Backend route integration tests.
- Authentication smoke tests through the frontend proxy.
- Classroom authorization and CRUD tests.
- Backend lint.
- Frontend tests and production build to verify API compatibility.
- `git diff --check`.

Minimum test categories:

1. Configuration and startup.
2. Health/readiness.
3. Validation and error formatting.
4. Authentication/session lifecycle.
5. Authorization and tenant scoping.
6. Prisma repositories and transaction behavior.
7. Classroom foundation API.
8. Regression tests for existing frontend consumers.

Tests must use deterministic fixtures, clean up created records, avoid real user credentials, and never print secrets.

## Error handling

- Central error middleware handles validation, authentication, authorization, Prisma known errors, and unknown errors.
- Map known errors to stable HTTP status codes.
- Log stack traces only on the server in development/test output; return sanitized messages.
- Add new failures to root `error.md` with symptom, evidence, root cause, remediation, and verification.

## Deployment and local orchestration

- The frontend Vite proxy uses the backend canonical port `4000`.
- The backend must not bind to frontend port `3000`.
- Vercel frontend deployment is rooted at `/frontend`; backend build changes must not break the frontend workspace build.
- Keep generated runtime files such as `.sais-port` out of commits.
- Preserve the repository's workspace scripts and lockfile consistency.

## Rebuild procedure

1. Create a backup branch/tag before destructive changes.
2. Read this document before editing backend files.
3. Recreate package manifest and scripts.
4. Recreate Prisma schema/config and generate the client.
5. Recreate configuration, app bootstrap, middleware, errors, auth, repositories, services, controllers, and routes.
6. Recreate fixtures and tests from the contract sections above.
7. Run the complete testing standard.
8. Review security, error output, generated files, and git diff.
9. Commit only after all checks pass; push to the configured feature branch.

## Acceptance criteria

The reconstruction is accepted only when:

- `docs/Backend.md` accurately describes the implementation.
- The backend starts on port 4000 without fatal errors.
- Prisma validates and generates successfully.
- Existing authentication smoke flows pass.
- Classroom foundation endpoints enforce authorization and pass tests.
- Backend tests and lint pass.
- Frontend tests/build pass.
- No secrets are committed or logged.
- `error.md` records any remaining non-blocking warnings.
