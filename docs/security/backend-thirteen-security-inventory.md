# Backend 13 security inventory

## Reviewed surfaces

- Authentication: registration, login, refresh, logout, session listing and revocation, password and activation flows.
- Authorization: authentication middleware, tenant context, role/privilege guards, platform-owner paths, account management, and domain routes.
- Tenant isolation: tenant-scoped Prisma queries, resource ownership checks, ID-based update/delete paths, and cross-tenant test coverage.
- Input and transport: Zod validation, request IDs, body limits, CORS, Helmet, rate limiters, error envelopes, and webhook boundaries.
- Data and operations: Prisma parameterization, migrations, integrity checks, secret configuration, logging redaction, and production error disclosure.
- Frontend delivery: route-level lazy loading for dashboard modules; authenticated routes remain protected by existing guards.

## Security test matrix

| Area             | Required evidence                                                                    |
| ---------------- | ------------------------------------------------------------------------------------ |
| Authentication   | Invalid credentials, inactive/locked/deleted accounts, token type and session checks |
| Authorization    | Missing role, insufficient privilege, self-escalation, platform-only endpoint        |
| Tenant isolation | Tenant A cannot read or mutate tenant B resources                                    |
| IDOR             | Resource IDs are checked against tenant and actor context                            |
| Input            | Invalid UUIDs, enum/date/range values, oversized payloads                            |
| Transport        | CORS allowlist, secure refresh cookie, security headers, request ID                  |
| Abuse            | Login, register, password-reset, and refresh rate limits                             |
| Errors           | Stable public envelope with no stack traces or secrets                               |

## Residual boundaries

Provider-specific billing, biometric, storage, AI, and webhook behavior requires provider contract tests and credentialed staging fixtures. No destructive or production mutation was performed during this audit.
