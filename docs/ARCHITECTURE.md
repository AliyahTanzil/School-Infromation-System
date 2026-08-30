# Architecture

## Deployment model

School Information System is deployed for one school. A deployment may contain optional Campus
records, but clients cannot select a tenant or switch between independent schools.

During the staged migration from the legacy SAAS schema, `tenantId` columns remain in the database
for compatibility. They are internal implementation details and are never accepted as ownership
claims from a client. `SINGLE_SCHOOL_ID` selects the retained School when legacy data contains more
than one row; when exactly one School exists it is resolved automatically.

## Runtime

- `backend/src/main.ts` starts the Node server.
- `backend/src/server.ts` validates production configuration and starts Express.
- `backend/src/foundation/app.ts` is the canonical application factory used by local and compiled
  serverless entry points.
- The backend exposes canonical APIs under `/api/v1`; legacy `/api` aliases remain temporarily for
  frontend compatibility.
- `frontend` is the React/Vite web client.
- `mobile` is the Expo/React Native client.

## Request trust boundary

1. Authentication verifies the access token and active database session.
2. The singleton-school middleware resolves the configured School on the server.
3. Legacy `{ tenantId, schoolId }` service scopes are derived from that School.
4. Permission middleware evaluates the authenticated user; request bodies, headers, and query
   parameters cannot select an ownership context.
5. Services and repositories apply the derived scope to database operations.

## School configuration

`GET /api/v1/school` returns the authenticated deployment's School profile. Administrators with
`schools.update` may update it through `PATCH /api/v1/school`. The School record is the source of
truth for name, code, address, contacts, website, motto, logo, principal, and flexible settings.

## Authentication

Authentication uses short-lived JWT access tokens and database-backed sessions. Refresh tokens
are opaque, stored hashed, rotated on use, and delivered to web clients in an HTTP-only cookie.
Public school/tenant registration is disabled. Authorized administrators create school accounts.

## Migration policy

The first single-school migration is additive and does not delete tenant data. A later migration
may remove the Tenant model and tenant columns only after a deployment-specific preflight proves
which School is retained, all records are reconciled, and a verified backup exists.
