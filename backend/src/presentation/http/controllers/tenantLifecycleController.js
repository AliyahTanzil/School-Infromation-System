import tenantService from '../../../application/services/tenantLifecycleService.js';

export async function list(req, res) {
  res.json({ success: true, data: await tenantService.listTenants(req.user) });
}
export async function create(req, res) {
  res
    .status(201)
    .json({ success: true, data: await tenantService.createTenant(req.user, req.body ?? {}) });
}
export async function get(req, res) {
  res.json({ success: true, data: await tenantService.getTenant(req.user, req.params.id) });
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
export async function setFeature(req, res) {
  res.json({
    success: true,
    data: await tenantService.setTenantFeature(
      req.user,
      req.params.id,
      req.params.key,
      req.body?.enabled
    ),
  });
}
export async function createSchool(req, res) {
  res.status(201).json({
    success: true,
    data: await tenantService.createTenantSchool(req.user, req.params.id, req.body ?? {}),
  });
}
