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
npm run db:seed:development -w backend    # school-admin, teacher, student, parent accounts
npm run school:bootstrap -w backend       # idempotent single-school bootstrap
```

Optional timetable academics bootstrap (only when the school needs timetable masters):
`npm run timetable:bootstrap-academics -w backend`.

## 5. Run the application

```powershell
npm run dev:all     # backend + frontend through one supervisor
```

`npm run dev` starts the frontend only. `npm run dev:backend` and `npm run dev:frontend` run each
side independently. If the frontend port is occupied, Vite selects the next free port and the
backend proxy follows; use the URL printed by Vite. Both launchers allow 60 seconds for backend
startup; for slower cold starts set `$env:BACKEND_START_TIMEOUT = "120000"` (milliseconds) first.

For PostgreSQL inside Ubuntu WSL, set `SAIS_WSL_DATABASE=Ubuntu` in `backend/.env`. Start the
service if needed with `wsl -d Ubuntu -u root -- service postgresql start`.

## 6. Verify

```powershell
npm run lint
npm test
npm run build
npm run format:check
npm run db:generate
npm run health -w backend    # against a running backend; set HEALTHCHECK_URL for remote
```

Mobile type check: `cd mobile; npx tsc --noEmit`.

## 7. Reset the database (development only)

> Destructive. Never run against shared or production databases.

```powershell
npm run db:reset -w backend
npm run db:migrate:deploy -w backend
npm run db:seed:owner -w backend
npm run db:seed:development -w backend
npm run school:bootstrap -w backend
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
