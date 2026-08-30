import userService from '../../../application/services/userManagementService.js';
import profileService from '../../../application/services/profileService.js';
import imageService from '../../../application/services/imageService.js';
import deviceService from '../../../application/services/deviceService.js';

const context = (req) => ({
  scopeKey: req.auth?.schoolId ?? req.auth?.tenantId ?? 'school',
  requestId: req.id,
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
});
const send = (res, data, status = 200) => res.status(status).json({ success: true, data });

export default {
  list: async (req, res) => send(res, await userService.listUsers(req.query, req.auth.tenantId)),
  get: async (req, res) =>
    send(
      res,
      await userService.getUser(
        req.params.id,
        req.auth.tenantId,
        req.query.includeDeleted === 'true'
      )
    ),
  create: async (req, res) =>
    send(
      res,
      await userService.createUser(req.body, req.user.id, req.auth.tenantId, context(req)),
      201
    ),
  update: async (req, res) =>
    send(
      res,
      await userService.updateUser(
        req.params.id,
        req.body,
        req.user.id,
        req.auth.tenantId,
        context(req)
      )
    ),
  status: async (req, res) =>
    send(
      res,
      await userService.changeStatus(
        req.params.id,
        req.body.status,
        req.user.id,
        req.auth.tenantId,
        req.body.reason,
        context(req)
      )
    ),
  remove: async (req, res) =>
    send(
      res,
      await userService.deleteUser(
        req.params.id,
        req.user.id,
        req.auth.tenantId,
        req.body?.reason,
        context(req)
      )
    ),
  restore: async (req, res) =>
    send(
      res,
      await userService.restoreUser(req.params.id, req.user.id, req.auth.tenantId, context(req))
    ),
  registerPushToken: async (req, res) =>
    send(res, await deviceService.registerPushToken({ userId: req.user.id, ...req.body }), 201),
  profile: async (req, res) => send(res, await profileService.getProfile(req.params.id)),
  updateProfile: async (req, res) =>
    send(
      res,
      await profileService.updateProfile(
        req.params.id,
        req.body.profile,
        req.body.preference,
        req.user.id,
        context(req)
      )
    ),
  uploadImage: async (req, res) =>
    send(res, await imageService.upload(req.params.id, req.file, req.user.id, context(req)), 201),
  deleteImage: async (req, res) =>
    send(res, await imageService.remove(req.params.id, req.user.id, context(req))),
};
