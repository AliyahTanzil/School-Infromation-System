# SAIS backend foundation

Step 2 establishes the runtime and development infrastructure only. Domain schema, authentication, authorization, and business modules are intentionally deferred.

## Requirements

- Node.js 20 (`.nvmrc`)
- npm 11
- PostgreSQL 16 when database work is enabled

## Commands

```bash
npm install
npm run dev
npm run build
npm start
npm test
npm run lint
npm run format
npm run format:check
npm run db:generate
npm run db:check
npm run db:studio
```

For local PostgreSQL:

```bash
docker compose -f backend/docker-compose.yml up -d
# set DATABASE_URL=postgresql://sais:sais_password@localhost:5432/sais?schema=public

docker compose -f backend/docker-compose.yml down
```

The development server can start without `DATABASE_URL`; `/api/v1/health` reports process liveness only. Production startup fails fast when `DATABASE_URL` is missing.

The frontend development origin is configured with `CORS_ORIGIN` (comma-separated origins are supported by the configuration contract; the current foundation accepts one origin).
