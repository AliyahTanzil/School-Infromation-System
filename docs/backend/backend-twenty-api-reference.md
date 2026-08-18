# Backend 20 API Reference

## Base URL

The Express backend is mounted at `/api`. The Vite development server proxies `/api` to the backend. Production should keep the browser on the same origin unless an explicit `VITE_API_URL` is configured.

## Authentication

- `POST /api/auth/register` returns the access token and sets the refresh cookie.
- `POST /api/auth/login` returns the access token and sets the refresh cookie.
- `POST /api/auth/refresh` rotates the refresh session and refresh cookie.
- `POST /api/auth/logout` requires the access token and clears the refresh cookie.
- `GET /api/auth/me` requires `Authorization: Bearer <access-token>`.

Successful responses use `{ success: true, data }`. Errors use `{ success: false, error: { code, message, details? }, requestId }`.

## Health

- `GET /api/live`
- `GET /api/ready`
- `GET /api/health`
- `GET /api/health/deep`
- `GET /api/health/database`

## Student domain

The tenant-scoped student API is mounted under `/api/students` and requires authentication plus the corresponding permission:

- `GET /api/students?search=&page=1&pageSize=25`
- `GET /api/students/:id`
- `POST /api/students`
- `PATCH /api/students/:id`
- `POST /api/students/:id/guardians`

`pageSize` is bounded to 100. Responses include `items` and `pagination` with `page`, `pageSize`, `total`, and `totalPages`. The server derives tenant scope from the authenticated request context; clients must not supply a tenant ID to widen access.

## Request IDs and errors

Clients may send `x-request-id`; the server validates or generates one and returns it in the response headers/error envelope. Validation failures are stable `VALIDATION_ERROR` responses, and internal errors do not expose stacks, SQL, tokens, or provider credentials.
