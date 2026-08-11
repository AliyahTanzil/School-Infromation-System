# Preview Recovery and Port Allocation

## Root cause

The Vercel preview launcher starts `npm run dev` from the `frontend` workspace, not the monorepo root. The previous setup assumed the root `dev:all` script would start the backend first. As a result, Vite could start on one port while the backend was absent or running elsewhere; the preview host then waited for a usable application and eventually reported a fatal initialization timeout. Existing long-lived processes also made fixed ports unreliable.

## Solution

`frontend/package.json` now starts `../scripts/start-preview.mjs` directly. That launcher is the single development entry point used by both Vercel Preview and local workspace startup:

1. Probe for an available backend port starting at `BACKEND_PORT` or `3000`.
2. Probe for a different available frontend port starting at `FRONTEND_PORT` or `5173`, the port expected by the preview router.
3. Remove stale backend readiness state.
4. Write the selected pair to `.sais-ports.json`.
5. Start the backend with the selected `PORT`.
6. Wait for the backend to publish `backend/.sais-port`, validating that it matches the allocated backend port.
7. Start Vite with the selected frontend port and `VITE_BACKEND_URL`.
8. Forward termination signals to both child processes so stale listeners do not survive a restart.

Vite's API proxy reads the published backend port, so browser requests stay on the frontend origin while API traffic reaches the correct backend process.

## Verification procedure

- Run `npm run dev -w frontend` from the repository root or let the preview host run its normal frontend command.
- Confirm the logs show `[sais] Allocated backend <port> and frontend <port>.`.
- Confirm Vite's `Local` URL uses the allocated frontend port.
- Confirm the backend health endpoint responds at `http://localhost:<backend-port>/ready`.
- Confirm the browser preview opens the frontend route rather than a backend 404.
- Occupy ports 3000 and 5174 before startup; the launcher must select different ports without a timeout.

## Files changed

- `frontend/package.json`: uses the preview-aware launcher.
- `scripts/start-preview.mjs`: owns allocation, startup ordering, readiness, and cleanup.
- `docs/preview-recovery.md`: this recovery record.
