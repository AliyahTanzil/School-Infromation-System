# Backend 22 Deployment Architecture

## Runtime

- `frontend/` is a Vite React SPA deployed as static assets.
- `backend/` is an Express 5 service compiled from TypeScript/JavaScript.
- Prisma 5 connects the backend to PostgreSQL through `DATABASE_URL`.
- The browser uses the same-origin `/api` boundary; local Vite development proxies `/api` to the backend.

## Release sequence

1. Install from the lockfile with `npm ci`.
2. Validate and generate Prisma artifacts.
3. Build backend and frontend artifacts.
4. Apply reviewed production migrations with `npm run db:migrate:deploy -w backend`.
5. Start the compiled backend and publish static frontend assets.
6. Verify liveness, readiness, database health, authentication, tenant isolation, and representative CRUD.

Production must not run reset, development migration, seed, or local database commands.

## Required configuration

Server-only configuration includes `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, provider credentials, webhook secrets, and approved CORS origins. `VITE_*` values are public and must never contain credentials. Production uses HTTPS, secure cookies, exact CORS origins, and a managed PostgreSQL service with backups.

## Recovery boundary

Application artifacts can be rolled back independently of the frontend. Database changes must be forward-compatible; never automatically reverse a production migration. Restore into an isolated database first, validate schema and tenant integrity, then perform a controlled connection cutover.

RPO, RTO, backup retention, provider region, and failover targets remain deployment-specific TBDs until selected and tested with the production provider.
