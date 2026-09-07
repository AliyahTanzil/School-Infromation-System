---
noteId: '1d90a880aab811f1a69467d0979b3e2e'
tags: []
---

# Security administration � Phase 8

Date: 2026-09-07. Task: SEC-001 (in progress).

Email verification previously wrote status ACTIVE unconditionally. A valid old link could therefore bypass owner approval or reactivate a suspended/locked account. It now updates only emailVerifiedAt and preserves the existing account status. Owner activation remains a separate workflow.

Verification lookup, conditional unused/unexpired link consumption, nondeleted account update, invalidation of outstanding verification links, audit and response lookup now share one transaction. A consumed link, failed conditional write or deleted account is rejected; failed writes roll back the operation. The endpoint and response envelope remain unchanged, including the user's preserved status.

Ten isolated tests cover ACTIVE, INVITED, PENDING_VERIFICATION, SUSPENDED and LOCKED status preservation; replay; simulated competing consumption; deleted accounts; and failures in account update, audit and role lookup. Transaction fixtures verify write scope and rollback boundaries. No live accounts are changed and live database concurrency is not certified.

SEC-001 remains in progress for remaining controls and acceptance verification.

Verification: full backend suite 336 passed, 1 intentional live-database skip; backend build, focused ESLint and diff check pass.
