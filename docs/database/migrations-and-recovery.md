# Database migrations and recovery

## Migration workflow

1. Review the Prisma schema and existing migration history.
2. Generate a named migration from the schema; inspect SQL for destructive operations and data backfills.
3. Run Prisma validation, generation, migration status, and the read-only integrity checker.
4. Apply migrations with `npm run db:migrate:deploy -w backend` in deployment environments.
5. Run backend tests and tenant-isolation checks after deployment.

Never use `prisma migrate reset`, `db push`, or an unreviewed destructive SQL script against shared or production databases.

## Recovery

Before production migrations, verify the provider's point-in-time recovery window and capture the migration name, deploy timestamp, and application version. Recovery is provider-level point-in-time restore followed by forward migration reconciliation; it is not an application-level delete or reset. Restore into an isolated database first, run integrity checks, then update the deployment connection only through the approved release process.

## Seed policy

Seed data is deterministic and idempotent. It is intended for development or explicitly provisioned demo tenants only. Seed code must never delete user data, overwrite passwords, or run automatically during production startup.
