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
const tenantId = (req) => req.schoolContext.tenantId;

export default {
  list: async (req, res) =>
    send(res, await userService.listUsers(req.validatedQuery ?? req.query, tenantId(req))),
  get: async (req, res) =>
    send(
      res,
      await userService.getUser(
        req.params.id,
        tenantId(req),
        (req.validatedQuery ?? req.query).includeDeleted === 'true'
      )
    ),
  create: async (req, res) =>
    send(
      res,
      await userService.createUser(req.body, req.user.id, tenantId(req), context(req)),
      201
    ),
  update: async (req, res) =>
    send(
      res,
      await userService.updateUser(
        req.params.id,
        req.body,
        req.user.id,
        tenantId(req),
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
        tenantId(req),
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
        tenantId(req),
        req.body?.reason,
        context(req)
      )
    ),
  restore: async (req, res) =>
    send(
      res,
      await userService.restoreUser(req.params.id, req.user.id, tenantId(req), context(req))
    ),
  registerPushToken: async (req, res) =>
    send(
      res,
      await deviceService.registerPushToken({
        userId: req.user.id,
        deviceFingerprint: req.body.deviceFingerprint,
        platform: req.body.platform,
        pushToken: req.body.pushToken,
      }),
      201
    ),
  profile: async (req, res) =>
    send(res, await profileService.getProfile(req.params.id, tenantId(req))),
  updateProfile: async (req, res) =>
    send(
      res,
      await profileService.updateProfile(
        req.params.id,
        req.body.profile,
        req.body.preference,
        req.user.id,
        tenantId(req),
        context(req)
      )
    ),
  uploadImage: async (req, res) =>
    send(
      res,
      await imageService.upload(req.params.id, req.file, req.user.id, tenantId(req), context(req)),
      201
    ),
  deleteImage: async (req, res) =>
    send(res, await imageService.remove(req.params.id, req.user.id, tenantId(req), context(req))),
};
