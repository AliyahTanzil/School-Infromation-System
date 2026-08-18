# Mobile6 assessment contract

The backend exposes authenticated examination routes for listing, detail, status transitions, mark upserts, results, statistics, processing, and result status changes.

The current Prisma schema snapshot does not contain the examination models referenced by the services, so the mobile app does not invent persistence or grading formulas. Score validation mirrors only the backend lifecycle guard: numeric, non-negative, and no greater than max score. Official grades, rankings, report cards, publication, approval, and processing remain backend-owned.

Current Mobile6 UI is a safe score-entry foundation. It uses explicit incomplete/error states and does not submit unsupported bulk import, local grade calculations, or report-card data.
