# Security administration — Phase 21

Date: 2026-09-08. Task: SEC-001 (in progress).

## Authorization audit wave 4

The approval-only administrator registration flow referenced `/activation-requests` from the owner workspace, but the canonical TypeScript server did not mount the activation router. The underlying service checked only `accountType`, and the decision endpoint accepted an unvalidated request ID and treated every value other than `approve` as rejection.

The canonical server now exposes `/api/activation-requests` and `/api/v1/activation-requests`. Every route requires an authenticated identity whose account type is `APPLICATION_MANAGER` and whose platform role is `OWNER`. The service independently enforces the same two attributes.

Activation decisions now require a UUID request ID and an explicit `approve` or `reject` value. Approval conditionally updates only a non-deleted user currently in `PENDING_VERIFICATION`; if the applicant was suspended, deleted or otherwise changed after requesting activation, the transaction rolls back instead of reactivating the account. The standard development owner seed now preserves both required owner attributes.

## Payment webhook review

The mounted Monime webhook was reviewed and retained. It requires a configured secret, verifies the raw request body with HMAC and timing-safe comparison, resolves an existing payment attempt before deriving tenant/school ownership, stores provider event IDs uniquely and reconciles successful payments transactionally.

## Verification

Five focused activation tests and nineteen combined activation/composition tests pass. The backend production build, targeted lint and diff validation pass. The complete backend suite passes with 378 tests and one intentional live-database skip.

No activation decisions, payment events, database records or sessions were changed. SEC-001 remains in progress for the remaining mounted-route and compliance audit.
