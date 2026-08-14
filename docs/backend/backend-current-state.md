# Backend 8 current state

SAIS backend is an Express 5 service written in TypeScript and backed by Prisma/PostgreSQL. `src/foundation/app.ts` is the canonical application factory; it applies Helmet, configured CORS, bounded request bodies, cookies, request IDs, structured request logging, versioned API routes, not-found handling, and centralized errors.

The current foundation exposes health probes under `/api/v1/health`, `/api/v1/health/live`, `/api/v1/health/ready`, `/api/v1/health/database`, and `/api/v1/health/full`. Authentication and domain modules are intentionally layered on top of this stable runtime foundation.

## Operational rules

- Never log credentials, authorization headers, cookies, reset tokens, verification tokens, or database URLs.
- Propagate a validated `x-request-id`; generate a UUID when the supplied value is invalid or absent.
- Liveness does not call external services. Readiness checks the database and returns `503` when unavailable.
- Production startup requires database and JWT secrets.
- Use the `/api/v1` prefix for new endpoints and preserve the response envelope.
