# Backend 15 Test Report

## Automated coverage

The backend suite covers database schema/migration safety, tenant integrity, token and cookie security, API contract documentation, health endpoint contracts, and foundation configuration. Health checks are verified through the same database connectivity utility used by runtime probes.

## Manual smoke matrix

| Area      | Check                                   | Expected                              |
| --------- | --------------------------------------- | ------------------------------------- |
| Liveness  | `GET /api/health/live`                  | 200, no database dependency           |
| Readiness | `GET /api/health/ready`                 | 200 only when database is reachable   |
| Database  | `GET /api/health/database`              | 200/503 without sensitive diagnostics |
| Auth      | login, refresh, logout                  | secure cookie/session behavior        |
| CRUD      | protected tenant resource               | auth and tenant scoping enforced      |
| Errors    | invalid JSON, missing route, validation | stable error envelope and request ID  |
| CORS      | allowed and disallowed origin           | configured policy only                |

## Known limitations

End-to-end external-provider tests and production deployment tests require the target environment and are intentionally not simulated with fake credentials.
