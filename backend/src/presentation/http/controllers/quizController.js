import * as service from '../../../application/services/quizService.js';

const scope = (req) => ({
  tenantId: req.schoolContext.tenantId,
  schoolId: req.schoolContext.schoolId,
});
const access = (req) => ({ roles: req.user.roles ?? [], platformRole: req.user.platformRole });

export async function list(req, res, next) {
  try {
    res.json({
      success: true,
      data: await service.list(scope(req), req.query.classroomId, req.user.id, access(req)),
    });
  } catch (error) {
    next(error);
  }
}
export async function details(req, res, next) {
  try {
    res.json({
      success: true,
      data: await service.details(scope(req), req.params.id, req.user.id, access(req)),
    });
  } catch (error) {
    next(error);
  }
}
export async function create(req, res, next) {
  try {
    res.status(201).json({
      success: true,
      data: await service.create(scope(req), req.user.id, access(req), req.body),
    });
  } catch (error) {
    next(error);
  }
}
export async function addQuestion(req, res, next) {
  try {
    res.status(201).json({
      success: true,
      data: await service.addQuestion(
        scope(req),
        req.params.id,
        req.user.id,
        access(req),
        req.body
      ),
    });
  } catch (error) {
    next(error);
  }
}
export async function changeStatus(req, res, next) {
  try {
    res.json({
      success: true,
      data: await service.changeStatus(
        scope(req),
        req.params.id,
        req.user.id,
        access(req),
        req.body.status
      ),
    });
  } catch (error) {
    next(error);
  }
}
export async function startAttempt(req, res, next) {
  try {
    res.status(201).json({
      success: true,
      data: await service.startAttempt(scope(req), req.params.id, req.user.id, access(req)),
    });
  } catch (error) {
    next(error);
  }
}
export async function saveAnswer(req, res, next) {
  try {
    res.json({
      success: true,
      data: await service.saveAnswer(scope(req), req.params.attemptId, req.user.id, req.body),
    });
  } catch (error) {
    next(error);
  }
}
export async function submitAttempt(req, res, next) {
  try {
    res.json({
      success: true,
      data: await service.submitAttempt(scope(req), req.params.attemptId, req.user.id),
    });
  } catch (error) {
    next(error);
  }
}
