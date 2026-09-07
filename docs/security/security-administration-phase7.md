---
noteId: '2ddc1090aab711f1a69467d0979b3e2e'
tags: []
---

# Security administration � Phase 7

Date: 2026-09-07. Task: SEC-001 (in progress).

Password change now replaces the password, invalidates outstanding reset links, revokes other devices' refresh tokens and sessions, and records the audit event in one Prisma transaction. The current device remains signed in under the existing API contract.

The password update requires the stored hash to match the hash whose password was verified. It also requires an ACTIVE, nondeleted account outside any current lockout window. A zero-row update rejects the request instead of overwriting credentials changed in the meantime. The current session must be active and owned by the requesting user before writes proceed. Password verification and hashing remain outside the transaction.

Nine isolated tests cover success, current-device preservation, scoped writes, stale credentials, foreign sessions, incorrect passwords and rollback at each write stage. These fixtures check transaction-client use and conditional-update behavior; live PostgreSQL concurrency is not verified. No live credentials or sessions were modified.

The broader SEC-001 security controls and acceptance audit remain in progress.

Verification: full backend suite 326 passed, 1 intentional live-database skip; backend build, focused ESLint and diff check pass.
