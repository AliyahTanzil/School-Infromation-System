# Security administration — Phase 20

Date: 2026-09-08. Task: SEC-001 (in progress).

## Authorization audit wave 3

The canonical server exposed the provisional billing router even though `SaaS-001` remains blocked and the required billing persistence models are absent from the active Prisma schema. That router allowed any authenticated user to request subscription lifecycle changes. Its webhook endpoint also stored provider payload hashes without authenticating a provider signature.

Both `/api/billing` and `/api/v1/billing` now use the controlled unavailable-feature router and return HTTP 501 with `FEATURE_NOT_IMPLEMENTED` and `requiredTask: SaaS-001`. The incomplete lifecycle and unsigned webhook handlers remain unmounted until the billing task supplies durable persistence, administrator authorization, provider signature verification, replay protection and contract tests.

The web billing page already handles API failures and therefore presents the controlled unavailable message rather than claiming a billing change was accepted.

## Verification

Seventeen focused composition, runtime and authorization tests pass. The backend production build, targeted lint and diff validation pass. Runtime coverage verifies both billing mounts return the controlled 501 response, while source coverage prevents the provisional router from being remounted accidentally. The complete backend suite passes with 375 tests and one intentional live-database skip.

No subscription, webhook, database or session records were changed. SEC-001 remains in progress for the remaining mounted-route and compliance audit.
