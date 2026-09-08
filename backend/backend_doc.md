# SAIS Backend Reconstruction Contract

## Scan date

- Repository: `AliyahTanzil/School-Administration-Information-System`
- Workspace: `/vercel/share/v0-project/backend`
- Runtime: Node.js ESM, Node >= 20
- HTTP framework: Express 5
- ORM/database: Prisma 5 with PostgreSQL
- Current entrypoint: `src/main.js`
- Application factory: `src/app.js`
- API prefix: `/api`
- Default backend port: `5000`
- Frontend development origin: `http://localhost:4000`

## Startup and middleware contract

1. `src/main.js` imports the Express app, config, logger, and database disconnect helper.
2. The server listens on `0.0.0.0`, uses `PORT` or configured port, writes `.sais-port`, retries on `EADDRINUSE`, and performs graceful shutdown on SIGTERM/SIGINT.
3. `src/app.js` configures Helmet, CORS with credentials, JSON/urlencoded parsing, `cookie-parser`, request logging, `/api` routing, 404 handling, and centralized error handling.
4. Readiness/health routes are mounted at the API root through `healthRoutes`.
5. Error responses must continue to pass through `notFoundHandler` and `errorHandler`.

## Environment/config contract

- `DATABASE_URL`
- `PORT`
- `NODE_ENV`
- `FRONTEND_URL`
- `CORS_ORIGIN`
- `TRUST_PROXY` (enable only behind a known reverse proxy; forwarded IPs are otherwise ignored)
- `JWT_ACCESS_SECRET` or `JWT_SECRET`
- `JWT_REFRESH_SECRET` or `JWT_SECRET`
- `JWT_ACCESS_TTL`
- `REFRESH_TOKEN_TTL_DAYS`
- `JWT_ISSUER`, `JWT_AUDIENCE`
- `BCRYPT_ROUNDS`
- `MAX_FAILED_LOGINS`, `MAX_FAILED_LOGINS_PER_IP`, `ACCOUNT_LOCKOUT_MINUTES` (positive integers; invalid explicit values fail startup)
- `EMAIL_VERIFICATION_TTL_HOURS`, `PASSWORD_RESET_TTL_MINUTES`
- `REFRESH_COOKIE_NAME`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`
- `LOG_LEVEL`, `LOG_DIR`, `LOG_DATE_PATTERN`, `LOG_MAX_SIZE`, `LOG_MAX_FILES`, `LOG_ZIPPED_ARCHIVE`
- Optional integrations: `REDIS_URL`, AI provider variables, payment/integration variables used by their services.

## Dependency contract

### Runtime

- `express`, `cors`, `helmet`, `cookie-parser`, `morgan`
- `@prisma/client`, `prisma`
- `bcryptjs`, `jsonwebtoken`
- `zod`
- `dotenv`
- `express-rate-limit`
- `multer`
- `nodemailer`
- `winston`, `winston-daily-rotate-file`
- `swagger-ui-express`, `yamljs`
- `ai`, `@ai-sdk/openai`

### Development

- `nodemon`, `supertest`

## Route registry contract

All routes are mounted from `src/presentation/http/routes/index.js` under `/api`:

- `/` health probes and documentation
- `/auth`
- `/rbac`
- `/users`
- `/schools`
- `/students`
- `/parents`
- `/teachers`
- `/classes`
- `/finance`
- `/finance/core`
- `/payment-gateway`
- `/academic-periods`
- `/attendance`
- `/examinations`
- `/results`
- `/timetables`
- `/communication`
- `/hr`
- `/libraries`
- `/assets-inventory`
- `/transport`
- `/boarding`
- `/security`
- `/analytics`
- `/ai-intelligence`
- `/smart-identity`
- `/iot`
- `/tenant-admin`
- `/billing`
- `/platform-admin`
- `/security-admin`
- `/ai-academic`
- `/ai-reports`
- `/ai-chat`
- `/integrations`
- `/biometrics`

## Source architecture inventory

- `src/config`: environment parsing and defaults.
- `src/domain`: academic period, attendance, class, examination, finance, result, teacher, and timetable lifecycle/calculation rules.
- `src/application/services`: business orchestration for auth, users, schools, students, parents, teachers, classes, finance, communication, HR, library, transport, boarding, security, analytics, AI, billing, integrations, and biometrics.
- `src/application/validators`: Zod/input validation for auth, RBAC, academic periods, attendance, classes, finance, parents, schools, students, teachers, timetables, and users.
- `src/application/dtos`: response DTO mapping.
- `src/infrastructure/orm`: Prisma client/database lifecycle.
- `src/infrastructure/repositories`: persistence adapters for auth, sessions, roles, permissions, users, profiles, schools, students, teachers, parents, classes, and audit records.
- `src/infrastructure/auth`: JWT/token services.
- `src/infrastructure/hash`: password hashing.
- `src/infrastructure/email`: email delivery and local/dev logging fallback.
- `src/infrastructure/ai`: AI provider adapter.
- `src/infrastructure/logger`: Winston logging.
- `src/middleware/auth`: authentication, authorization, permission, tenant/school, teacher, parent, and rate-limit middleware.
- `src/middleware/error`: normalized errors, 404, and central error handler.
- `src/middleware/validation`: reusable request validation.
- `src/middleware/uploads`: profile image upload handling.
- `src/presentation/http/controllers`: HTTP adapters for each route family.
- `src/presentation/http/routes`: route definitions and middleware composition.
- `src/shared`: errors, permission codes, request context, cookies, and token utilities.

## Database contract

- Prisma schema: `prisma/schema.prisma`
- PostgreSQL datasource uses `DATABASE_URL`.
- Core auth entities include `User`, `RefreshToken`, `PasswordResetToken`, `EmailVerificationToken`, `LoginAttempt`, `UserSession`, `TrustedDevice`, and `AuditLogin`.
- Access-control entities include permission groups, permissions, roles, user-role assignments, and role permissions.
- User-related entities include profiles, preferences, profile images, user audits, notifications, announcements, messaging, schools, school administrators, parents, teachers, students, and student history.
- The schema uses UUID primary keys, timestamps, soft-delete fields where appropriate, enum status/event values, foreign-key cascade/set-null behavior, and indexes for authentication, status, tenant, and audit queries.
- Existing migrations and seed scripts are authoritative and must not be discarded during reconstruction.

## Security contract

- Access tokens are short-lived JWTs.
- Refresh tokens are opaque, hashed at rest, rotated, revocable, and delivered through an httpOnly cookie.
- Passwords use bcrypt hashing.
- Auth has failed-login tracking and account lockout.
- Requests use CORS credentials and security headers.
- Tenant/school context must be applied before user-data reads/writes.
- Permissions and platform/school/teacher/parent scopes must remain enforced server-side.
- Validation must reject malformed or unsafe input before service execution.
- Errors must not expose secrets, password hashes, raw database details, or tokens.

## Test contract

Existing tests:

- Integration: `tests/integration/auth.routes.test.js`
- Integration: `tests/integration/health.routes.test.js`
- Unit: lifecycle engines, auth services, finance calculations, image service, error normalization, parent portal, RBAC, result engine, school context, student service, teacher lifecycle, and user management.

Required reconstruction checks:

1. `npm run db:generate`
2. backend lint
3. backend unit tests
4. backend integration tests
5. frontend lint/tests/build for API compatibility
6. clean startup on the allocated backend port
7. health endpoint smoke request
8. registration/login route smoke tests with isolated test data or mocked persistence
9. graceful shutdown and no unhandled rejection/error output
10. `git diff --check`

## Reconstruction rules

- Preserve all route prefixes and response shapes used by the frontend.
- Prefer additive fixes and adapters over destructive schema changes.
- Keep Prisma schema, migrations, seed data, and package-lock synchronized.
- Do not use localStorage as backend persistence.
- Keep secrets in environment variables.
- Remove debug logging before completion.
- A backend rebuild is not complete until all checks above pass.

## Known risk areas to verify

- Backend startup dependency availability, especially `cookie-parser`.
- Preview port coordination between Vite (`4000`) and backend (`5000` with `.sais-port`).
- Database availability and Prisma client generation.
- Auth cookie/CORS behavior.
- Route imports that reference missing controllers or stale service exports.
- TODO/stub branches in lifecycle/services that may return placeholder data.
- Test scripts and test file glob alignment.

## Current reconstruction status

- Contract scan completed and saved in this document.
- A clean `createApp()` foundation now owns middleware and route composition in `src/bootstrap/createApp.js`; `src/app.js` remains a compatibility export.
- Existing Prisma schema, migrations, route registry, controllers, services, repositories, middleware, and tests were preserved rather than destructively discarded.
- Baseline and post-foundation checks pass: Prisma generation, backend lint, 41 backend tests, frontend lint, frontend test, frontend production build, and `git diff --check`.
- The frontend test suite still emits a non-failing `ECONNREFUSED 127.0.0.1:3000` jsdom warning when an auth refresh request is attempted without a running preview server; this is an environment/test isolation warning, not a backend route failure.
- Remaining backend hardening is limited to targeted route/service contract tests and runtime smoke checks before commit.
