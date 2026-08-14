import accountService from '../../../application/services/accountManagementService.js';

export async function me(req, res) {
  const user = await accountService.updateProfile(req.user.id, {});
  res.json({ success: true, data: user });
}

export async function updateProfile(req, res) {
  const user = await accountService.updateProfile(req.user.id, req.body ?? {});
  res.json({ success: true, data: user });
}

export async function listUsers(req, res) {
  const users = await accountService.listUsers(req.user.id, req.auth.tenantId, req.query);
  res.json({ success: true, data: users });
}

export async function updateUser(req, res) {
  const user = await accountService.updateUser(
    req.user.id,
    req.params.id,
    req.auth.tenantId,
    req.body ?? {}
  );
  res.json({ success: true, data: user });
}

export async function changeStatus(req, res) {
  const user = await accountService.changeStatus(
    req.user.id,
    req.params.id,
    req.auth.tenantId,
    req.body.status
  );
  res.json({ success: true, data: user });
}

export async function assignRole(req, res) {
  const user = await accountService.assignRole(
    req.user.id,
    req.params.id,
    req.auth.tenantId,
    req.body.roleCode
  );
  res.json({ success: true, data: user });
}

export async function revokeRole(req, res) {
  await accountService.revokeRole(req.user.id, req.params.id, req.auth.tenantId, req.body.roleCode);
  res.status(204).send();
}
