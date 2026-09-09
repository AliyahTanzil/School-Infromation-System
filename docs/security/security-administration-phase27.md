# Security administration Phase 27

Date: 2026-09-09  
Roadmap task: SEC-001  
Status: checkpoint complete; SEC-001 remains in progress

## Scope

Authorization audit wave 10 reviewed canonical user listing, provisioning, lifecycle management, profiles, profile images, device push tokens, and the normal user-provisioning interface.

## Controls added

- User detail, update, status, delete, restore, profile, and image routes validate target identifiers as UUIDs.
- Query and body schemas are strict and bounded; caller-controlled tenant, school, user, actor, and unsupported persistence fields are rejected.
- User list filters support every active account state while retaining a maximum page size of 100.
- Profile reads require the target user to belong to the authenticated tenant.
- Profile and preference updates verify tenant ownership and commit profile, preference, and audit writes in one transaction.
- Profile-image replacement and removal verify a current tenant-owned user inside the same transaction as image and audit writes.
- Image auditing uses the active `UserAudit` repository contract rather than unsupported direct fields.
- Push-token registration accepts only a validated device fingerprint, optional platform, and Expo token. The target user ID always comes from the authenticated session and cannot be overridden by the body.
- Preference settings map into the active JSON `settings` column and merge with persisted values instead of targeting nonexistent columns.
- Safe user-list DTOs include names and account type required by the UI without exposing credential or lockout fields.
- Normal provisioning offers Staff, Teacher, Parent, and Student identities only. Application-owner and tenant-administrator creation remains outside this workflow.
- Page-limited frontend counts are labeled as visible records rather than tenant-wide totals.

## Verification

- Focused user-management backend suite: 6 passed.
- Focused user-management frontend contract test: 1 passed.
- Full backend suite: 399 passed, 1 intentional live-database skip, 0 failed.
- Full frontend suite: 44 passed, 0 failed.
- Backend and frontend production builds: passed.
- Targeted ESLint, Prettier, and `git diff --check`: passed.

No schema migration or live database mutation was required.

## Remaining work

SEC-001 remains open for the remaining mounted-router authorization waves, compliance controls, and final acceptance audit.
