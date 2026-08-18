# Backend 16 Deployment Architecture

## Runtime boundary

- `frontend/` is a Vite React single-page application and is deployed as static assets.
- `backend/` is an Express 5 application compiled from TypeScript/JavaScript with Prisma 5 and PostgreSQL.
- The browser calls `/api` through the same-origin deployment boundary. Local Vite proxies `/api` to the dynamically allocated backend port.
- PostgreSQL is the only required stateful runtime dependency. Local development uses `backend/docker-compose.yml`; production uses a managed PostgreSQL provider.

## Deployment order

1. Build backend and frontend artifacts.
2. Validate the Prisma schema and generate the client.
3. Apply reviewed migrations with `npm run db:migrate:deploy -w backend`.
4. Start the backend with production secrets and a managed database URL.
5. Publish frontend assets with `VITE_API_URL` unset or set to the same-origin API boundary.
6. Run liveness, readiness, database health, authentication, and representative CRUD smoke checks.

Production deployment must not run `db:reset`, `db:migrate`, or seed commands.
