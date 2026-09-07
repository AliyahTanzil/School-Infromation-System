---
noteId: 'a34a75f0aab311f1a69467d0979b3e2e'
tags: []
---

# Security administration � Phase 4

Date: 2026-09-07. Task: SEC-001 (in progress).

Refresh rotation now runs token lookup, eligibility checks, conditional consumption, successor creation, session activity update and audit recording through one Prisma transaction. A failure rolls back consumption, so a partially completed rotation does not strand the client without its replacement token.

The existing conditional update (id plus revokedAt: null) must affect exactly one row before a successor is created. A request that loses this consumption race follows the same replay handling as an already-revoked token: revoke the token chain and session, record SESSION_REVOKED, commit, then reject authentication outside the transaction. Throwing inside this path would roll back the very revocation meant to protect the account.

Refresh also verifies that the stored token and session belong to the same user. Existing cookie and response contracts remain unchanged. Replaying a token, including a duplicate concurrent request, requires signing in again under the existing strict reuse policy.

Nine focused tests cover successor hashing/linkage, committed replay revocation, simulated lost consumption races, revocation of an existing successor, rollback on creation/activity/audit failures, expiry and mismatched ownership. These use isolated transaction fixtures; live PostgreSQL concurrency and concurrent sign-out/sign-in remain separate verification work. No live tokens or sessions are changed during tests.

SEC-001 remains in progress; this checkpoint does not certify production security readiness.

Verification: full backend suite 303 passed, 1 intentional live-database skip; backend build, focused ESLint and diff check pass.
