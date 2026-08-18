# Academic period API

## `GET /api/v1/academic-periods`

Authentication: required. Tenant scope: authenticated tenant. Query: `type=YEAR|TERM`, `status=PLANNED|ACTIVE|CLOSED`. Returns a compact `data` array from `AcademicYear` and `AcademicTerm`.

## `POST /api/v1/academic-periods`

Authentication: required; administrator authorization. Body: `name`, `type`, `startsAt`, `endsAt`, and `parentId` for terms. Creates the normalized Prisma record in the current tenant. Date ranges are validated server-side.

## `PATCH /api/v1/academic-periods/:id/status`

Authentication: required; administrator authorization. Body: `status` and optional `reason`. Resource lookup is tenant-scoped. Academic years map ACTIVE to `isCurrent`; terms cannot be closed before result-locking support exists.

Errors use the standard response envelope for validation, authorization, not-found, conflict, and server failures.
