# Backend 18 and 19 Security and Performance Report

## Backend 18 security assessment

The application uses Helmet, an explicit CORS origin, httpOnly refresh cookies, JWT issuer/audience validation, bcrypt password hashing, IP and account login throttling, request IDs, centralized error normalization, permission middleware, and tenant-context checks.

### High-value controls

- All tenant-scoped access must derive tenant context from the authenticated user and reject a conflicting header, query, or route value.
- Resource lookups must include `tenantId` in repository predicates to prevent IDOR across schools.
- Input validators must reject malformed IDs, dates, enum values, oversized payloads, and unexpected credential fields.
- Cookies remain httpOnly and secure in production; access tokens are not persisted in browser storage.
- Logs redact password, token, secret, authorization, cookie, and API-key shaped fields.

### Residual risks

- Distributed rate limiting requires a shared store before horizontal scaling.
- CSP, WAF rules, dependency advisories, and external provider webhook idempotency require deployment-specific validation.
- A formal penetration test remains recommended before handling high-value payment or identity data.

## Backend 19 performance assessment

The representative student list path already clamps `pageSize` to 100, performs a count and page query, and uses tenant-aware indexes: `(tenantId, admissionNumber)` and `(tenantId, lastName, firstName)`. This avoids unbounded result sets and supports the common tenant/name ordering path.

### Safe performance rules

- Prefer bounded pagination and selected fields over loading full relation graphs.
- Keep transactions short and avoid external network calls inside database transactions.
- Use pooled connections in request handlers and reuse the Prisma client singleton.
- Measure p95/p99 latency, database time, error rate, and event-loop saturation before changing query shape.
- Add indexes only from query plans and production-like workload evidence; every index has write and storage cost.

### Baseline status

Exact p95/p99 production values are deployment-specific and remain `TBD` until representative traffic is replayed against staging. The release gate is: no regression in authentication or tenant-scoped CRUD, bounded list payloads, healthy database latency, and passing migration/integrity checks.

## Scorecard

| Area                            | Status                                                            |
| ------------------------------- | ----------------------------------------------------------------- |
| React runtime deduplication     | Implemented in Vite resolve configuration                         |
| Tenant boundary checks          | Covered by regression tests and middleware                        |
| Auth and credential protections | Existing controls verified; residual deployment checks documented |
| Pagination bounds               | Implemented and tested by service contract                        |
| Database indexes                | Existing student indexes reviewed; no speculative index added     |
| Measured p95/p99                | TBD until staging workload is available                           |
| Horizontal rate-limit store     | Not yet enabled                                                   |
