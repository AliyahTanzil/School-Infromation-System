# Backend 23 Recovery Readiness Checklist

## Before release

- [ ] Managed PostgreSQL backups and point-in-time recovery are enabled.
- [ ] Backup retention, region, RPO, and RTO are recorded.
- [ ] Restore owner and escalation path are recorded.
- [ ] Migration SQL has been reviewed for destructive operations.
- [ ] Import/export paths exclude credentials, tokens, and secrets.

## Restore drill

- [ ] Restore into an isolated database; do not overwrite production first.
- [ ] Run `npm run db:check -w backend` and `npm run db:generate -w backend`.
- [ ] Run migration status and integrity checks.
- [ ] Compare tenant-scoped counts and key business totals.
- [ ] Verify authentication, health, authorization, and representative CRUD.
- [ ] Record restore timestamp, migration state, findings, and cutover decision.

## Incident handling

Preserve request IDs, deployment version, database recovery point, audit events, and relevant logs. Prefer rolling back application artifacts while keeping a forward-compatible database schema. Any destructive restoration or migration reversal requires explicit approval and a tested recovery path.
