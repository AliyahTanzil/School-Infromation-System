import userService from '../../../application/services/userManagementService.js';
import profileService from '../../../application/services/profileService.js';
import imageService from '../../../application/services/imageService.js';

const context = (req) => ({
  scopeKey: req.query.scopeKey ?? req.body?.scopeKey ?? 'global',
  requestId: req.id,
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
});
const send = (res, data, status = 200) => res.status(status).json({ success: true, data });

export default {
  list: async (req, res) => send(res, await userService.listUsers(req.query)),
  get: async (req, res) =>
    send(res, await userService.getUser(req.params.id, req.query.includeDeleted === 'true')),
  create: async (req, res) =>
    send(res, await userService.createUser(req.body, req.user.id, context(req)), 201),
  update: async (req, res) =>
    send(res, await userService.updateUser(req.params.id, req.body, req.user.id, context(req))),
  status: async (req, res) =>
    send(
      res,
      await userService.changeStatus(
        req.params.id,
        req.body.status,
        req.user.id,
        req.body.reason,
        context(req)
      )
    ),
  remove: async (req, res) =>
    send(
      res,
      await userService.deleteUser(req.params.id, req.user.id, req.body?.reason, context(req))
    ),
  restore: async (req, res) =>
    send(res, await userService.restoreUser(req.params.id, req.user.id, context(req))),
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
