# Backend 10 domain implementation queue

| Priority | Module                                   | Frontend requirement                    | Backend status | Database status  | Action                                        |
| -------: | ---------------------------------------- | --------------------------------------- | -------------- | ---------------- | --------------------------------------------- |
|        1 | Tenant lifecycle                         | Owner creates and manages tenants       | COMPLETE       | READY            | Regression test and preserve                  |
|        2 | Users and roles                          | User management and activation          | COMPLETE       | READY            | Regression test and preserve                  |
|        3 | Students                                 | List, search, detail, create, guardians | COMPLETE       | READY            | Regression test and preserve                  |
|        4 | Academic years and terms                 | Academic calendar and period management | COMPLETE       | READY            | Use normalized AcademicYear/AcademicTerm APIs |
|        5 | Classes and sections                     | Class setup and enrollment dependencies | API_MISSING    | DATABASE_MISSING | Implement after academic period contract      |
|        6 | Attendance                               | Mark and retrieve attendance            | API_MISSING    | READY            | Implement after class/enrollment APIs         |
|        7 | Assessments and results                  | Marks, exams, reports                   | API_MISSING    | DATABASE_MISSING | Extend schema before API work                 |
|        8 | Finance                                  | Charges, payments, balances             | API_MISSING    | DATABASE_MISSING | Define monetary schema and transactions       |
|        9 | Communication                            | Notifications and announcements         | API_MISSING    | READY            | Implement recipient-scoped APIs               |
|       10 | Library, inventory, timetable, classroom | Existing dashboard surfaces             | API_MISSING    | DATABASE_MISSING | Implement dependency-by-dependency            |

Backend 10 completes the highest dependency-safe gap: academic year and term APIs. Later modules remain intentionally queued rather than represented by mock responses.
