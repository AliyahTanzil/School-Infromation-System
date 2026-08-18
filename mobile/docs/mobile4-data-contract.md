# Mobile4 data contract

Mobile4 adds typed query contracts for tenants and people, including pagination, search, status, academic context, and request-id-aware API errors. `managementData` calls the existing SAIS API surface and does not bypass backend authorization or tenant scoping.

The list screens currently provide a deliberate preview fallback so navigation and accessibility can be verified before a connected session is available. Replace those fallback records with `managementData.listTenants` and `managementData.listPeople` when the authenticated role/session is present.

## Confirmed versus pending

Confirmed: the backend exposes user, tenant lifecycle, school, class, academic-period, and student route families. Pending: a single normalized paginated tenant/people read contract and mobile-specific permission metadata. The backend remains authoritative for both permission and tenant isolation.
