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
- `AUTHENTICATION_ERROR` — missing, expired, or invalid credentials (`401`)
- `FORBIDDEN` — authenticated principal lacks permission (`403`)
- `NOT_FOUND` — resource does not exist within the tenant scope (`404`)
- `DB_UNIQUE_CONSTRAINT` — duplicate value (`409`)
- `RATE_LIMITED` — abuse protection threshold exceeded (`429`)
- `INTERNAL_ERROR` — unexpected server failure (`500`)

Clients must branch on `error.code`, not message text. `requestId` is safe to expose and should be supplied to support; stack traces and database details are never returned in production.
