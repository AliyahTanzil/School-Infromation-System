---
noteId: 'f7cea6a0a72511f18da7993faf6c0089'
tags: []
---

# Security checklist

## Priority 1 — block critical auth and startup risks

- [ ] Require all production secrets before starting the backend.
- [ ] Refuse empty JWT DB or secret values in production.
- [ ] Keep access tokens in memory only on the client.
- [ ] Keep refresh tokens in HttpOnly, Secure, SameSite cookies only.
- [ ] Disable request-body refresh token acceptance unless an explicit allowlist is enabled.
- [x] Validate CORS origins explicitly and reject unknown origins.
- [x] Harden HTTP security headers with Helmet and CSP defaults.

## Priority 2 — remove single-school drift and tenant risk

- [ ] Remove or disable tenant/platform selection logic.
- [ ] Enforce server-side school resolution for every school-scoped route.
- [ ] Require permission checks for every user mutation.
- [x] Reject route permission codes that are absent from the canonical catalog.
- [x] Apply route and ownership authorization layers to digital-classroom mutations.
- [x] Enforce resolved school scope across analytics reads and exports.
- [x] Fail closed instead of mounting incomplete billing and unsigned webhook handlers.
- [x] Require dual owner identity and lifecycle-safe updates for activation decisions.
- [x] Constrain parent portal relationships and link requests to the configured school.
- [ ] Prevent cross-school identity and access leakage in user management.
- [x] Eliminate duplicate app bootstraps and ensure one canonical composition root.
- [ ] Reject account enumeration and over-detailed error responses on auth failures.

## Priority 3 — harden frontend and user-data handling

- [ ] Do not persist tokens in sessionStorage or localStorage.
- [ ] Escape or sanitize all user-controlled content before render.
- [ ] Add CSP, X-Frame-Options, and same-origin resource policy defaults.
- [ ] Ensure all network calls attach the access token only from memory.
- [ ] Review all fetch/axios call sites for dangerous token storage patterns.

## Priority 4 — operational readiness

- [ ] Add tests covering auth, cookie policy, and secret validation.
- [ ] Document the production environment contract and required variables.
- [ ] Run backend/frontend lint and tests before release.
- [ ] Review logs for leaked secrets, tokens, or personal data.
- [ ] Keep a change log for security fixes and regressions.
