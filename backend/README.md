# SAIS Backend 3 — PostgreSQL database foundation

Backend 3 establishes reproducible PostgreSQL 16 infrastructure and the minimum Prisma connectivity schema. Authentication, business models, CRUD modules, and frontend integration remain deferred to later steps.

## Requirements

- Node.js 20 (`.nvmrc`)
- npm 11
- Docker Desktop or Docker Engine with Compose
- PostgreSQL 16 (provided by Compose for local development)

## Environment separation

Development uses `sais_dev` on port `5432`; tests use an isolated disposable `sais_test` database on port `5433`. Copy `.env.example` for development and `.env.test.example` for tests. Never point test commands at production or an important local database.

```bash
cp backend/.env.example backend/.env
cp backend/.env.test.example backend/.env.test
```

Do not commit `.env` files or real credentials. Production must provide `DATABASE_URL` through the deployment secret manager. Database diagnostics report configuration state and safe error messages, never connection strings or passwords.

## PostgreSQL lifecycle

```bash
# Safe/reversible development operations
docker compose -f backend/docker-compose.yml up -d postgres
npm run db:generate -w backend
npm run db:migrate -w backend
npm run db:migrate:status -w backend
npm run db:diagnose -w backend
npm run db:studio -w backend

# Test database
docker compose -f backend/docker-compose.yml up -d postgres-test
DATABASE_URL=postgresql://sais_test:sais_test_local_only@localhost:5433/sais_test?schema=public npm run db:migrate:deploy -w backend

# Destructive: deletes the selected database data; use only for disposable local/test databases
npm run db:reset -w backend
```

Use migrations as the normal schema workflow. Do not use `prisma db push` for shared, staging, or production databases. The initial migration creates only `DatabaseSentinel`, a temporary connectivity model; the complete SAIS schema begins in Backend 4.

## Database conventions

- PostgreSQL 16, UTC timestamps, and UTF-8 (`C.UTF-8` in the local container).
- Use explicit primary keys, foreign keys, unique constraints, and indexes as business tables are added.
- Keep application database roles least-privileged; use a separate migration role where required.
- Use pooled connections for serverless/Vercel runtime traffic and a direct/unpooled URL for migrations when the provider requires it.
- Configure automated backups, point-in-time recovery, retention, and restore drills in the managed PostgreSQL provider.
- Prisma queries are parameterized; transactions should be introduced at service boundaries when business workflows arrive.

## Health and diagnostics

- `GET /api/v1/health`: process health
- `GET /api/v1/health/live`: liveness
- `GET /api/v1/health/ready`: readiness contract
- `GET /api/v1/health/database`: real Prisma `SELECT 1` connectivity
- `GET /api/v1/health/full`: aggregate backend/database status

Diagnostic order: confirm environment selection, check the container health status, run `db:check`, run `db:migrate:status`, run `db:diagnose`, then inspect application logs. Never paste `DATABASE_URL` into logs or issue reports.

## Verification

```bash
npm run build -w backend
npm test -w backend
npm run lint -w backend
npm run format:check -w backend
npm run db:check -w backend
npm run db:generate -w backend
```

Prisma Studio is available with `npm run db:studio -w backend` after the selected database is running. `db:seed` is intentionally limited to the foundation sentinel and does not create SAIS business records.
