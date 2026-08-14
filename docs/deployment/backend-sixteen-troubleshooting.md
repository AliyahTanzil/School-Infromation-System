# Troubleshooting and Rollback Decision Tree

1. **Frontend cannot load**: check static asset deployment, browser console, and API base URL. If the API is healthy, roll back only the frontend artifact.
2. **Frontend loads but API calls fail**: check same-origin rewrite/proxy, CORS origin, cookies, and API health endpoints. Use the request ID from the response/logs.
3. **API liveness fails**: stop promotion and route to the previous backend artifact.
4. **Readiness or database health fails**: inspect database provider availability, connection pool saturation, TLS, and migration status. Do not run destructive migration commands.
5. **Migration incompatibility**: keep the database on the forward-compatible schema, restore the prior application artifact, and schedule a reviewed corrective migration.
6. **Provider integration fails**: disable the affected feature or provider route, preserve idempotency, and avoid repeated retries.

Rollback is complete only after liveness, readiness, database health, authentication, and representative tenant-scoped CRUD checks pass.
