# Backend 17 Observability

## Signals

- Every request receives a validated `x-request-id` or a generated UUID.
- Request logs include method, URL, status, duration, response size, user agent, and request ID.
- Requests slower than `SLOW_REQUEST_MS` (default 1000 ms) emit a `slow request` warning.
- In-process metrics are exposed in the existing health payload: request count, error count, status buckets, and average duration. These metrics are intentionally lightweight and reset on process restart; use an external metrics backend for durable history.

## Redaction

Credential-shaped keys such as password, token, secret, authorization, cookie, and API key are redacted before structured logging. Never log access tokens, refresh tokens, cookies, passwords, database URLs, or provider credentials.

## Alerting recommendations

Alert on sustained readiness/database failures, 5xx rate, authentication failure spikes, slow-request rate, and process restarts. Correlate alerts with request IDs and deployment versions.
