# Backend 24 Developer and Operations Runbooks

## Local development

1. Install with the repository package manager.
2. Copy the backend environment example to a local ignored environment file.
3. Start PostgreSQL using the documented compose service.
4. Run Prisma validation, generation, and reviewed development migrations.
5. Start the backend and frontend, then verify `/api/v1/health/live` and `/api/v1/health/ready`.

## Release

1. Review the commit, migration SQL, dependency audit, and environment matrix.
2. Run CI and database integrity checks against an isolated release candidate database.
3. Deploy the backend artifact, apply only `db:migrate:deploy`, and verify health.
4. Deploy frontend assets and exercise authentication, tenant-scoped reads, and one representative write.

## Troubleshooting

- API failures: inspect same-origin routing, CORS, cookies, request ID, and readiness.
- Database failures: inspect provider availability, TLS, pool saturation, and migration status; do not reset production.
- Authentication failures: verify independent JWT secrets, clock skew, cookie domain, and secure settings.
- Slow requests: correlate request ID with slow-request logs and metrics, then inspect the bounded query path.
