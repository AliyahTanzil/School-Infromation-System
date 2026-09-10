import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import authorizeSchoolAdmin from '../../../middleware/auth/authorizeSchoolAdmin.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import validate from '../../../middleware/validation/validate.js';
import * as c from '../controllers/transportController.js';
import {
  querySchema,
  vehicleSchema,
  vehicleStatusSchema,
  driverSchema,
  routeSchema,
  tripSchema,
  inspectionSchema,
} from '../../../application/validators/transportValidators.js';
const router = Router();
router.use(authenticate, teacherContext, authorizeSchoolAdmin);
router.get('/overview', c.overview);
router.get('/vehicles', validate(querySchema), c.vehicles);
router.post('/vehicles', validate(vehicleSchema), c.createVehicle);
router.patch('/vehicles/:id/status', validate(vehicleStatusSchema), c.updateVehicle);
router.post('/vehicles/:id/inspections', validate(inspectionSchema), c.inspect);
router.get('/drivers', c.drivers);
router.post('/drivers', validate(driverSchema), c.createDriver);
router.get('/routes', c.routes);
router.post('/routes', validate(routeSchema), c.createRoute);
router.get('/trips', c.trips);
router.post('/trips', validate(tripSchema), c.createTrip);
export default router;
