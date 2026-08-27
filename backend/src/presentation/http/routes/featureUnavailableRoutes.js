import { Router } from 'express';

export function featureUnavailableRoutes(feature, requiredTask) {
  const router = Router();

  router.use((req, res) =>
    res.status(501).json({
      error: {
        code: 'FEATURE_NOT_IMPLEMENTED',
        message: `${feature} is not available until its persistence contract is implemented.`,
        details: { feature, requiredTask, path: req.originalUrl },
      },
    })
  );

  return router;
}
