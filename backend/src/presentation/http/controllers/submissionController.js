import * as service from '../../../application/services/submissionService.js';

const scope = (req) => ({
  tenantId: req.schoolContext.tenantId,
  schoolId: req.schoolContext.schoolId,
});

export async function list(req, res, next) {
  try {
    res.json({ success: true, data: await service.list({ ...scope(req), ...req.query }) });
  } catch (error) {
    next(error);
  }
}

export async function save(req, res, next) {
  try {
    res
      .status(201)
      .json({
        success: true,
        data: await service.saveVersion({
          ...scope(req),
          ...req.body,
          studentId: req.body.studentId || req.user?.id,
        }),
      });
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req, res, next) {
  try {
    res.json({
      success: true,
      data: await service.updateStatus({ ...scope(req), id: req.params.id, ...req.body }),
    });
  } catch (error) {
    next(error);
  }
}
