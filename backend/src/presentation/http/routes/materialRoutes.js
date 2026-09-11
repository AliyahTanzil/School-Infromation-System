import { Router } from 'express';
import multer from 'multer';
import authenticate from '../../../middleware/auth/authenticate.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import authorizeSchoolAdminOrTeacher from '../../../middleware/auth/authorizeSchoolAdminOrTeacher.js';
import validate from '../../../middleware/validation/validate.js';
import {
  materialArchiveSchema,
  materialListSchema,
  materialUploadSchema,
} from '../../../application/validators/materialValidators.js';
import {
  listMaterials,
  uploadMaterial,
  downloadMaterial,
  archiveMaterial,
} from '../controllers/materialController.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
router.use(authenticate, teacherContext);
router.get('/', validate(materialListSchema), listMaterials);
router.post(
  '/',
  authorizeSchoolAdminOrTeacher,
  upload.single('file'),
  validate(materialUploadSchema),
  uploadMaterial
);
router.get('/:id/download', validate(materialArchiveSchema), downloadMaterial);
router.patch(
  '/:id/archive',
  authorizeSchoolAdminOrTeacher,
  validate(materialArchiveSchema),
  archiveMaterial
);
export default router;
