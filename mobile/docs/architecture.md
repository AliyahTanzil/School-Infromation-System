# Mobile architecture

## Boundaries

The mobile app is a client only. It uses `services/api/client.ts` for future requests to the existing SAIS API. No screen may import Prisma, use a database URL, or call PostgreSQL directly.

## Navigation

Expo Router maps role surfaces to `/owner`, `/tenant`, `/administrator`, and `/staff`, with `/auth` reserved for the existing SAIS authentication contract. Each future protected surface must evaluate `userId`, `tenantId`, `role`, `permissions`, `accountStatus`, and `deviceId`; role names alone are not authorization.

## Runtime context

`types/auth.ts` and `store/session.ts` provide the extension point for a tenant-scoped session. API request code should attach an access token only after the authentication flow is integrated, and server-side tenant authorization remains authoritative.

## Extension points

- `services/storage`: secure token/device storage adapter to be selected with an Expo-compatible package in the auth step.
- `services/sync`: offline queue and retry policy; no local data persistence is enabled in Step 1.
- `services/notifications`: push registration and notification routing.
- `features`: domain modules for students, teachers, classes, attendance, examinations, finance, communication, reports, classroom, and settings.
