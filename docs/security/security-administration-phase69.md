---
noteId: 'a3e0fd70add011f18df517a1f5a83d14'
tags: []
---

# SEC-001 Phase 69: production secret safety and cross-tenant user scope

## Changes

**Production weak-secret detection** (`backend/src/config/index.js`):
JWT access and refresh secrets are now validated against a list of known weak or placeholder patterns on startup when `NODE_ENV=production`. A secret is rejected if it is absent, blank, shorter than 32 characters, or matches any pattern in `KNOWN_WEAK_SECRET_PATTERNS` (covers `sais-local-*`, `test-*`, `changeme*`, `development-*`, `do-not-use-in-production`, etc.). This prevents accidental deployment with development credentials. Development and test environments are unaffected.

**Cross-tenant user email scope** (`backend/src/application/services/userManagementService.js`):
The duplicate-email uniqueness check in `createUser` now scopes its Prisma query to `{ email, tenantId }` instead of the unscoped `{ email }`. A 409 Conflict response therefore cannot be used to confirm that an email address exists in a different school tenant.

**Frontend token storage audit** (verified by regression tests):

- `frontend/src/api/auth.js`: access token is stored only in a module-level `let accessToken` variable. No `localStorage` or `sessionStorage` reads/writes are present.
- `frontend/src/context/AuthContext.jsx`: React state only. No browser storage API usage.
- `backend/src/shared/utils/cookies.js`: refresh token is delivered as an httpOnly cookie; body fallback requires explicit `ALLOW_BODY_REFRESH_TOKEN=true` and defaults to disabled.

## Verification

Twelve focused regressions cover: empty/null/short secrets rejected, known placeholder patterns rejected, sufficiently strong secret accepted, config source contains the guard function, `createUser` scopes email lookup to `tenantId`, unscoped lookup is absent, frontend auth module uses module memory, no `localStorage`/`sessionStorage` usage in auth module or AuthContext, and body refresh token gating.

Full backend suite: **650 passed**, 1 intentional live-database skip, 0 failures.

SEC-001 remains IN_PROGRESS for live browser verification and Phase 0 runbook. The Prisma Windows DLL regeneration issue remains unverified.
