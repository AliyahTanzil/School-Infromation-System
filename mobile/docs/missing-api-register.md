# Mobile API register

The current backend exposes auth, health, tenant, user, student, teacher, timetable, results, finance, communication, and other domain routes. Before implementing mobile features, each endpoint must be confirmed for request/response schemas, access permissions, tenant scoping, pagination, and offline behavior.

## Deferred contracts

- Auth lifecycle: register, login, refresh, logout, activation, session/device handling.
- Bootstrap: authenticated user, tenant, role, permission, and account-status payload.
- Mobile navigation: a permission-filtered module manifest.
- Notifications: device registration, unread counts, read state, and delivery preferences.
- Sync: cursor/version endpoint and conflict semantics for offline work.
- Uploads: secure document/image upload and download URL contract.

These are intentionally documented gaps, not mocked mobile behavior.
