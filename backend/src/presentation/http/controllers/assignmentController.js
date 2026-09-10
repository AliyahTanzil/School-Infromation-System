import * as service from '../../../application/services/assignmentService.js';

const context = (req) => ({
  tenantId: req.schoolContext.tenantId,
  schoolId: req.schoolContext.schoolId,
});

const access = (req) => ({ roles: req.user.roles ?? [], platformRole: req.user.platformRole });

export async function list(req, res, next) {
  try {
    res.json({
      success: true,
      data: await service.list(
        context(req),
        req.query.classroomId,
        req.user.id,
        access(req),
        req.query.status
      ),
    });
  } catch (error) {
    next(error);
  }
}
export async function create(req, res, next) {
  try {
    res.status(201).json({
      success: true,
      data: await service.create(context(req), req.user.id, access(req), req.body),
    });
  } catch (error) {
    next(error);
  }
}
export async function updateStatus(req, res, next) {
  try {
    res.json({
      success: true,
      data: await service.updateStatus(
        context(req),
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
