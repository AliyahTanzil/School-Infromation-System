# Backend 12 authentication security

Refresh, password-reset and email-verification tokens must be nonblank strings of at most 512 characters. Body validation applies the limit before trimming and returns `400 VALIDATION_ERROR` for malformed input. The services independently reject malformed values with `401 AUTHENTICATION_ERROR` before hashing or persistence, including JSON objects/arrays decoded from refresh cookies. Cookie-only refresh remains supported, and currently generated 64-character base64url tokens remain accepted. `backend/tests/unit/opaqueTokenBoundary.test.js` covers service rejection, schema limits and both active refresh route aliases.

Current-user lookup requires a nonblank string user identity, and password changes require both user and session identities before any account lookup or password processing. Missing, null, blank, and non-string identities return `401 AUTHENTICATION_ERROR` before persistence access. This prevents omitted Prisma filters from selecting an unrelated account or session when a service caller supplies incomplete authentication context. `backend/tests/unit/authServiceIdentity.test.js` covers these boundaries; password-change atomicity tests retain coverage for valid identities and session ownership.

Verification (2026-09-12): 14 focused identity/password-change tests and the full backend suite pass (689 passed, zero failures, one intentional live-database skip). Targeted lint/formatting, Prisma client generation, backend compilation/runtime copying and compiled health/protected-route smoke checks pass. The frontend production build passes after an approved retry outside the sandbox resolved esbuild directory-access denial. Live browser journeys and database concurrency checks remain outstanding.

Password-change requests accept only `currentPassword` and `newPassword`, each a nonempty string of at most 128 characters. Password contents are not trimmed. The controller explicitly copies those fields and derives user, session, and audit context from authentication and the request, even if invoked without validation middleware. Unknown body fields are rejected with `400 VALIDATION_ERROR`. `backend/tests/unit/passwordChangeBoundary.test.js` covers field boundaries and forged identity attempts.

`DELETE /api/auth/sessions/:id` and its `/api/v1/auth` alias authenticate before validating the target session UUID. Invalid identifiers return `400 VALIDATION_ERROR` before service access; anonymous requests return `401`. Revocation derives the user from authentication, the target session from the route, and the reason from server code. The identifier schema rejects undeclared parameter fields. `backend/tests/unit/sessionRouteValidation.test.js` covers middleware ordering, invalid identifiers, and protected revocation identity.

Session listing and all-device sign-out require a nonblank string user identity; single-device sign-out also requires a nonblank string session identity. Missing, null, blank, and non-string values return `401 AUTHENTICATION_ERROR` before database access, preventing omitted Prisma filters from broadening reads or revocations. Existing session ownership checks and transactional revocation remain in place. `backend/tests/unit/sessionRevocation.test.js` covers these service boundaries.

Reset and verification token replacement invalidates prior links and persists the new token hash in one transaction. Invalidation, insertion, or commit failures preserve the prior links and prevent delivery of the uncommitted token. Email delivery starts after commit; delivery failures still require another recovery request because email is not transactional. `backend/tests/unit/recoveryTokenIssuance.test.js` covers both token types, rollback, delivery ordering, and hashed persistence. Concurrent issuance ordering remains subject to live-database verification.

SAIS uses short-lived JWT access tokens and rotating opaque refresh tokens. Access tokens carry `tokenType: access`, issuer, audience, subject, session id, and role claims; every authenticated request also verifies that the referenced session and account remain active in the database.

Refresh tokens are high-entropy opaque values. Only SHA-256 hashes are persisted, tokens rotate on every use, and reuse revokes the entire session chain. Browser refresh tokens are `httpOnly`, `secure` in production, and `SameSite` is configurable through `REFRESH_COOKIE_SAMESITE` with `strict` as the default.

Public registration accepts tenant-admin accounts only. Application-manager ownership is never selected from client input. Login, refresh, registration, and password recovery are rate-limited; password recovery remains enumeration-safe. Password resets revoke all sessions and refresh tokens, while password changes retain only the current session.

Production must provide independent high-entropy `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` values. If the frontend and API are deployed on different sites, explicitly review the CSRF model before choosing a less restrictive cookie policy.

Password-reset completion conditionally replaces the password only while the target user exists and is not soft-deleted. If no user matches at write time, the API returns the same `401 AUTHENTICATION_ERROR` used for an invalid or expired reset link. Token consumption, password replacement, other-link invalidation, session revocation, and completion audit share one transaction; a rejected write leaves them unchanged. Resetting a password does not change account status or approval state. Regression coverage is in `backend/tests/unit/passwordResetAtomicity.test.js`; live-database concurrency verification remains outstanding.

## Frontend logout and refresh ordering (2026-09-13)

The browser API client clears its in-memory access token even when the logout request
fails. Starting logout invalidates earlier refresh responses so they cannot restore
that token later. A failed refresh from an older authentication state cannot clear
a newer session. Concurrent refresh calls still share one request.

These client guarantees do not prove server revocation when a logout request fails:
the server cookie/session may remain valid until revocation or expiry. Live browser
verification remains outstanding because no browser is connected. The local app
started successfully with database connectivity, but login attempts for the four
configured development role accounts returned HTTP 401. No accounts were reseeded
or passwords changed during this verification.
