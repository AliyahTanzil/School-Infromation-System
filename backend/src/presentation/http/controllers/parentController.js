import parentService from '../../../application/services/parentService.js';

const send = (res, data, status = 200) => res.status(status).json({ data });
export default {
  portal: async (req, res) =>
    send(res, await parentService.getPortal(req.parent.id, req.parent.tenantId, req)),
  updateProfile: async (req, res) =>
    send(res, await parentService.updateProfile(req.parent.id, req.body)),
  link: async (req, res) =>
    send(
      res,
      await parentService.link(
        req.parent.id,
        req.parent.tenantId,
        req.body.studentId,
        req.body.relationship
      ),
      201
    ),
  unlink: async (req, res) =>
    send(res, await parentService.unlink(req.parent.id, req.params.studentId)),
};
