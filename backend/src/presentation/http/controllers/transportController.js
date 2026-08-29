import * as service from '../../../application/services/transportService.js';
const scope = (req) => ({
  tenantId: req.schoolContext.tenantId,
  schoolId: req.schoolContext.schoolId,
});
export const overview = async (req, res) =>
  res.json({ data: await service.getTransportOverview(scope(req)) });
export const vehicles = async (req, res) =>
  res.json({ data: await service.listVehicles(scope(req), req.query.search) });
export const createVehicle = async (req, res) =>
  res.status(201).json({ data: await service.createVehicle(scope(req), req.body) });
export const updateVehicle = async (req, res) =>
  res.json({ data: await service.updateVehicleStatus(scope(req), req.params.id, req.body.status) });
export const drivers = async (req, res) =>
  res.json({ data: await service.listDrivers(scope(req)) });
export const createDriver = async (req, res) =>
  res.status(201).json({ data: await service.createDriver(scope(req), req.body) });
export const routes = async (req, res) => res.json({ data: await service.listRoutes(scope(req)) });
export const createRoute = async (req, res) =>
  res.status(201).json({ data: await service.createRoute(scope(req), req.body) });
export const trips = async (req, res) => res.json({ data: await service.listTrips(scope(req)) });
export const createTrip = async (req, res) =>
  res.status(201).json({ data: await service.createTrip(scope(req), req.body) });
export const inspect = async (req, res) =>
  res.status(201).json({ data: await service.inspectVehicle(scope(req), req.params.id, req.body) });
