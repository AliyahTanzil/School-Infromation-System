import * as service from '../../../application/services/boardingService.js';
const scope = (req) => ({
  tenantId: req.schoolContext.tenantId,
  schoolId: req.schoolContext.schoolId,
});
export const overview = async (req, res) =>
  res.json({ data: await service.getBoardingOverview(scope(req)) });
export const dormitories = async (req, res) =>
  res.json({ data: await service.listDormitories(scope(req)) });
export const createDormitory = async (req, res) =>
  res.status(201).json({ data: await service.createDormitory(scope(req), req.body) });
export const addRoom = async (req, res) =>
  res
    .status(201)
    .json({ data: await service.addRoom(scope(req), req.params.dormitoryId, req.body) });
export const applications = async (req, res) =>
  res.json({ data: await service.listApplications(scope(req)) });
export const createApplication = async (req, res) =>
  res.status(201).json({ data: await service.createApplication(scope(req), req.body) });
export const decide = async (req, res) =>
  res.json({
    data: await service.decideApplication(scope(req), req.params.id, req.body.status, req.user.id),
  });
export const allocations = async (req, res) =>
  res.json({ data: await service.listAllocations(scope(req)) });
export const allocate = async (req, res) =>
  res.status(201).json({ data: await service.allocate(scope(req), req.body) });
export const checkout = async (req, res) =>
  res.json({ data: await service.checkout(scope(req), req.params.id) });
