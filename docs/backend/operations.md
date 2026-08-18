# Backend operations

## Probes

- `/api/v1/health/live` is a process-only liveness probe and must not query external dependencies.
- `/api/v1/health/ready` checks database availability and returns `503` when the service should be removed from traffic.
- `/api/v1/health/database` and `/api/v1/health/full` are diagnostic checks and do not expose secrets.

## Configuration

Production requires `DATABASE_URL`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET`. Body limits are configurable through `HTTP_BODY_LIMIT` and `HTTP_URLENCODED_BODY_LIMIT`; CORS origins are configured through `CORS_ORIGIN`.

## Logging

Structured logs include request ID, method, path, status, and duration. Error logs include safe error codes and statuses. Do not log authorization headers, cookies, passwords, token values, connection strings, or full request bodies.
