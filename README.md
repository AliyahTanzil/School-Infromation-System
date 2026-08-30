# School Information System

This repository contains a production-oriented information and administration system for one
school. It is being migrated from an earlier multi-tenant SAAS design. The target deployment has
one configured `School`, optional campuses, server-enforced roles and permissions, and no
user-facing school or tenant selection.

The monorepo contains an Express/Prisma/PostgreSQL backend, a React/Vite web application, and an
Expo/React Native mobile client. See [the re-engineering audit](docs/REENGINEERING-AUDIT.md) for
the current architecture, migration constraints, known issues, and staged conversion plan.

## Quick start

1. Install Node.js 20 or later and PostgreSQL 16.
2. Run `npm install` at the repository root and `npm install --prefix mobile` for the mobile app.
3. Copy `.env.example` to `.env` and provide the database URL and independent strong access and
   refresh token secrets. Never commit `.env`.
4. Run `npm run db:generate`, then `npm run db:migrate:deploy -w backend`.
5. Set `SINGLE_SCHOOL_ID` if the migrated database contains more than one legacy School row.
6. Run `npm run dev:all` for the web and backend applications.

Useful verification commands are `npm test`, `npm run lint`, `npm run build:frontend`,
`npm run build -w backend`, and `npm run typecheck --prefix mobile`.

## Legacy configuration reference

This project is configured as a Node.js monorepo with `backend` and `frontend` workspaces, plus Docker infrastructure services.

## Generated configuration files

- [package.json](package.json)
- [eslint.config.js](eslint.config.js)
- [.prettierrc](.prettierrc)
- [.gitignore](.gitignore)
- [.editorconfig](.editorconfig)
- [.env.example](.env.example)
- [docker-compose.yml](docker-compose.yml)
- [README.md](README.md)

## Option-by-option explanation

### [package.json](package.json)

- `name`: Workspace package name.
- `version`: Project semantic version.
- `private: true`: Prevents accidental publication to npm.
- `type: module`: Enables ES Modules (`import`/`export`) by default.
- `engines.node`: Enforces Node.js LTS minimum version.
- `workspaces`: Declares monorepo packages (`backend`, `frontend`).
- `scripts.dev:backend`: Runs backend dev server from workspace.
- `scripts.dev:frontend`: Runs frontend Vite dev server from workspace.
- `scripts.build:frontend`: Builds frontend production assets.
- `scripts.lint`: Runs ESLint across repository.
- `scripts.format`: Runs Prettier formatting across repository.
- `scripts.prepare`: Initializes Husky hooks.
- `devDependencies.@eslint/js`: ESLint official JavaScript preset.
- `devDependencies.eslint`: Core linter.
- `devDependencies.eslint-config-prettier`: Disables ESLint style rules that conflict with Prettier.
- `devDependencies.eslint-plugin-react`: React lint rules.
- `devDependencies.eslint-plugin-react-hooks`: Hook dependency and usage rules.
- `devDependencies.globals`: Standard runtime globals (`node`, `browser`).
- `devDependencies.husky`: Git hooks manager.
- `devDependencies.lint-staged`: Runs checks only on staged files.
- `devDependencies.prettier`: Code formatter.
- `lint-staged`: File glob and commands to run pre-commit (`eslint --fix`, `prettier --write`).

### [eslint.config.js](eslint.config.js)

- `ignores`: Excludes generated/vendor folders (`node_modules`, `dist`, `coverage`, `.vite`).
- `js.configs.recommended`: Base recommended ESLint rules.
- Backend block (`files: backend/**/*.js|mjs|cjs`):
  - `languageOptions.ecmaVersion: latest`: Uses latest JS syntax.
  - `sourceType: module`: Enforces ES module parsing.
  - `globals.node`: Enables Node globals.
  - `rules.no-console: off`: Allows operational logging.
- Frontend block (`files: frontend/**/*.js|jsx`):
  - `parserOptions.ecmaFeatures.jsx: true`: Enables JSX parsing.
  - `globals.browser`: Enables browser globals.
  - `plugins.react`: React component linting.
  - `plugins.react-hooks`: Hook safety linting.
  - `react/react-in-jsx-scope: off`: Not required with modern React runtime.
  - `settings.react.version: detect`: Auto-detects installed React version.
