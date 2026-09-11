import * as service from '../../../application/services/submissionService.js';

const access = (req) => ({ roles: req.user.roles ?? [], platformRole: req.user.platformRole });
const scope = (req) => ({
  tenantId: req.schoolContext.tenantId,
  schoolId: req.schoolContext.schoolId,
});

export async function list(req, res, next) {
  try {
    res.json({
      success: true,
      data: await service.list(scope(req), req.user.id, access(req), req.query.assignmentId),
    });
  } catch (error) {
    next(error);
  }
}

export async function save(req, res, next) {
  try {
    res.status(201).json({
      success: true,
      data: await service.saveVersion(scope(req), req.user.id, access(req), req.body),
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
