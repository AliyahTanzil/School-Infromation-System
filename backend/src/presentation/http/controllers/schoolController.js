import service from '../../../application/services/schoolService.js';
import AuthorizationError from '../../../shared/errors/AuthorizationError.js';
const tenant = (req) => {
  if (req.user?.tenantId) return req.user.tenantId;
  if (req.user?.platformRole === 'OWNER') return undefined;
  throw new AuthorizationError('School account context is required');
};
const send = (res, data, status = 200) => res.status(status).json({ success: true, data });
export default {
  list: async (req, res) =>
    send(
      res,
      await service.list({
        tenantId: tenant(req),
        search: req.query.search,
        page: req.query.page,
        pageSize: req.query.pageSize,
      })
    ),
  get: async (req, res) => send(res, await service.get(req.params.id, tenant(req))),
  create: async (req, res) =>
    send(res, await service.create({ ...req.body, tenantId: tenant(req) }, req.user.id), 201),
  update: async (req, res) => send(res, await service.update(req.params.id, tenant(req), req.body)),
  remove: async (req, res) => send(res, await service.remove(req.params.id, tenant(req))),
  children: async (req, res) =>
    send(res, await service.children(req.params.model, req.params.id, tenant(req))),
  addChild: async (req, res) =>
    send(res, await service.addChild(req.params.model, req.params.id, tenant(req), req.body), 201),
  updateChild: async (req, res) =>
    send(
      res,
      await service.updateChild(
        req.params.model,
        req.params.id,
        req.params.schoolId,
        tenant(req),
        req.body
      )
    ),
  deleteChild: async (req, res) =>
    send(
      res,
      await service.deleteChild(req.params.model, req.params.id, req.params.schoolId, tenant(req))
    ),
  admins: async (req, res) => send(res, await service.admins(req.params.id, tenant(req))),
  assignAdmin: async (req, res) =>
    send(res, await service.assignAdmin(req.params.id, tenant(req), req.body, req.user.id), 201),
  revokeAdmin: async (req, res) =>
    send(res, await service.revokeAdmin(req.params.id, req.params.userId, tenant(req))),
};
