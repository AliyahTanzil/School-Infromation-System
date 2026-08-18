# Backend 17 Audit and Incident Readiness

Authentication and session flows already write immutable `AuditLogin` events for registration, login success/failure, lockout, token refresh, logout, password reset, and session revocation. Domain audit records use the tenant-scoped `AuditLog` model with optional actor, entity, metadata, and IP address fields.

Audit metadata must remain free of credentials and sensitive payloads. Queries must always scope tenant-visible records by `tenantId`; global security events may omit tenant ID only when no tenant is known. Audit writes should not turn a successful user action into a credential leak through error handling.

## Incident checklist

1. Capture deployment version, timestamp, affected tenant, request IDs, and health status.
2. Check liveness, readiness, database health, 5xx rate, slow requests, and authentication events.
3. Preserve relevant logs and audit records before remediation.
4. Roll back application artifacts only after checking migration compatibility.
5. Document root cause, containment, recovery, and follow-up controls.
