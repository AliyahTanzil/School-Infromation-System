import * as service from '../../../application/services/classroomLiveSessionService.js';

export async function list(req, res, next) {
  try {
    const query = req.validatedQuery ?? req.query;
    res.json({
      success: true,
      data: await service.list(
        req.schoolContext,
        query.classroomId,
        req.user.id,
        req.user.roles ?? [],
        query.status
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function listRecordings(req, res, next) {
  try {
    res.json({
      success: true,
      data: await service.listRecordings(req.schoolContext, req.user.id, req.user.roles ?? []),
    });
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    res.status(201).json({
      success: true,
      data: await service.create(req.schoolContext, req.user.id, req.user.roles ?? [], req.body),
    });
  } catch (error) {
    next(error);
  }
}

export async function get(req, res, next) {
  try {
    res.json({
      success: true,
      data: await service.get(req.schoolContext, req.params.id, req.user.id, req.user.roles ?? []),
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
        req.schoolContext,
        req.params.id,
        req.user.id,
        req.user.roles ?? [],
        req.body.status,
        req.body
      ),
    });
  } catch (error) {
    next(error);
  }
}
