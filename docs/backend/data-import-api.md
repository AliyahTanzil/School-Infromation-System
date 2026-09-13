---
noteId: 'c8fa0b00ae7611f18df517a1f5a83d14'
tags: []
---

# Data import API

Bulk import of CSV, TSV, JSON, and spreadsheet (`.xlsx`/`.xls`) files into whitelisted
school-scoped entities, with per-row validation and an error report. Import performs
create, update, upsert, and delete operations.

## Authentication and authorization

All routes require a Bearer access token and are restricted to the application owner,
platform administrators, and school administrators (`authorizeSchoolAdmin`). The tenant
and school are resolved from the authenticated session; scope is never read from the file.
Every import writes an `AuditLog` entry with the mode, counts, and outcome.

## Endpoints

Both `/api/import` and `/api/v1/import` are mounted.

| Method | Path               | Description                                    |
| ------ | ------------------ | ---------------------------------------------- |
| GET    | `/import/entities` | List supported entities and their columns.     |
| POST   | `/import`          | Apply an import (file upload or `rows` array). |

### `POST /import`

Multipart form upload:

- `file` — the data file (`.csv`, `.tsv`, `.json`, `.xlsx`, `.xls`; max 5 MB).
- `entity` — target entity (see below).
- `mode` — `create` (default), `upsert`, `update`, or `delete`.
- `dryRun` — `true` to validate without writing.

JSON body alternative:

`dryRun` accepts JSON booleans or the exact multipart strings `true`, `false`, `1`,
and `0`. Other values are rejected; omitting it defaults to `false`.

```json
{
  "entity": "students",
  "mode": "upsert",
  "dryRun": false,
  "rows": [{ "admissionNumber": "S-1001", "firstName": "Ada", "lastName": "Obi" }]
}
```

### Modes

- `create` — insert new rows; required columns must be present.
- `upsert` — insert when the key is absent, otherwise update.
- `update` — update the record matching the key; at least one non-key column required.
- `delete` — delete the record matching the key (destructive; use deliberately).

### Response

```json
{
  "success": true,
  "data": {
    "entity": "students",
    "mode": "upsert",
    "dryRun": false,
    "summary": { "total": 120, "created": 118, "updated": 1, "deleted": 0, "failed": 1 },
    "errors": [{ "row": 42, "message": "\"dateOfBirth\" is not a valid date" }]
  }
}
```

Row numbers are 1-based within the data rows (the header is not counted).

## Supported entities

| Entity     | Key               | Scope           | Columns                                                                 |
| ---------- | ----------------- | --------------- | ----------------------------------------------------------------------- |
| `students` | `admissionNumber` | tenant          | admissionNumber, firstName, lastName, dateOfBirth, gender, email, phone |
| `teachers` | `employeeNumber`  | tenant + school | employeeNumber, status, firstName, lastName, email, phone               |
| `subjects` | `code`            | tenant + school | code, name, description, status                                         |

Column headers are matched case- and separator-insensitively (`First Name`, `first_name`,
and `firstName` all map to `firstName`). Unknown, empty, or scope columns (`id`,
`tenantId`, `schoolId`) are rejected so that scope and identity cannot be overridden from
a file.

Adding an entity means extending `backend/src/application/services/importService.js`; the
parser, routes, and error reporting are entity-agnostic.

## Security notes

- Files are size-limited (5 MB) and extension-checked; scope is always enforced server-side.
- Spreadsheet parsing uses the `xlsx` dependency, which carries an unresolved upstream
  advisory (`docs/deployment/backend-sixteen-audit.md`). Treat spreadsheet uploads from
  untrusted sources with care until that dependency is replaced or isolated.
