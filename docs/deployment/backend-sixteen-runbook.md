# Production Runbook

## Preflight

- Confirm the release commit and migration set.
- Confirm `NODE_ENV=production`, independent high-entropy JWT secrets, database URL, CORS origins, frontend API boundary, mail/provider credentials, and logging level.
- Confirm database backups and restore point objective with the provider.
- Run root tests, backend tests, frontend build, Prisma validation/generation, and `npm run health -w backend` against the release candidate.

## Release

- Deploy backend first.
- Apply only reviewed migrations with `db:migrate:deploy`.
- Verify `/api/v1/health/live`, `/api/v1/health/ready`, and `/api/v1/health/database`.
- Deploy frontend and verify registration, login, refresh, logout, tenant-scoped student list, and one representative write.

## Rollback

1. Stop promotion of the frontend.
2. Route traffic to the previous backend artifact if the new artifact is unhealthy.
3. Do not automatically reverse database migrations. Restore from a provider snapshot only after impact assessment.
4. Re-run health and authentication smoke checks.
5. Record the incident, migration state, request IDs, and recovery decision.
