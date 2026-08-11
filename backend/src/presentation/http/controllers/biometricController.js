import * as service from '../../../application/services/biometricService.js';

const tenantId = (req) => req.user?.tenantId || 'demo-tenant';
export async function list(req, res, next) {
  try {
    res.json({ data: await service.listDevices({ tenantId: tenantId(req) }) });
  } catch (error) {
    next(error);
  }
}
export async function register(req, res, next) {
  try {
    res.status(201).json({
      data: await service.registerDevice({
        tenantId: tenantId(req),
        actorId: req.user?.id,
        input: req.body,
      }),
    });
  } catch (error) {
    next(error);
  }
}
export async function health(req, res, next) {
  try {
    res.json({
      data: await service.checkDeviceHealth({
        tenantId: tenantId(req),
        deviceId: req.params.deviceId,
      }),
    });
  } catch (error) {
    next(error);
  }
}
export async function verify(req, res, next) {
  try {
    res.status(201).json({
      data: await service.recordVerification({
        tenantId: tenantId(req),
        actorId: req.user?.id,
        input: req.body,
      }),
    });
  } catch (error) {
    next(error);
  }
}
