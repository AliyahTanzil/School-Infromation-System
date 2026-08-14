# Production database safety

- Keep `DATABASE_URL` and unpooled administration URLs server-side only.
- Prefer pooled connections for request traffic and a bounded connection pool.
- Apply migrations during a controlled release, never on every request.
- Monitor migration history, connection saturation, query latency, failed transactions, and integrity-check failures.
- Treat tenant IDs and user IDs as untrusted input and scope them in every query.
- Use soft deletion where historical records or auditability require retention.
- Keep financial, attendance, assessment, and identity history append-only where the domain requires it.
- Log request IDs and safe operation metadata, never credentials, tokens, or personal data beyond the minimum operational need.
