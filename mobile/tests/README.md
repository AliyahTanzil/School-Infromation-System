# Mobile tests

Step 1 uses `npm test` as a TypeScript safety gate. Future tests should be organized as:

- `unit/`: configuration, API error classification, permission predicates, and storage adapters.
- `integration/`: API client contracts against a controlled SAIS backend.
- `navigation/`: role, permission, tenant, and account-status route guards.
- `e2e/`: authenticated user journeys on iOS and Android simulators.

No live credentials or production tenant data belong in test fixtures.
