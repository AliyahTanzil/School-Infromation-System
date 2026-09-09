# Security administration Phase 34

Date: 2026-09-09
Roadmap task: SEC-001

## Communication API contract

The authenticated `/api/communication` and `/api/v1/communication` endpoints retain existing administrator gates and authenticated recipient identity.

- Notification queries, creation bodies, nested payloads, preference bodies and identifier parameters reject unknown fields.
- Optional quiet hours require HH:mm values using the 24-hour clock; overnight ranges remain valid. This validates stored preferences and does not implement delivery scheduling.
- Communication services reject absent tenant or school context before issuing persistence operations.
- Recipient tenant ownership and non-deleted status are checked through the same transaction client as event and delivery creation. Duplicate recipients and channels remain deduplicated.

No schema migration, live database mutation or outbound message delivery was performed. Recipient eligibility remains tenant-based under the single-school architecture.

## Verification

- Focused communication suite: 9 passed.
- Full backend suite: 425 passed, 1 intentional live-database skip, 0 failures.
- Backend production build, targeted ESLint, formatting and diff checks: passed.

## Remaining work

SEC-001 remains in progress for remaining mounted routes, compliance controls and final acceptance. Provider delivery, quiet-hour enforcement and live concurrency guarantees are outside this checkpoint.
