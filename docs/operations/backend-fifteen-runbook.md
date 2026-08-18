# Backend 15 Operations Runbook

## Health probes

- `/api/health/live`: process liveness only; always returns 200 when the event loop responds.
- `/api/health/ready`: database-backed readiness; a 503 removes the instance from traffic.
- `/api/health/database`: database connectivity and latency without SQL details.
- `/api/health/deep`: internal deployment diagnostic; do not expose publicly.

Run `npm run health -w backend` against a running backend, or set `HEALTHCHECK_URL` for a remote environment.

## Troubleshooting tree

1. `live` fails: inspect process/container restart loops and host resource exhaustion.
2. `live` passes but `ready` fails: inspect database reachability, migrations, pool limits, and credentials.
3. Database passes but authenticated requests fail: inspect JWT configuration, cookie policy, CORS, and clock skew.
4. A single route fails: use the response `requestId` to correlate structured request/error logs.
5. Never reset or migrate production from a troubleshooting shell; use the reviewed migration workflow.

Health responses intentionally omit database error messages, SQL, secrets, and stack traces.
