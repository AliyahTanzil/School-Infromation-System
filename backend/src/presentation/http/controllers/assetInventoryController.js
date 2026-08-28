import * as service from '../../../application/services/assetInventoryService.js';
const scope = (req) => ({
  tenantId: req.schoolContext.tenantId,
  schoolId: req.schoolContext.schoolId,
});
export const overview = async (req, res) =>
  res.json({ data: await service.getOverview(scope(req)) });
export const assets = async (req, res) =>
  res.json({ data: await service.listAssets(scope(req), req.query.q) });
export const createAsset = async (req, res) =>
  res.status(201).json({ data: await service.createAsset(scope(req), req.body) });
export const updateAsset = async (req, res) =>
  res.json({ data: await service.updateAssetStatus(scope(req), req.params.id, req.body.status) });
export const inventory = async (req, res) =>
  res.json({ data: await service.listInventory(scope(req), req.query.q) });
export const createItem = async (req, res) =>
  res.status(201).json({ data: await service.createInventoryItem(scope(req), req.body) });
export const moveStock = async (req, res) =>
  res
    .status(201)
    .json({ data: await service.moveStock(scope(req), req.params.id, req.body, req.user.id) });
