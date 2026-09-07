---
noteId: 'a74f7c10aab611f1a69467d0979b3e2e'
tags: []
---

# Security administration � Phase 6

Date: 2026-09-07. Task: SEC-001 (in progress).

Password reset now conditionally consumes its link, replaces the password, invalidates outstanding reset links for the account, revokes all refresh tokens and sessions, and writes the reset audit event in one Prisma transaction. Failure rolls back these changes together.

The consumption update requires the link to be unused and unexpired at write time and must affect exactly one row. This rechecks eligibility after password hashing and rejects a request that loses the consumption race. Hashing stays outside the transaction to avoid holding database resources during the expensive operation.

The reset endpoint and generic invalid-link response remain unchanged. Successful resets require signing in again on every device. Additional outstanding reset links are invalidated after success.

Eight isolated tests cover successful reset and replay rejection, missing/competing reset attempts, and rollback when password update, link invalidation, token revocation, session revocation or audit writing fails. Transaction fixtures verify client propagation and error handling; live database concurrency remains unverified. No live passwords or sessions were changed.

Password-change hardening and the broader SEC-001 acceptance audit remain outstanding.

Verification: full backend suite 317 passed, 1 intentional live-database skip; backend build, focused ESLint and diff check pass.
