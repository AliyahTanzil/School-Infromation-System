---
noteId: 'add94950adcf11f18df517a1f5a83d14'
tags: []
---

# Development Setup and Recovery Runbook

Current, consolidated runbook for local setup, database reset, migration, and recovery. It
supersedes the scattered per-era notes for local development. Production release and rollback
procedures remain in [docs/deployment/backend-sixteen-runbook.md](deployment/backend-sixteen-runbook.md).

## Prerequisites

- Node.js 20 or later and npm.
- PostgreSQL 16 (local, Docker Compose, or managed such as Neon).
- On Windows use PowerShell; chain commands with `;` (not `&&`). No POSIX shell is required.

## Repository layout

The root is an npm workspace with three applications: `backend` (Express/Prisma/PostgreSQL),
`frontend` (React/Vite), and `mobile` (Expo/React Native, installed separately).

## 1. Install dependencies

```powershell
npm install
npm install --prefix mobile
```

## 2. Configure environment

Copy the committed templates and fill in real values. Never commit `.env`.

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
```

Required values:

- `DATABASE_URL` — PostgreSQL connection string.
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` — independent, high-entropy secrets. Generate each
  with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
- `CORS_ORIGIN` — allowed frontend origin(s), comma-separated.
- `SINGLE_SCHOOL_ID` — optional; set only when the database contains more than one legacy `School`
  row. `SINGLE_SCHOOL_NAME` and `SINGLE_SCHOOL_CODE` configure the bootstrap identity.

Local development accounts (development only; never reuse these values elsewhere) are configured
through `SAIS_DEV_ACCOUNT_PASSWORD`, `SAIS_DEV_ADMIN_EMAIL`, `SAIS_DEV_TEACHER_EMAIL`,
`SAIS_DEV_STUDENT_EMAIL`, and `SAIS_DEV_PARENT_EMAIL`.

### Authentication email delivery

Open **Administration → Email setup** (`/settings/email`) while signed in as the
application owner or a school administrator with `schools.update` permission.
Enter the provider's SMTP server, username and password/app password. Select
STARTTLS/587 (`SMTP_SECURE=false`) or TLS/465 (`SMTP_SECURE=true`), then enter an
approved sender email address and the public school app origin. Click **Verify
connection and save**. This checks the connection and authentication without
sending a message; only successful checks are saved. Confirm actual receipt
using password recovery afterward. No backend restart is needed for saved settings.

The page stores AES-256-GCM encrypted settings in the existing `TenantSetting`
table and records a credential-free audit event in the same transaction. No
schema migration is required. Saved settings override the environment values
below and are read for each authentication email, including across backend instances.
Blank passwords retain the existing secret only for the same server and username.
The setup page supports public IPv4 SMTP providers on ports 465 and 587.

Encryption uses an HKDF-derived key from `SMTP_SETTINGS_KEY` when set, otherwise
the existing refresh-token signing secret (`JWT_REFRESH_SECRET` / `JWT_SECRET`).
The secret must have at least 32 characters. Keep it stable, backed up separately
from the database, and identical on all backend instances. Configure a dedicated
`SMTP_SETTINGS_KEY` before first save if JWT secrets will rotate independently.
Changing the encryption secret makes existing settings unreadable; restore the
original secret before reopening the page. Never place secrets in tracked files.

