import tenantService from '../../../application/services/tenantLifecycleService.js';

export async function list(req, res) {
  res.json({ success: true, data: await tenantService.listTenants(req.user) });
}
export async function create(req, res) {
  res
    .status(201)
    .json({ success: true, data: await tenantService.createTenant(req.user, req.body ?? {}) });
}
export async function update(req, res) {
  res.json({
    success: true,
    data: await tenantService.updateTenant(req.user, req.params.id, req.body ?? {}),
  });
}
export async function changeStatus(req, res) {
  res.json({
    success: true,
    data: await tenantService.changeTenantStatus(req.user, req.params.id, req.body.status),
  });
}
