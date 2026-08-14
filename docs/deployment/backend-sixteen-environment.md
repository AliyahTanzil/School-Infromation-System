# Deployment Environment Matrix

| Setting     | Local development                | Preview/staging                           | Production                                |
| ----------- | -------------------------------- | ----------------------------------------- | ----------------------------------------- |
| `NODE_ENV`  | `development`                    | `production`                              | `production`                              |
| API         | Vite `/api` proxy                | same-origin `/api` or approved API origin | same-origin `/api` or approved API origin |
| Database    | Docker or development PostgreSQL | isolated managed database                 | managed PostgreSQL with backups           |
| Migrations  | `db:migrate`                     | reviewed `db:migrate:deploy`              | reviewed `db:migrate:deploy`              |
| JWT secrets | local-only values                | independent secret values                 | independent high-entropy secret values    |
| CORS        | local frontend origin            | exact preview origin(s)                   | exact production origin(s)                |
| Logging     | `debug`                          | `info`                                    | `info`/`warn`; never secrets              |

Never copy production database credentials, JWT secrets, provider tokens, or backup exports into local `.env` files or frontend `VITE_` variables.
