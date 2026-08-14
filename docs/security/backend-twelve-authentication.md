# Backend 12 authentication security

SAIS uses short-lived JWT access tokens and rotating opaque refresh tokens. Access tokens carry `tokenType: access`, issuer, audience, subject, session id, and role claims; every authenticated request also verifies that the referenced session and account remain active in the database.

Refresh tokens are high-entropy opaque values. Only SHA-256 hashes are persisted, tokens rotate on every use, and reuse revokes the entire session chain. Browser refresh tokens are `httpOnly`, `secure` in production, and `SameSite` is configurable through `REFRESH_COOKIE_SAMESITE` with `strict` as the default.

Public registration accepts tenant-admin accounts only. Application-manager ownership is never selected from client input. Login, refresh, registration, and password recovery are rate-limited; password recovery remains enumeration-safe. Password resets revoke all sessions and refresh tokens, while password changes retain only the current session.

Production must provide independent high-entropy `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` values. If the frontend and API are deployed on different sites, explicitly review the CSRF model before choosing a less restrictive cookie policy.
