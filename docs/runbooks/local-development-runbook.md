---
noteId: 'a3e12480add011f18df517a1f5a83d14'
tags: []
---

# SAIS Local Development Runbook

**Status:** Current as of 2026-09-11. Covers Phase 0 exit criteria.

This runbook is the single authoritative reference for setting up, starting, resetting, and recovering the SAIS development environment. Run every command from the repository root unless a directory is specified.

---

## Prerequisites

| Tool       | Minimum version | Install                                        |
| ---------- | --------------- | ---------------------------------------------- |
| Node.js    | 20 LTS          | https://nodejs.org                             |
| PostgreSQL | 16              | https://www.postgresql.org (or WSL, see below) |
| Git        | any             | https://git-scm.com                            |

---

## 1. First-time setup

### 1.1 Clone and install

```powershell
git clone <repo-url> School-Infromation-System
cd School-Infromation-System
npm install
npm install --prefix mobile
```

### 1.2 Create the environment file

```powershell
Copy-Item backend\.env.example backend\.env
```

Open `backend/.env` and configure at minimum:

| Variable              | Required                                            | Notes                                                   |
| --------------------- | --------------------------------------------------- | ------------------------------------------------------- |
| `DATABASE_URL`        | Yes                                                 | `postgresql://user:pass@host:5432/dbname?schema=public` |
| `JWT_ACCESS_SECRET`   | Yes                                                 | Random string ≥ 32 chars. Use `openssl rand -hex 32`    |
| `JWT_REFRESH_SECRET`  | Yes                                                 | Independent random string ≥ 32 chars                    |
| `SINGLE_SCHOOL_ID`    | Required if database contains a pre-existing school | UUID of the intended main school                        |
| `SINGLE_SCHOOL_NAME`  | Required with `SINGLE_SCHOOL_ID`                    | Human-readable school name                              |
| `SINGLE_SCHOOL_CODE`  | Optional                                            | Short code, e.g. `AUNTY-ISHA`                           |
| `SAIS_OWNER_EMAIL`    | Recommended                                         | Email for the platform application owner account        |
| `SAIS_OWNER_PASSWORD` | Recommended                                         | Strong password (≥ 12 chars, mixed)                     |

Development-only optional variables:

| Variable                    | Notes                                               |
| --------------------------- | --------------------------------------------------- |
| `SAIS_WSL_DATABASE=Ubuntu`  | Set if PostgreSQL runs inside Ubuntu WSL on Windows |
| `SAIS_DEV_ADMIN_EMAIL`      | Email for seeded school-admin dev account           |
| `SAIS_DEV_TEACHER_EMAIL`    | Email for seeded teacher dev account                |
| `SAIS_DEV_STUDENT_EMAIL`    | Email for seeded student dev account                |
| `SAIS_DEV_PARENT_EMAIL`     | Email for seeded parent dev account                 |
| `SAIS_DEV_ACCOUNT_PASSWORD` | Shared password for all four dev accounts           |

> **Never commit `.env`.** It is in `.gitignore`.

> **Production warning:** `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` must not contain placeholder words like `sais-local`, `test`, `changeme`, or `do-not-use-in-production`. The server refuses to start in production if either secret is absent or matches a known weak pattern.

---

### 1.3 PostgreSQL on Windows with WSL

If PostgreSQL is installed inside Ubuntu WSL instead of natively on Windows:

```powershell
# Confirm Ubuntu distribution name.
wsl --list
# Start PostgreSQL if not already running.
wsl -d Ubuntu -u root -- service postgresql start
# Add to backend/.env:
#   SAIS_WSL_DATABASE=Ubuntu
```

The backend dev command keeps the WSL distribution alive automatically.

---

### 1.4 Generate the Prisma client

```powershell
npm run db:generate
```

Or per-workspace:

```powershell
npm run db:generate -w backend
```

---

### 1.5 Apply all migrations

```powershell
npm run db:migrate:deploy -w backend
```

This applies every checked-in migration in dependency order. It is safe to re-run — already-applied migrations are skipped.

Check current migration status:

```powershell
npm run db:migrate:status -w backend
```

---

### 1.6 Provision the application owner

```powershell
npm run db:seed:owner -w backend
```

This is idempotent. It creates or updates the `APPLICATION_MANAGER` / `OWNER` account using `SAIS_OWNER_EMAIL` and `SAIS_OWNER_PASSWORD` from `backend/.env`.

---

### 1.7 Bootstrap the single school

```powershell
npm run school:bootstrap -w backend
```

This ensures the school identified by `SINGLE_SCHOOL_ID` and `SINGLE_SCHOOL_NAME` exists. If the database is empty it creates the school and tenant. If a matching record already exists it reuses it. It fails if more than one school is found or if the ID does not match the name.

---

### 1.8 Seed development role accounts

```powershell
npm run db:seed:development -w backend
```

Creates the four dev role accounts (school-admin, teacher, student, parent) using the email/password variables in `backend/.env`. Idempotent — re-running updates existing accounts.

---

### 1.9 Verify the baseline

```powershell
npm test
npm run lint
npm run build:frontend
npm run build -w backend
```

Expected: all tests pass (650+, 1 live-DB skip), lint clean, both builds succeed.

---

## 2. Starting the development server

### Start both backend and frontend together

```powershell
npm run dev:all
```

The supervisor waits up to 60 seconds for the backend to become ready, then starts the frontend. Use the URL printed by Vite — the port may vary if the default is occupied. Alternatively:

