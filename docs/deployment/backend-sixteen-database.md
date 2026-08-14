# Database, Secrets, and Backup Operations

## Database

Use PostgreSQL 16-compatible managed infrastructure. The application uses Prisma and requires `DATABASE_URL`; production should use a pooled TLS connection where supported and keep a separate non-pooled connection for migrations when the provider requires it.

## Migration safety

- Review generated SQL before merge.
- Run `npm run db:check -w backend` and `npm run db:generate -w backend` in CI.
- Apply production migrations with `npm run db:migrate:deploy -w backend`.
- Never run `db:reset` in a production environment.

## Backups and restore

The managed provider owns automated snapshots and point-in-time recovery. Retain backups according to the organization policy, test a restore into an isolated database, validate Prisma migrations and tenant integrity, then document the restore timestamp and resulting connection cutover.

## Secrets

Store secrets only in the deployment platform secret manager. Required production classes include database credentials, independent JWT access/refresh secrets, mail/provider credentials, webhook signing secrets, and CORS/API configuration. Do not expose server secrets through `VITE_` variables or client bundles.
