---
noteId: '062cf920aab111f1a69467d0979b3e2e'
tags: []
---

# Security administration � Phase 2

Date: 2026-09-07. Task: SEC-001 (in progress).

## Account eligibility on protected requests

Authentication now requires the current database account to be ACTIVE, not deleted, and outside any temporary lockout window. Previously the access-context service accepted INVITED and PENDING_VERIFICATION accounts and ignored lockedUntil, even though login and refresh already rejected those cases.

A previously issued token and an unexpired session no longer bypass these account restrictions. The shared authentication middleware resolves current account eligibility on every request. An unavailable account returns the existing 403 ACCOUNT_UNAVAILABLE error; missing, expired, revoked or foreign sessions continue to fail authentication. Existing roles are still read from the database rather than trusted from stale token claims.

An ACTIVE account becomes eligible again when its temporary lockedUntil window expires. Accounts with a non-ACTIVE status still require the existing activation or account-management flow. No accounts or sessions are modified by this check.

## Verification

Nine isolated middleware regression tests cover inactive statuses, active and expired lockouts, deleted/missing accounts, current database roles, and missing/foreign sessions. They use a signed token and mock persistence; no live database is needed.

## Remaining scope

SEC-001 remains in progress. School-wide security controls and the wider authorization/compliance acceptance audit are not signed off by this checkpoint.

Verification result: full backend suite 285 passed, 1 intentional live-database skip; backend build, focused ESLint and diff check pass.
