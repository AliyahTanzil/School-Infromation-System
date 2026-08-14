import * as service from '../../../application/services/integrationService.js';
export async function list(req, res, next) {
  try {
    res.json({ data: await service.listIntegrations(req) });
  } catch (error) {
    next(error);
  }
}
export async function configure(req, res, next) {
  try {
    res.json({ data: await service.configureIntegration(req, req.params.providerKey, req.body) });
  } catch (error) {
    next(error);
  }
}
export async function health(req, res, next) {
  try {
    res.json({ data: await service.healthCheck(req, req.params.providerKey) });
  } catch (error) {
    next(error);
  }
}
