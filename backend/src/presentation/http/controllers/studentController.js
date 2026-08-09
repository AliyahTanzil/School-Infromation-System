import service from '../../../application/services/studentService.js';

const send = (res, value, status = 200) => res.status(status).json({ data: value });
const context = (req) => req.schoolContext;

export default {
  list: async (req, res) => send(res, await service.list(req.query, context(req))),
  get: async (req, res) => send(res, await service.get(req.params.id, context(req))),
  create: async (req, res) =>
    send(res, await service.create(req.body, context(req), req.user.id), 201),
  update: async (req, res) =>
    send(res, await service.update(req.params.id, req.body, context(req))),
  changeStatus: async (req, res) =>
    send(
      res,
      await service.changeStatus(
        req.params.id,
        req.body.status,
        req.body.reason,
        context(req),
        req.user.id
      )
    ),
  addGuardian: async (req, res) =>
    send(
      res,
      await service.addGuardian(req.params.id, req.body.guardian, req.body.link, context(req)),
      201
    ),
  updateMedical: async (req, res) =>
    send(res, await service.updateMedical(req.params.id, req.body, context(req))),
};
