# Backend 21 Test Policy

## Test layers

- **Unit:** pure configuration, security utilities, token/cookie behavior, and contract-source checks.
- **Integration:** Prisma schema, migration, tenant integrity, and database verification against the configured PostgreSQL environment.
- **API contract:** route registration, response envelopes, auth boundary, health probes, pagination bounds, request IDs, and CORS behavior.
- **Browser/network:** frontend preview loads without React runtime errors and API calls preserve the same-origin proxy contract.

## Required pull-request checks

1. `npm ci`
2. `npm run db:check -w backend`
3. `npm run db:generate -w backend`
4. `npm test -w backend`
5. `npm run lint -w backend`
6. `npm run format:check -w backend`
7. `npm run build -w backend`
8. `npm run build -w frontend`
9. `npm run lint -w frontend`
10. `git diff --check`

Production migration and reset commands are never part of CI. Database-backed checks require a configured isolated database and must not mutate production data.

## Coverage interpretation

Coverage is reported from the test runner for the registered suites, but a percentage is not treated as proof of feature completeness. Release readiness also requires representative auth, tenant isolation, CRUD, health, error, security, database integrity, and browser checks.
