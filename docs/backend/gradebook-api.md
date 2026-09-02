# Gradebook, rubrics, and feedback API

The active gradebook API is mounted at `/api/lms/gradebook` and `/api/v1/lms/gradebook`.
Every request requires authentication. Tenant and school ownership are derived from the authenticated
school context; request bodies cannot select either value.

## Endpoints

- `GET /rubrics?classroomId=<uuid>` lists classroom rubrics. Students only receive published rubrics.
- `POST /rubrics` creates a rubric and its ordered criteria. School administrators and classroom
  teachers may create rubrics.
- `PATCH /rubrics/:id/status` publishes or archives a rubric.
- `GET /grades?assignmentId=<uuid>` returns submission rows. Teachers see their classroom roster;
  students see only their own released grade.
- `PUT /submissions/:submissionId/grade` creates or replaces a draft grade and optional rubric scores.
- `POST /grades/:id/release` releases a draft grade to the learner.
- `POST /grades/:id/feedback` adds a feedback-thread message. Students may reply only to their own
  released grade.

Scores are bounded by the submitted maximum. Rubric score identifiers must belong to the rubric
attached to the assignment, and each score is bounded by its criterion maximum.
