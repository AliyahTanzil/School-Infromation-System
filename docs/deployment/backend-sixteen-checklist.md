# Backend 16 Readiness Checklist

## Application

- [ ] Production build succeeds for backend and frontend.
- [ ] Backend starts from compiled `dist/main.js`.
- [ ] Same-origin `/api` routing is configured.
- [ ] Health endpoints return expected status.
- [ ] CORS allowlist contains only approved origins.
- [ ] Refresh cookie policy matches the actual frontend/API site relationship.

## Database

- [ ] Managed PostgreSQL is provisioned.
- [ ] TLS and pooled connection settings are verified.
- [ ] Migrations are reviewed and applied with `db:migrate:deploy`.
- [ ] Backup retention and restore procedure are tested.
- [ ] No production reset, seed, or development migration commands are available in the release procedure.

## Security

- [ ] Independent access and refresh JWT secrets are present.
- [ ] No secrets are committed to the repository or frontend bundle.
- [ ] Error responses do not expose stacks, SQL, or credentials.
- [ ] Request IDs are retained in logs for incident correlation.

## Integrations

- [ ] Email/provider credentials and sender domains are configured.
- [ ] Payment/webhook endpoints have provider-side signing configuration.
- [ ] Any external API timeouts and retry policies are documented.
