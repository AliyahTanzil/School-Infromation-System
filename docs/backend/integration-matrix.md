# Frontend/Backend Integration Matrix

| Flow           | Frontend request               | Backend contract                                    | Status                                     |
| -------------- | ------------------------------ | --------------------------------------------------- | ------------------------------------------ |
| Student list   | `GET /api/v1/students?search=` | Authenticated, tenant-scoped, `{ data: { items } }` | Aligned                                    |
| Student create | `POST /api/v1/students`        | Permission `student.create`, validated body         | Backend ready; registration screen pending |
| Auth login     | `POST /api/v1/auth/login`      | Secure refresh cookie plus access response          | Existing auth client                       |
| Auth refresh   | `POST /api/v1/auth/refresh`    | Refresh cookie rotation                             | Existing auth client                       |

Legacy dashboard endpoints remain documented in the inventory and should be migrated one module at a time rather than silently pointed at incompatible routes.