For environment-based configuration when no settings have been saved:

Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`,
and `EMAIL_FROM` in `backend/.env` using your mail provider's settings. Set
`FRONTEND_URL` to the frontend origin that recipients can open; recovery links
use that origin. Restart the backend after environment changes.

Without saved settings or `SMTP_HOST`, authentication emails use a JSON transport and are **not
delivered**. Logs contain recipient/subject metadata only, never recovery links.
A successful recovery API response does not prove that an email was delivered.
Verify receipt in an authorized test mailbox and completion of the recovery
journey before signing off delivery. Do not put SMTP credentials in tracked files.

### Authentication transaction failures

For `503 DB_P2028`, correlate the response's `x-request-id` with the backend's
error log. Updated handlers include a safe `transactionFailure` category:
`start_timeout`, `execution_timeout`, `connection_closed`, `transaction_closed`,
or `unknown`. Treat this as a diagnostic hint and investigate pool availability,
transaction duration or connection health as indicated before changing timeouts.
Do not assume a later successful login resolves the failure. Load the updated
backend code before collecting a new trace; older entries lack this category.

The development authentication verifier accepts `SAIS_VERIFY_BACKEND_PORT` to
target a temporary local server instead of the port manifest. It permits only
integer ports from 1 to 65535 and always connects to localhost. For example,
from `backend`, run `node --env-file-if-exists=.env scripts/verify-development-auth.mjs STUDENT`
after setting that override to the temporary server's port. It signs in and signs
out the selected development account; it does not reset its password. A successful
isolated run does not rule out intermittent failures in the existing app process.

## 3. Prepare the database

```powershell
npm run db:generate                     # generate the Prisma client
npm run db:migrate:deploy -w backend    # apply checked-in migrations
```

Authoring a new migration in development:

```powershell
npm run db:check -w backend             # validate the schema
npm run db:migrate -w backend           # create and apply a migration
npm run db:migrate:status -w backend    # show applied/pending state
```

## 4. Seed and bootstrap

```powershell
npm run db:seed:owner -w backend          # provision the configured application owner
npm run school:bootstrap -w backend       # idempotent single-school bootstrap
npm run db:seed:development -w backend    # role accounts in the existing main school
```

Optional timetable academics bootstrap (only when the school needs timetable masters):
`npm run timetable:bootstrap-academics -w backend`.

Development account seeding uses `SINGLE_SCHOOL_ID`, or the sole existing school if that
setting is absent. It never creates a separate development school or renames the main school.
Missing or ambiguous schools and inactive tenant records stop the transaction before account
provisioning. Run this only against the intended development database: rerunning it resets the
configured development accounts' passwords, status, and profile details.

## 5. Run the application

### Repair teacher accounts missing from timetable selection

At `/teachers`, authenticated platform owners and users with the existing teacher
administrator roles open school teacher management. They can list profiles, create
applicant profiles and activate applicants. They do not need a personal teacher
profile. Teacher users retain the personal dashboard backed by `/teachers/me`.
Backend administrator guards and the teacher-only self-profile endpoint remain
unchanged. Management uses the authenticated school scope and paginates lists.

The account list reads user identities; timetable selection requires a linked
school teacher record. New `TEACHER` identities created through user management
now create that record in the same transaction. Active identities start with an
active teacher profile; pending identities start as applicants.

For existing active accounts, from `backend` with the intended database configured:

```powershell
node --env-file-if-exists=.env scripts/link-teacher-accounts.mjs
node --env-file-if-exists=.env scripts/link-teacher-accounts.mjs --apply
```

The first command previews counts. Apply creates missing profiles or links a single
matching unlinked profile in the same school. It preserves existing profile details,
teacher lifecycle state and login credentials, and rejects ambiguous matches or
foreign school links. Generated employee references use `T-<account UUID>`.
Each account repair commits independently; rerunning skips linked accounts after
partial failure. Refresh the timetable after successful repair. No re-upload or
duplicate login account is needed. Restart the backend to load the new-account fix.

Verified on 2026-09-14 against the configured hosted school: seven active teacher
accounts, six missing profile links before repair; five profiles created and one
existing profile linked. The second apply reported zero missing profiles and zero
changes. This repairs account/profile linkage only; teacher-subject and lesson
assignments must still be configured through the staffing workflow.

Local readiness checkpoint (2026-09-14): the current `backend/.env` targets
PostgreSQL in Ubuntu WSL, not the hosted database used for the repair above.
Keep WSL running during standalone readiness checks; `pg_isready` can succeed
inside WSL while a subsequent Windows process cannot reach `localhost:5432`
after WSL exits. Holding a WSL session open allowed the read-only report to run.
The `Class 1A` draft reports 18 issues for `SSS Science 3A`: missing active
teacher assignments and zero scheduled periods for Mathematics, English,
Physics, Chemistry and Biology (six periods each), Geography and Agricultural
Science (three each), ICT and Civic Education (two each). Confirm the intended
database and teacher-to-subject/class mapping before configuring these records;
the timetable title and requirement class differ. No staffing data was changed
by this check.

The subsequent local staffing inspection found nine active teacher profiles
(including the Development Teacher account), but no qualifications, departments
or teaching assignments on any of them. Existing records therefore do not
establish which teacher should teach each subject. The nine requirements total
40 weekly periods for `SSS Science 3A`. Staffing configuration remains blocked
on the school's teacher-to-subject mapping; do not infer teaching expertise from
names or distribute these assignments arbitrarily.

```powershell
npm run dev:all     # backend + frontend through one supervisor
```

`npm run dev` starts the frontend only. `npm run dev:backend` and `npm run dev:frontend` run each
side independently. If the frontend port is occupied, Vite selects the next free port and the
backend proxy follows; use the URL printed by Vite. Both launchers allow 60 seconds for backend
startup; for slower cold starts set `$env:BACKEND_START_TIMEOUT = "120000"` (milliseconds) first.

For PostgreSQL inside Ubuntu WSL, set `SAIS_WSL_DATABASE=Ubuntu` in `backend/.env`. Start the
service if needed with `wsl -d Ubuntu -u root -- service postgresql start`.

If startup stops at the WSL PostgreSQL check, run that service-start command in
PowerShell, then retry `npm run dev:frontend`. The check reports readiness and
times out after 30 seconds with a database-specific error. The overall launcher
timeout also includes Prisma generation and application loading. The message
`/vercel/share/.env.project not found. Continuing without it.` is informational
on Windows; local configuration comes from `backend/.env`.

## 6. Verify

```powershell
npm run lint
npm test
npm run build
npm run format:check
npm run db:generate
npm run health -w backend    # against a running backend; set HEALTHCHECK_URL for remote
```

With the local app running and development accounts provisioned, run from the repository root:

```powershell
node --env-file-if-exists=backend/.env backend/scripts/verify-development-auth.mjs
```

This uses the backend port in `.sais-ports.json` and the configured development credentials.
It checks each role's login, httpOnly refresh-cookie rotation, identity, main-school access,
logout, and rejection of revoked credentials. Credentials and tokens are never printed.
The verifier creates and revokes its own login sessions, respects `Retry-After`, and can take
several minutes because login and refresh share a rate limiter. It does not verify browser
cookie behavior or password-recovery delivery.
Append `ADMIN`, `TEACHER`, `STUDENT`, or `PARENT` to verify one role independently.
Server failures print the HTTP status, bounded error code, and request ID for log correlation.
`DB_P2028` identifies a transaction failure; the API returns 503 and does not automatically
retry the mutation. Investigate the matching server/database diagnostics before changing
transaction limits. This code alone does not establish whether the cause was acquisition,
expiry, or another transaction lifecycle failure.

School context is read from `GET /api/school` (also `/api/v1/school`). `/school-setup` is a
frontend page, not an API endpoint.

**Timetable and staffing** requests omit client school headers and use authenticated
server school context. Timetable loading no longer writes a legacy school ID to
session storage. Configured-school readiness checks remain required. This code
checkpoint does not configure live staffing or generate a live timetable.

**Communications, notification inbox/preferences and payments** omit client school
headers on reads and mutations. The authenticated server context supplies school
ownership; configured-school readiness checks still gate these workspaces.

**Boarding, transport and inventory** also omit client school headers on reads
and mutations. Existing authenticated school readiness gates the workspace;
server-side school ownership and administrator guards still govern operations.

**Finance, HR and library** requests omit client school headers. Their existing
school-readiness checks gate the workspace, and the APIs resolve authenticated
school ownership for reads and mutations, including invoice creation, leave,
payroll finalization and library operations.

**Examinations** omits `x-school-id` across examination lifecycle, candidate
registration, class roster reads and subject scheduling. The backend resolves
school context from the authenticated session; existing scoped selectors and
request cancellation remain in place.

**Academic policies** uses that context for display and readiness. Policy list,
creation and activation requests omit `x-school-id`; the API resolves school
ownership and checks administrator access before executing the operation.

**Student home** waits for authenticated school context, ignores cached
`sais.schoolId` values, and omits school headers on learning requests. Failure of
classroom, unread-count, assignment or calendar reads clears results and offers
retry. Assignments and the next 30 days of calendar events are aggregated across
every classroom returned by the accessible-classroom API (currently capped at
100). Classroom reads run sequentially with two requests per classroom; calendar
events are sorted chronologically. A failed classroom read discards the partial
aggregate and offers retry rather than displaying incomplete totals.

**Live learning** waits for this context before reading sessions and recordings,
ignores `sais.schoolId`, and omits school header overrides. If either read fails,
the workspace clears the displayed results and offers retry; an unavailable
service is not presented as an empty schedule. Retry reloads both lists. Session
selection is reconciled with refreshed records without triggering another read.

The student **My work** workspace resolves this context before loading assignments
or submissions. It ignores the legacy `sais.schoolId` session-storage value and
does not send `x-school-id` on reads, saves or retractions; the API resolves school
scope from the authenticated session. Failed context loading offers retry, and a
missing school directs the learner to their administrator. Classroom choices
come from `GET /api/lms/classrooms`, whose existing membership and school guards
limit accessible records (the current endpoint returns at most 100 classrooms).
The first accessible classroom is selected initially; legacy `sais.classroomId`
storage is ignored. Failed classroom loading offers retry, and an empty result
shows enrollment guidance. Switching classrooms closes assignment details and
ignores late assignment responses from the previous selection.

The **Classroom quizzes** assessment workspace also resolves authenticated school
context and offers loading/retry/missing-school states. It ignores the legacy
`sais.schoolId` value and omits school headers for quiz reads, authoring,
publication, answers and attempt submission. Its classroom selector uses the
same accessible-classroom endpoint and ignores cached classroom UUIDs. Loading,
retry and empty states precede quiz operations. Changing classrooms clears local
quiz, attempt, answer and editor state; responses started under an earlier
selection cannot restore those details. This does not cancel a server-side
attempt or mutation already submitted. Backend classroom membership and role
checks still apply to every operation.

Mobile type check: `cd mobile; npx tsc --noEmit`.

## 7. Reset the database (development only)

> Destructive. Never run against shared or production databases.

```powershell
npm run db:reset -w backend
npm run db:migrate:deploy -w backend
npm run db:seed:owner -w backend
npm run school:bootstrap -w backend
npm run db:seed:development -w backend
```

## 8. Diagnostics and integrity

```powershell
npm run db:diagnose -w backend         # connectivity and configuration diagnosis
npm run db:verify -w backend           # verify required data is present
npm run db:integrity -w backend        # read-only integrity checks
npm run timetable:readiness -w backend # timetable live-readiness report
npm run db:studio -w backend           # Prisma Studio data browser
```

Health probes: `/api/health/live` (process liveness), `/api/health/ready` (database readiness;
503 removes the instance from traffic), `/api/health/database`, and `/api/health/deep` (internal
diagnostic; do not expose publicly).

## 9. Recovery

Database recovery is provider-level point-in-time restore followed by forward migration
reconciliation. It is not an application-level delete or reset.

1. Confirm the provider's point-in-time recovery window before any production migration.
2. Restore into an isolated database first.
3. Run `npm run db:integrity -w backend` and `npm run db:verify -w backend` against the restore.
4. Cut the deployment over to the restored connection only through the approved release process;
   never use `db:reset`, `db push`, or an unreviewed destructive script on shared or production data.

Health troubleshooting order:

1. `live` fails — inspect process/container restart loops and host resource exhaustion.
2. `live` passes but `ready` fails — inspect database reachability, migrations, pool limits, credentials.
3. Database passes but authenticated requests fail — inspect JWT configuration, cookie policy, CORS,
   and clock skew.
4. A single route fails — use the response `requestId` to correlate structured request/error logs.

## 10. Known issues

- Prisma Windows engine `EPERM` during `npm build` / `db:generate`. Stop any running backend/`node`
  process that holds `query_engine-windows.dll.node`, remove the generated client, and regenerate.
  Compilation can proceed with an existing generated client while this is unresolved.
- Backend cannot connect. Verify `DATABASE_URL`, that PostgreSQL is running, and the WSL hint in
  step 5.
- Port already in use. The launchers auto-allocate the next free frontend port; for the backend use
  `npm run dev:backend -w backend` and check `PORT`.