- `eslintConfigPrettier`: Final override to avoid ESLint/Prettier rule conflicts.

### [.prettierrc](.prettierrc)

- `singleQuote: true`: Uses `'` instead of `"` where valid.
- `semi: true`: Adds semicolons at statement end.
- `trailingComma: es5`: Keeps trailing commas where supported by ES5.
- `printWidth: 100`: Wrap target line width.
- `tabWidth: 2`: Two-space indentation width.

### [.gitignore](.gitignore)

- `node_modules`, `backend/node_modules`, `frontend/node_modules`: Ignore installed dependencies.
- `dist`, `build`, `coverage`, `.vite`: Ignore generated build/test artifacts.
- `.env*` and workspace `.env`: Prevent secret leakage.
- `*.log`, `logs/`: Ignore log files.
- `.DS_Store`, `Thumbs.db`: Ignore OS-generated metadata.
- `.idea` and Visual Studio artifacts: Ignore local IDE files.
- `.husky/_`: Ignore Husky runtime internals.

### [.editorconfig](.editorconfig)

- `root = true`: Stops parent directory config lookup.
- `charset = utf-8`: Standard file encoding.
- `end_of_line = lf`: Unix-style line endings.
- `indent_style = space`: Uses spaces, not tabs.
- `indent_size = 2`: Two-space indentation.
- `insert_final_newline = true`: Adds newline at EOF.
- `trim_trailing_whitespace = true`: Removes trailing spaces.
- Markdown override (`[*.md] trim_trailing_whitespace = false`): Keeps intentional trailing spaces in markdown.

### [.env.example](.env.example)

- `POSTGRES_DB`: Default PostgreSQL database name.
- `POSTGRES_USER`: PostgreSQL username.
- `POSTGRES_PASSWORD`: PostgreSQL password.
- `PGADMIN_DEFAULT_EMAIL`: pgAdmin login email.
- `PGADMIN_DEFAULT_PASSWORD`: pgAdmin login password.
- `APP_PORT`: App host port mapping value.
- `DATABASE_URL`: Application PostgreSQL DSN.
- `REDIS_URL`: Application Redis connection URI.

### [docker-compose.yml](docker-compose.yml)

Global structure:

- `services`: Container definitions.
- `volumes`: Persistent named volumes.
- `networks`: Internal network fabric.

`app` service:

- `build.context` and `build.dockerfile`: Builds app image from repository.
- `container_name`: Stable container name.
- `restart: unless-stopped`: Auto-restart unless explicitly stopped.
- `ports`: Host-to-container port mapping (`3000:3000`).
- `environment`: Runtime variables passed into container.
- `depends_on` with `condition: service_healthy`: Waits for healthy `postgres` and `redis`.
- `networks`: Connects to `sais-net`.

`postgres` service:

- `image: postgres:16-alpine`: PostgreSQL image tag.
- `environment`: DB bootstrap settings.
- `ports`: Exposes PostgreSQL on `5432`.
- `volumes`: Persists data at `/var/lib/postgresql/data`.
- `healthcheck.test`: `pg_isready` health probe command.
- `healthcheck.interval|timeout|retries|start_period`: Probe timing controls.

`pgadmin` service:

- `image: dpage/pgadmin4:8`: pgAdmin image.
- `environment`: UI admin credentials.
- `ports`: Exposes pgAdmin UI at host `5050`.
- `depends_on`: Waits for healthy Postgres.
- `volumes`: Persists pgAdmin state.
- `healthcheck`: HTTP ping test against internal endpoint.

`redis` service:

- `image: redis:7-alpine`: Redis image.
- `ports`: Exposes Redis on `6379`.
- `volumes`: Persists Redis data directory.
- `healthcheck.test`: `redis-cli ping` readiness check.

`volumes`:

- `postgres_data`: PostgreSQL persistence.
- `pgadmin_data`: pgAdmin persistence.
- `redis_data`: Redis persistence.

`networks`:

- `sais-net` with `driver: bridge`: Isolated bridge network for inter-service DNS routing.

### [README.md](README.md)

- Provides project-level setup and configuration reference.
- Serves as the canonical explanation for all generated root configuration files.
