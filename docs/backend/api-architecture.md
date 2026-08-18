# API architecture and contract

All API responses use a stable envelope. Success responses use `{ success: true, data }`; errors use `{ success: false, error: { code, message, details? }, requestId }`. `requestId` is returned in the `x-request-id` header and JSON error responses.

## Middleware order

1. Helmet security headers
2. CORS with configured origins and credentials
3. Bounded JSON and URL-encoded body parsing
4. Cookie parsing
5. Validated request ID propagation
6. Structured request logging
7. `/api/v1` routes
8. Not-found and centralized error handlers

## Status semantics

`200` is used for successful reads and updates, `201` for creates, `400` for invalid input, `401` for missing/invalid identity, `403` for denied permissions, `404` for missing resources, `409` for conflicts, `429` for rate limits, `500` for unexpected failures, and `503` for readiness/dependency failures.

Unknown errors are intentionally returned as `INTERNAL_ERROR` without stack traces or sensitive details. Application errors may expose their typed safe code and details.
