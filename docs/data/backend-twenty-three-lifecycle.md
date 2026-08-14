# Backend 23 Data Lifecycle and Recovery

## Classification

- **Identity and authentication:** users, sessions, refresh tokens, trusted devices, login events, and security audits. Restricted; credentials and tokens are never exported.
- **Tenant and academic records:** tenants, students, guardians, teachers, classes, attendance, examinations, timetables, and results. Tenant-scoped confidential data.
- **Finance and operations:** invoices, payments, billing, transport, library, HR, notifications, and integrations. Tenant-scoped operational data with business and regulatory retention requirements.
- **Observability:** request logs, metrics, and audit records. Logs must be redacted and retained according to the incident-response policy.

## Ownership and boundaries

Each tenant owns its operational records. Services and repositories must include `tenantId` in tenant-visible queries and mutations. Platform roles may cross tenant boundaries only through explicitly authorized administrative workflows. Audit records preserve actor, tenant, entity, action, and request context where available.

## Lifecycle

1. **Create:** validate input, assign the tenant, write related records transactionally where needed, and emit an audit event.
2. **Use:** authorize every read and write; paginate unbounded collections.
3. **Export:** require an authorized export action, exclude secrets and tokens, record the export event, and use an approved encrypted transfer channel.
4. **Archive/delete:** use domain retention rules and soft-delete fields where present. Destructive deletion requires an approved migration or administrative workflow.
5. **Restore:** restore to an isolated database, validate Prisma migrations, tenant counts, foreign-key integrity, and representative reads before cutover.

## Backup and recovery

Managed PostgreSQL backups and point-in-time recovery are required. Exact RPO, RTO, retention, region, and restore owner are TBD deployment decisions. A restore drill must record the snapshot or recovery timestamp, migration state, integrity checks, tenant isolation checks, and application smoke results.

## Reconciliation

After restore or import, compare row counts and key totals by tenant for users, students, attendance, results, invoices, payments, notifications, and audit events. Investigate mismatches before traffic is redirected. Never reconcile by disabling foreign keys or bypassing authorization.
