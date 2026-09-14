# Error Contract

All API errors use a stable envelope:

```json
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "Request validation failed", "details": [] },
  "requestId": "..."
}
```

## Error codes

- `VALIDATION_ERROR` — malformed or invalid input (`400`)
- `INVALID_REQUEST_BODY` — malformed JSON request body (`400`)
- `PAYLOAD_TOO_LARGE` — request body exceeds the configured size limit (`413`)
- `UNSUPPORTED_MEDIA_TYPE` — unsupported request character or content encoding (`415`)
- `AUTHENTICATION_ERROR` — missing, expired, or invalid credentials (`401`)
- `FORBIDDEN` — authenticated principal lacks permission (`403`)
- `NOT_FOUND` — resource does not exist within the tenant scope (`404`)
- `DB_UNIQUE_CONSTRAINT` — duplicate value (`409`)
- `RATE_LIMITED` — abuse protection threshold exceeded (`429`)
- `INTERNAL_ERROR` — unexpected server failure (`500`)
- `DATABASE_UNAVAILABLE` — database connection or client unavailable (`503`)
- `DB_P2028` — database transaction unavailable (`503`); transaction details are redacted.

Clients must branch on `error.code`, not message text. `requestId` is safe to expose and should be supplied to support; stack traces and database details are never returned in production.

## Message safety

Verification (2026-09-13): 20 focused normalizer/HTTP tests, targeted lint, TypeScript
compilation, runtime copying, and compiled health/protected-route smoke checks pass.
The combined build stopped during Prisma regeneration with a Windows engine-DLL rename
`EPERM`; separate compilation used the existing generated client. No schema changed.
Transaction errors preserve `DB_P2028` for correlation but expose no raw message or metadata.
This response change does not resolve the underlying transaction lifecycle failure and does
not automatically retry database mutations.

Recognized body-parser errors use fixed messages and null details. Submitted bodies, parser diagnostics, and encoding metadata are never copied into these responses. Unknown parser types and mismatched statuses remain internal errors. `backend/tests/unit/requestBodyErrors.test.ts` exercises malformed JSON, oversized JSON, and unsupported encodings through the active API before authentication.

Normalized Prisma errors return generic messages without raw database text or metadata, including unique-constraint targets. Unexpected internal errors return a generic message in production; outside production they retain their original text for diagnostics. Typed application errors and validation messages are preserved, so their callers must provide safe messages and details. The HTTP handler omits stack traces in production.

Regression coverage: `backend/tests/unit/normalizeError.test.js` verifies production redaction, development diagnostics, database conflict/not-found status codes, and unavailable-client responses.

The active TypeScript HTTP handler preserves only genuine foundation or legacy application error instances. Other values always pass through normalization, even if they carry `statusCode`, `code`, or `details` properties. This prevents driver errors from bypassing production redaction and handles null/undefined failures safely. `backend/tests/unit/errorHandlerSafety.test.ts` verifies the serialized HTTP contract, request ID, redaction, and preservation of typed authorization and validation errors.

Verification (2026-09-11): 10 focused tests pass; full backend suite passes with 657 passed and one intentional database skip. Targeted lint and formatting pass. Prisma client generation and the separate backend compilation/runtime-copy command pass; the initial combined build exited without a reported compiler diagnostic.