```powershell
# Start only the backend (on PORT from .env, default 4000).
npm run dev:backend

# Start only the frontend (proxies /api to the backend).
npm run dev:frontend
```

### Slow backends in PowerShell

```powershell
$env:BACKEND_START_TIMEOUT = "120000"
npm run dev:all
```

### Backend health check

```powershell
npm run health -w backend
# or
Invoke-WebRequest http://localhost:4000/api/v1/health/live
```

---

## 3. Authentication flows

### Development login credentials

All four dev accounts share the password set in `SAIS_DEV_ACCOUNT_PASSWORD` (default `ChangeMe!2026`).

| Role         | Email variable           | Default email               |
| ------------ | ------------------------ | --------------------------- |
| School admin | `SAIS_DEV_ADMIN_EMAIL`   | `school-admin@example.test` |
| Teacher      | `SAIS_DEV_TEACHER_EMAIL` | `teacher@example.test`      |
| Student      | `SAIS_DEV_STUDENT_EMAIL` | `student@example.test`      |
| Parent       | `SAIS_DEV_PARENT_EMAIL`  | `parent@example.test`       |

### Token behaviour

- **Access token**: returned in the response body JSON, stored only in browser memory (module-level variable). Expires in 15 minutes by default.
- **Refresh token**: delivered as an `httpOnly`, `SameSite=strict` cookie. Never sent to JavaScript. Expires in 30 days by default.
- **Token rotation**: every `/auth/refresh` call issues a new refresh token and invalidates the previous one.

### Refresh token in API testing tools

Refresh tokens are cookies-only. To test the refresh endpoint outside a browser:

```powershell
# Login and capture the Set-Cookie header manually in your tool (Insomnia, Bruno, etc.)
# Pass the cookie on /auth/refresh calls.
```

To enable body-based refresh for non-browser API clients set `ALLOW_BODY_REFRESH_TOKEN=true` in `backend/.env`. This is **off by default** and must never be enabled in production.

---

## 4. Database reset (development only)

**This drops and recreates the database. All data is lost.**

```powershell
npm run db:reset -w backend
```

After reset, re-run the bootstrap sequence:

```powershell
npm run db:seed:owner -w backend
npm run school:bootstrap -w backend
npm run db:seed:development -w backend
```

---

## 5. Applying new migrations

When new schema changes arrive (after `git pull`):

```powershell
npm run db:generate -w backend     # regenerate the Prisma client
npm run db:migrate:deploy -w backend  # apply new migrations
```

For local schema development only:

```powershell
# Create a new migration after editing prisma/schema.prisma.
npm run db:migrate -w backend
```

---

## 6. Recovery procedures

### 6.1 Prisma client generation fails (Windows DLL lock)

The Prisma Windows query engine DLL may be locked by a running backend process.

```powershell
# Stop any running backend, then:
npm run db:generate -w backend
```

If the process cannot be identified, restart the terminal and try again.

### 6.2 Database connection refused

```powershell
# Check that PostgreSQL is running.
# On Windows native:
Get-Service -Name postgresql*

# In WSL:
wsl -d Ubuntu -u root -- service postgresql status
wsl -d Ubuntu -u root -- service postgresql start
```

Verify the `DATABASE_URL` in `backend/.env` matches the running database host, port, username, and password.

### 6.3 Migration conflicts or drift

```powershell
# See which migrations are applied and which are pending.
npm run db:migrate:status -w backend

# If schema and database are out of sync in development, reset:
npm run db:reset -w backend
# Then re-run bootstrap (section 4).
```

### 6.4 Owner account missing or locked

```powershell
npm run db:seed:owner -w backend
```

This upserts the owner account. If the account is locked or suspended, update the status directly in the database or through the Prisma Studio:

```powershell
npm run db:studio -w backend
```

### 6.5 School configuration mismatch

If startup fails with `SINGLE_SCHOOL_ID not found in database` or `More than one school found`:

```powershell
# Re-run bootstrap which is idempotent and will reconcile the configured ID.
npm run school:bootstrap -w backend
```

If the database contains multiple schools and the intended one is known:

1. Set `SINGLE_SCHOOL_ID` in `backend/.env` to the UUID of the intended main school.
2. Set `SINGLE_SCHOOL_NAME` to match the persisted `name` field.
3. Run `npm run school:bootstrap -w backend`.

---

## 7. Verification suite

Run before every release or significant change:

```powershell
# From repository root:
npm run lint
npm test
npm run build:frontend
npm run build -w backend
npm run format:check
npm run db:generate

# Mobile typecheck:
cd mobile
npx tsc --noEmit
```

Expected: lint clean, tests pass (≥ 650 backend, frontend tests pass), both builds succeed, format clean, Prisma client regenerates without errors.

---

## 8. Phase 0 exit criteria (status)

| Criterion                                                         | Status                               |
| ----------------------------------------------------------------- | ------------------------------------ |
| Prisma client generation passes                                   | ✅                                   |
| All migrations applied                                            | ✅                                   |
| Owner provisioning idempotent                                     | ✅                                   |
| All 4 dev roles authenticate                                      | ✅                                   |
| Full test suite passes                                            | ✅ 650 passed, 1 intentional DB skip |
| Browser login / refresh / logout / password-recovery verification | ⏳ Pending live browser session      |

The one remaining Phase 0 item is browser-level walkthrough of the four role journeys. This requires a running local environment and a browser.
