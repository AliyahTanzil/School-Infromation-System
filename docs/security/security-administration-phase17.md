# Security administration — Phase 17

Date: 2026-09-08. Task: SEC-001 (in progress).

## Canonical backend composition root

Development, npm production startup, Docker and serverless deployment now use the compiled TypeScript application factory. The duplicate `src/main.js`, `src/app.js`, and `src/foundation/app.js` bootstraps were removed so middleware order, route mounts, production configuration checks and single-school startup validation cannot drift by deployment target.

The Docker image now builds the backend in a builder stage and runs `backend/dist/main.js`. Its liveness probe uses the canonical `/api/v1/health/live` endpoint instead of a legacy route.

## Security behavior retained

The canonical app applies configured trusted-proxy handling, explicit CORS origin validation, Helmet/CSP defaults, request IDs and request logging before request rejection. Unknown browser origins receive a stable `403 CORS_ORIGIN_DENIED` envelope with a traceable request ID. The CORS allowlist preserves all documented local, configured and approved Vercel preview origins.

## Verification

The focused composition-root, system-route, authentication-route, API-contract, foundation, security-hardening and request-context checks pass, including a 25-test route/composition suite. Backend build and compiled-artifact verification pass. The full backend suite reports 369 passed, one intentional live-database skip and one pre-existing class source-contract failure outside this checkpoint. Docker is unavailable in the development environment, so the image definition is covered by a static regression but was not locally built. No database records or live sessions were changed. SEC-001 remains in progress for the application-wide authorization/school-scope audit and compliance controls.
