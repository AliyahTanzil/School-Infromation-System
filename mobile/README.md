# SAIS Mobile

SAIS Mobile is a separate Expo + React Native + TypeScript client. It consumes the existing SAIS backend through HTTP APIs and never connects directly to PostgreSQL, Prisma, or server-only environment variables.

## Development

```bash
npm install
npm run start
npm run typecheck
npm run lint
npm test
```

Set `EXPO_PUBLIC_API_BASE_URL` and optionally `EXPO_PUBLIC_ENVIRONMENT` in a local Expo environment. Only public client configuration belongs in this app; never add database credentials, JWT signing secrets, or server tokens here.

## Mobile Step 1 scope

Expo Router, role-isolated placeholder routes, tenant-aware session types, centralized API/error foundations, theme primitives, and extension points for storage, sync, notifications, and offline state are established. Real authentication, production navigation guards, and feature dashboards are intentionally deferred.

Architecture: `Mobile → SAIS Backend/API → PostgreSQL`.
