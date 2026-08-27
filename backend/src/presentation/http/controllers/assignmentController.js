import * as service from '../../../application/services/assignmentService.js';

const context = (req) => ({
  tenantId: req.schoolContext.tenantId,
  schoolId: req.schoolContext.schoolId,
});

export async function list(req, res, next) {
  try {
    res.json({ success: true, data: await service.list({ ...context(req), ...req.query }) });
  } catch (error) {
    next(error);
  }
}
export async function create(req, res, next) {
  try {
    res
      .status(201)
      .json({
        success: true,
        data: await service.create({ ...context(req), ...req.body, authorId: req.user?.id }),
      });
  } catch (error) {
    next(error);
  }
}
export async function updateStatus(req, res, next) {
  try {
    res.json({
      success: true,
      data: await service.updateStatus({ ...context(req), id: req.params.id, ...req.body }),
    });
  } catch (error) {
    next(error);
  }
}
