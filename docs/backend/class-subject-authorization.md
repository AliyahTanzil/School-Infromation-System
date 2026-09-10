# Class and subject administration authorization

The class and subject APIs are mounted under both `/api` and `/api/v1`. Every route authenticates the session and resolves the school context before applying its administrator guard. Existing role codes `PLATFORM_ADMIN`, `SCHOOL_ADMIN`, `APPLICATION_MANAGER` and `OWNER` remain accepted.

The guards also accept the authenticated `platformRole: OWNER`, consistent with academic-calendar administration. Authentication resolves this field from the persisted account. An owner does not need a duplicate `UserRole` assignment to create classes or manage subjects. The account type `APPLICATION_MANAGER` alone does not grant access; ownership fields supplied through the body, query or school context do not grant access either.

This fixes the local `POST /api/classes` HTTP 403 reported on 2026-09-10. The server logged `AUTHORIZATION_ERROR`: the previous guard searched only the role-code array even though platform ownership is stored separately in `platformRole`. Subject routes had the same mismatch. No changes to global authorization, tenant/school resolution, request validation or persistence are required.

Behavioral regressions cover owners without role assignments, existing administrator roles, denied ordinary accounts, forged owner claims, unauthenticated calls and the ordering of authentication, school resolution and the route guard. Live class creation is left to the user's intended submission; verification does not create a test class in the school database.
