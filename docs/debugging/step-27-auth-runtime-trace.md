# SAIS authentication runtime trace — Step 27

## Status

**AUTH RUNTIME VERIFIED WITH WARNINGS**

The active local TypeScript server now exposes the frontend contract under `/api/auth/*` and returns structured authentication errors. The complete deployed REGISTER → LOGIN → ME → REFRESH → ME → LOGOUT flow was not claimed because this workspace does not expose a deployed Vercel URL or production request log stream.

## 1. Actual routes

The legacy authentication implementation is in `backend/src/presentation/http/routes/authRoutes.js`:

- `POST /register` → `authController.register`
- `POST /login` → `authController.login`
- `POST /refresh` → `authController.refresh`
- `GET /me` → `authController.me`
- `POST /logout` → `authController.logout`

The active server is `backend/src/foundation/app.ts`. It mounts the router at both `/api/auth` and `/api/v1/auth`.

## 2. Routing

Local/browser request:

```text
POST /api/auth/register
  → Vercel leaves /api paths outside the SPA rewrite
  → deployed API adapter/server (deployment-specific)
  → foundation app mount /api/auth
  → authRoutes.js
  → authController.register
  → authService.register
```

`vercel.json` rewrites only non-API paths to `index.html`; it does not define the backend deployment adapter. That adapter must be confirmed in the deployed Vercel project.

## 3. Root causes and fixes

- The frontend correctly uses same-origin `/api` when `VITE_API_URL` is absent.
- The active TypeScript server did not previously mount the legacy auth router. This caused the frontend contract to miss the active auth implementation.
- Fixed by mounting the router at `/api/auth` and `/api/v1/auth`.
- Refresh without a cookie now returns `401 AUTHENTICATION_ERROR` with a request ID, not `500`.
- Refresh cookies now use `/api` scope so both supported mounts can receive them.
- Legacy JavaScript route typing is explicitly documented with a TypeScript migration suppression.

## 4. Auth and database findings

`authController.register` delegates to `authService.register`, hashes passwords before persistence, creates the controlled account/activation workflow, and returns either `201` with auth data or `202` when activation is pending. Refresh reads the HttpOnly refresh cookie, delegates rotation to `authService.refresh`, and sets the rotated cookie.

The application uses the Prisma-backed SAIS user/session/refresh-token repositories. Database connectivity and Prisma validation/generation passed in the verification suite. No reset or destructive migration was run.

## 5. Environment findings

The backend reads `DATABASE_URL`, `JWT_ACCESS_SECRET`/`JWT_SECRET`, `JWT_REFRESH_SECRET`/`JWT_SECRET`, cookie settings, CORS, and runtime configuration through `backend/src/config/index.js`. Values were not printed. The configured project environment contains the database and JWT variable names required by the backend.

`VITE_NEON_AUTH_URL` and Neon Auth references were not found in the repository source/docs searched for this trace. The active application therefore remains custom SAIS authentication, not Neon Auth. No second authentication source was introduced.

## 6. Direct HTTP evidence

The active in-process route tests executed both mounts:

- `POST /api/auth/refresh` without a cookie → `401`, `AUTHENTICATION_ERROR`, `Refresh token is required`
- `POST /api/v1/auth/refresh` without a cookie → `401`, `AUTHENTICATION_ERROR`, `Refresh token is required`

Request IDs are generated and included in the structured response/log context. Credentials, cookies, secrets, and database URLs were not exposed.

## 7. Regression and build verification

- 30 backend tests passed
- Prisma/database checks passed
- Backend lint, formatting, and TypeScript build passed
- Frontend build and lint passed; one pre-existing unused-disable warning remains
- `git diff --check` passed
- Browser smoke verification completed against the frontend preview

## 8. Remaining issues

1. A deployed Vercel backend adapter/function path is not represented in this repository, so deployed HTTP and Vercel server-log evidence remains pending.
2. A controlled valid account/session was not created through the deployed environment; therefore a deployed successful refresh rotation and full logout lifecycle are not claimed.
3. The intended SAIS controlled account-creation/activation workflow should remain enforced; public unrestricted self-registration must not be enabled as a workaround.
4. The SPA preload warning and Vercel tooling telemetry errors are separate from the authenticated API path.
