# SAIS Error Ledger

> Debugging evidence log for the workflow in `doc SAIS/debug.md`.
>
> Policy: record symptoms, commands, root-cause evidence, fixes, and verification. Do not record secrets, tokens, passwords, or full connection strings.

## Status

- Started: 2026-08-12
- Scope: dependency, process, port, backend, database, Prisma, auth, frontend proxy, and regression verification.
- Current status: baseline diagnostics running.

## Error entries

### ERR-001 — Preview/backend port collision

- Symptom: backend `GET /` returned `NOT_FOUND`; browser sometimes received `ERR_CONNECTION_REFUSED` on the expected frontend port.
- Evidence: previous diagnostics found stale duplicate dev processes and competing port allocation/orchestration paths.
- Remediation history: frontend was made the canonical preview port; backend was moved to a higher allocated port; the frontend workspace dev command was reduced to Vite; stale orchestration was removed.
- Current verification: pending this SOP run.

### ERR-002 — `cookie-parser` missing from installed tree

- Symptom: backend startup failed with a missing-module error for `cookie-parser`.
- Evidence: backend imports and uses `cookie-parser` in the application bootstrap; the dependency is declared in the backend workspace, but prior installs left `node_modules` out of sync.
- Remediation history: workspace dependencies were reinstalled and the dependency was verified from the backend resolution path.
- Current verification: pending this SOP run.

### ERR-003 — Vercel project-root build command mismatch

- Symptom: deployment failed with `No workspaces found: --workspace=frontend` from `/vercel/path0/frontend`.
- Evidence: the Vercel project is configured with `frontend` as its project root, so npm runs inside the frontend package rather than the monorepo workspace root.
- Remediation: `vercel.json` now uses `npm run build` and `dist`, both relative to the configured frontend project root.
- Current verification: `cd frontend && npm run build` passes and creates `frontend/dist/index.html`.

### WARN-001 — External browser-extension console noise

- Symptom: console messages referenced `handleLifecycle`, `DeepSeek`, and `FeatureLifecycle`.
- Evidence: identifiers are absent from `frontend/src` and `backend/src`; they are not application-originated.
- Disposition: do not modify application code. Recheck only if the identifiers appear in project source.

## Current run results

### Baseline — dependency and startup diagnostics

### Resolution — ERR-004

- Ran `npm run db:generate --workspace backend` using the existing Prisma script.
- Prisma Client v5.22.0 generated successfully.
- Backend regression rerun: 41 tests passed, 0 failed.
- Backend lint: passed.

### Runtime verification

- Clean orchestration: backend `4000`, frontend `3000`; readiness handshake passed.
- `GET /api/health` through frontend proxy: 200.
- Auth smoke flow through frontend proxy: register 201, duplicate register 409, login 200, wrong password 401, refresh 200, unauthenticated protected route 401.
- Frontend `GET /`: 200.
- Prisma schema validation: passed.
- Frontend tests: 1 passed.
- Frontend production build: passed.
- Frontend lint: passed.
- Dependency import audit: all required backend third-party imports declared and resolvable.
- External browser-extension identifiers remain absent from application source.

### Remaining non-blocking warnings

- npm audit: 15 vulnerabilities reported; dependency upgrade review remains separate.
- Prisma major update available: 5.22.0 → 7.9.1; no upgrade attempted.
- Frontend bundle warning: approximately 614 kB uncompressed JS; future code-splitting work recommended.
- React Router future flags: non-blocking test warnings.

### Baseline — dependency and startup diagnostics

- `npm install --ignore-scripts` completed, but intentionally skipped Prisma Client generation.
- Backend dependency resolution: required runtime imports resolve, including `cookie-parser`.
- Ports manifest: frontend `3000`, backend `4000`.
- Active process anomaly: Vite was listening on `3000`; no backend `main.js` listener was present during the baseline snapshot.
- Backend test failure reproduced:

```text
SyntaxError: The requested module '@prisma/client' does not provide an export named 'Prisma'
```

### ERR-004 — Prisma Client was not generated after dependency install

- Symptom: backend unit/integration tests fail during ESM module instantiation because `@prisma/client` lacks the generated `Prisma` export.
- Root-cause evidence: the diagnostic install used `--ignore-scripts`, while the backend `postinstall` is `prisma generate --schema prisma/schema.prisma`.
- Planned remediation: run the existing `npm run db:generate --workspace backend` command; do not alter application source until retested.

### WARN-002 — npm audit reports dependency vulnerabilities

- Finding: `npm install --ignore-scripts` reports 15 vulnerabilities: 8 moderate, 5 high, 2 critical.
- Disposition: record for dependency review; do not use `npm audit fix --force` during a debugging run because it can introduce breaking dependency changes.

### WARN-003 — Prisma major update available

- Finding: installed Prisma is 5.22.0; the CLI reports 7.9.1 available.
- Disposition: do not upgrade during this debugging run; major-version upgrades require a separate compatibility review.

### WARN-004 — Frontend bundle exceeds Vite warning threshold

- Finding: the production JS bundle is approximately 614 kB before gzip, above Vite's 500 kB warning threshold.
- Disposition: build succeeds; record for future performance/code-splitting work, not part of this error-focused run.

### WARN-005 — React Router future-flag warnings

- Finding: frontend tests emit v7 transition and splat-path future flag warnings.
- Disposition: non-blocking compatibility guidance; no behavior change made during this run.

### WARN-006 — Background debug wrapper left child processes alive

- Finding: stopping the background `npm run dev` task did not terminate its `concurrently`, backend launcher, readiness waiter, backend, and Vite child processes.
- Evidence: the exact child process tree remained after task stop; ports 3000 and 4000 were still listening.
- Disposition: terminate the identified process tree explicitly and verify all debug ports are closed. This is task-runner cleanup, not an application startup failure.


## Fixes applied in this run

- Updated `vercel.json` for the Vercel project root `frontend`: `buildCommand` is now `npm run build` and `outputDirectory` is now `dist`.
- Verified the exact frontend-root build context successfully produces `dist/index.html`.
- Classified `SANDBOX_NOT_LISTENING`, `localhost:3000` connection failures, external extension messages, external CDN timeout, and favicon 404 as separate preview/browser concerns rather than causes of the Vercel build failure.

## Final verification

- Backend dependency resolution: passed after install and Prisma generation.
- Prisma schema validation: passed.
- Prisma Client generation: passed.
- Backend tests: 41 passed, 0 failed.
- Backend lint: passed.
- Frontend tests: 1 passed, 0 failed.
- Frontend lint: passed.
- Frontend production build: passed.
- Runtime orchestration: backend 4000, frontend 3000; readiness passed.
- Frontend root route: HTTP 200.
- Proxied health route: HTTP 200.
- Auth smoke flow: register 201, duplicate 409, login 200, wrong password 401, refresh 200, protected route without token 401.
- Final process cleanup: no listeners on 3000/4000/5000/517x and no dev processes remaining.

## Final disposition

- Blocking application errors found: ERR-004 was fixed by running the existing Prisma generation command after the diagnostic install.
- Previously fixed environment/orchestration incidents: ERR-001, ERR-002, and ERR-003 remain documented for historical context.
- Non-blocking warnings remain recorded as WARN-001 through WARN-006.
- No secrets, credentials, tokens, or full database connection strings were written to this report.
