import * as service from '../../../application/services/classroomStreamService.js';

const context = (req) => ({
  tenantId: req.schoolContext.tenantId,
  schoolId: req.schoolContext.schoolId,
  classroomId: req.params.classroomId,
});

export async function list(req, res, next) {
  try {
    res.json({ success: true, data: await service.listStream(context(req)) });
  } catch (error) {
    next(error);
  }
}
export async function announce(req, res, next) {
  try {
    res
      .status(201)
      .json({
        success: true,
        data: await service.createAnnouncement({
          ...context(req),
          authorId: req.user.id,
          ...req.body,
        }),
      });
  } catch (error) {
    next(error);
  }
}
export async function post(req, res, next) {
  try {
    res
      .status(201)
      .json({
        success: true,
        data: await service.createPost({ ...context(req), authorId: req.user.id, ...req.body }),
      });
  } catch (error) {
    next(error);
  }
}
export async function comment(req, res, next) {
  try {
    res
      .status(201)
      .json({
        success: true,
        data: await service.addComment({
          tenantId: req.schoolContext.tenantId,
          schoolId: req.schoolContext.schoolId,
          postId: req.params.postId,
          authorId: req.user.id,
          ...req.body,
        }),
      });
  } catch (error) {
    next(error);
  }
}
