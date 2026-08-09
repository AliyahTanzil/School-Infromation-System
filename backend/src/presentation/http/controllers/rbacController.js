import roleService from '../../../application/services/roleService.js';
import permissionService from '../../../application/services/permissionService.js';
import authorizationService from '../../../application/services/authorizationService.js';

export async function listRoles(req, res) {
  res.json({ data: await roleService.list({ search: req.query.search }) });
}
export async function getRole(req, res) {
  res.json({ data: await roleService.get(req.params.id) });
}
export async function createRole(req, res) {
  res.status(201).json({ data: await roleService.create(req.body, req.user.id) });
}
export async function updateRole(req, res) {
  res.json({ data: await roleService.update(req.params.id, req.body, req.user.id) });
}
export async function deleteRole(req, res) {
  await roleService.remove(req.params.id, req.user.id);
  res.status(204).send();
}
export async function assignPermission(req, res) {
  res.json({
    data: await roleService.assignPermission(req.params.id, req.body.permissionId, req.user.id),
  });
}
export async function listPermissions(req, res) {
  res.json({
    data: await permissionService.list({ search: req.query.search, groupKey: req.query.groupKey }),
  });
}
export async function myPermissions(req, res) {
  res.json({
    data: await authorizationService.effectivePermissions(
      req.user.id,
      req.query.scopeKey ?? 'global'
    ),
  });
}

export default {
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  assignPermission,
  listPermissions,
  myPermissions,
};
