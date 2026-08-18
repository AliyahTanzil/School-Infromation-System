# Frontend-backend contract

The frontend must call the backend through the configured `/api` proxy and should preserve the `/api/v1` prefix for the TypeScript foundation routes. Authenticated requests use `Authorization: Bearer <access token>` and `credentials: include` for cookie-based refresh flows.

The frontend should treat `401` as an expired or invalid access token, retry once through refresh, then return to login. `403` is an authorization result, `409` is an inline business conflict, `429` is a retryable rate-limit response, and `503` is a temporary dependency or readiness failure.

Every support report should include the request ID, never a token, cookie, password, or raw response secret. API DTOs must be explicit and must not serialize Prisma entities directly.
