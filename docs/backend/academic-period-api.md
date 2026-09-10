# Academic period API

## `GET /api/v1/academic-periods`

Authentication: required. Tenant scope: authenticated tenant; calendar events additionally use the authenticated school. Query: `type=YEAR|TERM|BREAK|EXAM|EVENT`, `status=PLANNED|ACTIVE|CLOSED`. Returns a compact `data` array from `AcademicYear`, `AcademicTerm` and `AcademicCalendarEvent`. The unfiltered calendar request loads all three models, so a missing event model or unapplied migration also prevents the academic-year dropdown from loading.

## `POST /api/v1/academic-periods`

Authentication: required; administrator authorization. Body: `name`, `type`, `startsAt`, `endsAt`, and `parentId` for terms. Creates the normalized Prisma record in the current tenant. Date ranges are validated server-side.

## `PATCH /api/v1/academic-periods/:id/status`

Authentication: required; administrator authorization. Body: `status` and optional `reason`. Resource lookup is tenant-scoped. Academic years map ACTIVE to `isCurrent`; terms cannot be closed before result-locking support exists.

Errors use the standard response envelope for validation, authorization, not-found, conflict, and server failures.

## Troubleshooting unavailable academic years

`Cannot read properties of undefined (reading 'findMany')` can indicate a stale generated Prisma client. On 2026-09-10, the local client lacked `academicCalendarEvent` even though the checked-in schema contained it. Regenerating exposed a second issue: the database had not applied `20260907150000_academic_calendar_events`, which creates the event table and adds `AcademicTerm.status`.

Stop the affected backend first on Windows so its Prisma engine DLL is not locked. From the repository root, inspect pending migrations with `npm exec -w backend -- prisma migrate status --schema prisma/schema.prisma`, review them, then apply them with `npm run db:migrate:deploy -w backend`. Run `npm run db:generate -w backend` and restart the backend. Client generation does not apply database migrations.

Backend `npm run dev` and `npm run build` now regenerate the client from the explicit canonical schema before starting. A regression test checks the actual generated client's calendar delegates without connecting to a database; service mocks alone cannot detect stale generation.

Local repair verification: both pending additive migrations were applied to `sais_dev` (calendar events and the optional class-subject teaching-focus column). The real calendar service returned active year `2026/27`, one term and zero events. The restarted backend remained on port 58835, and the frontend proxy on port 3000 returned HTTP 200 for health. Reload the calendar after the backend restarts; existing year and term records are preserved.
