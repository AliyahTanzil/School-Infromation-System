import { getIoTOverview, queueCommand } from '../../../application/services/iotService.js';

export const overview = async (req, res, next) => {
  try {
    res.json({
      data: await getIoTOverview({
        tenantId: req.auth?.tenantId || 'demo-tenant',
        schoolId: req.auth?.schoolId,
      }),
    });
  } catch (error) {
    next(error);
  }
};
export const command = async (req, res, next) => {
  try {
    const data = await queueCommand({
      tenantId: req.auth?.tenantId || 'demo-tenant',
      schoolId: req.auth?.schoolId,
      requestedById: req.auth?.userId,
      ...req.body,
    });
    res.status(202).json({ data });
  } catch (error) {
    next(error);
  }
};
