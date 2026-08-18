# Step 26 authentication root cause

## Root cause

The repository contained two backend application paths. The legacy JavaScript application owned the authentication controllers and routes, while the active TypeScript foundation server mounted only health routes. The frontend correctly used the `/api` same-origin base, but the active server had no auth mount.

## Fix

- Mounted the legacy auth router at `/api/auth`.
- Mounted the same router at `/api/v1/auth` for versioned callers.
- Changed the auth cookie path to `/api`, covering both route prefixes.
- Added a regression test for both mounts.
- Preserved structured error responses and request IDs.

## Scope

This is a compatibility bridge until the remaining legacy routes are migrated. It avoids duplicating authentication logic and does not expose credentials or token values.
