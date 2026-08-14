# SAIS database architecture

## Scope

The SAIS backend uses PostgreSQL through Prisma. Tenant-owned records carry a tenant identifier directly or through a tenant-owned parent relation; application code must scope every user-facing read and write to the authenticated tenant context.

## Domains

- Identity and access: users, roles, permissions, sessions, refresh tokens, audit events.
- Tenant administration: tenants, activation requests, profiles, preferences, user audits.
- Academic foundation: academic years and terms, with lifecycle constraints and tenant uniqueness.
- Student management: student records, guardians, profiles, and tenant-scoped associations.

## Data access rules

Use the shared Prisma client. Repository methods accept an explicit tenant ID whenever a record is tenant-owned. Do not build SQL with string interpolation; use Prisma filters or parameterized tagged-template queries. API responses must use DTOs and must not expose password hashes, token hashes, internal audit metadata, or unrestricted cross-tenant relations.

## Constraint policy

Database uniqueness and foreign keys are the final integrity boundary. Application validation provides clear errors but never replaces database constraints. New migrations must be additive or provide a reviewed backfill before a column becomes required. Destructive changes require a separate reviewed migration and a recovery plan.
