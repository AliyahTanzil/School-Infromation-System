# Security administration Phase 28

Date: 2026-09-09  
Roadmap task: SEC-001  
Status: checkpoint complete; SEC-001 remains in progress

## Scope

Authorization audit wave 11 reviewed canonical school listing, main-school lifecycle operations, Campus branch management, tenant ownership, and school-administrator assignment routes against the active database schema.

## Controls added

- School list queries are strict and bounded to a maximum page size of 100.
- School and Campus branch identifiers are UUID-validated, and create/update bodies accept only active-schema fields.
- Tenant ownership is derived from the authenticated identity after request fields are applied, preventing a client-supplied tenant from overriding server scope even if middleware is bypassed.
- The obsolete school-context middleware is no longer used because it queried nonexistent `School.deletedAt` and `School.status` fields and expected a mismatched route parameter.
- Branch operations retain the real `Campus` persistence path.
- Generic child-resource routes targeting nonexistent or incompatible Prisma models are no longer mounted.
- The configured main school cannot be deleted; deletion returns a controlled conflict instead of issuing an invalid persistence operation.
- School-administrator assignment routes require the canonical `schools.assign` permission and then return `501 FEATURE_NOT_IMPLEMENTED` with `requiredTask: RBAC-002` until a durable assignment model exists.
- Corrupted replacement characters in Campus branch loading and saving states were replaced with readable ellipses.

## Verification

- Focused school-management and authorization backend suite: 11 passed.
- Focused school-scope frontend contract test: 1 passed.
- Full backend suite: 401 passed, 1 intentional live-database skip, 0 failed.
- Full frontend suite: 45 passed, 0 failed.
- Backend and frontend production builds: passed.

No schema migration or live database mutation was required.

## Remaining work

SEC-001 remains open for the remaining mounted-router authorization waves, compliance controls, and final acceptance audit. RBAC-002 must provide a supported school-administrator assignment persistence model before those routes can be enabled.
