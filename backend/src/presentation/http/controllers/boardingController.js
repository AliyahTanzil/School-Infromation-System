import {
  getBoardingOverview,
  listDormitories,
} from '../../../application/services/boardingService.js';

export async function overview(req, res, next) {
  try {
    res.json({ success: true, data: await getBoardingOverview({ schoolId: req.user.schoolId }) });
  } catch (error) {
    next(error);
  }
}
export async function dormitories(req, res, next) {
  try {
    res.json({ success: true, data: await listDormitories({ schoolId: req.user.schoolId }) });
  } catch (error) {
    next(error);
  }
}
