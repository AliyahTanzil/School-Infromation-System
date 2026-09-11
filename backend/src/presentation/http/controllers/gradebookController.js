import * as service from '../../../application/services/gradebookService.js';

const scope = (req) => ({
  tenantId: req.schoolContext.tenantId,
  schoolId: req.schoolContext.schoolId,
});
const access = (req) => ({ roles: req.user.roles ?? [], platformRole: req.user.platformRole });
const respond = (res, data, status = 200) => res.status(status).json({ success: true, data });

export async function listRubrics(req, res, next) {
  try {
    respond(
      res,
      await service.listRubrics(scope(req), req.query.classroomId, req.user.id, access(req))
    );
  } catch (error) {
    next(error);
  }
}
export async function createRubric(req, res, next) {
  try {
    respond(res, await service.createRubric(scope(req), req.user.id, access(req), req.body), 201);
  } catch (error) {
    next(error);
  }
}
export async function changeRubricStatus(req, res, next) {
  try {
    respond(
      res,
      await service.changeRubricStatus(
        scope(req),
        req.params.id,
        req.user.id,
        access(req),
        req.body.status
      )
    );
  } catch (error) {
    next(error);
  }
}
export async function assignRubric(req, res, next) {
  try {
    respond(
      res,
      await service.assignRubric(
        scope(req),
        req.params.assignmentId,
        req.user.id,
        access(req),
        req.body.rubricId
      )
    );
  } catch (error) {
    next(error);
  }
}
export async function listGrades(req, res, next) {
  try {
    respond(
      res,
      await service.listGrades(scope(req), req.query.assignmentId, req.user.id, access(req))
    );
  } catch (error) {
    next(error);
  }
}
export async function saveGrade(req, res, next) {
  try {
    respond(
      res,
      await service.saveGrade(
        scope(req),
        req.params.submissionId,
        req.user.id,
        access(req),
        req.body
      )
    );
  } catch (error) {
    next(error);
  }
}
export async function releaseGrade(req, res, next) {
  try {
    respond(res, await service.releaseGrade(scope(req), req.params.id, req.user.id, access(req)));
  } catch (error) {
    next(error);
  }
}
export async function addFeedback(req, res, next) {
  try {
    respond(
      res,
      await service.addFeedback(scope(req), req.params.id, req.user.id, access(req), req.body.body),
      201
    );
  } catch (error) {
    next(error);
  }
}
