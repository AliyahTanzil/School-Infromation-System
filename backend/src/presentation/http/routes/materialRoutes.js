import { Router } from 'express';
import multer from 'multer';
import {
  listMaterials,
  uploadMaterial,
  downloadMaterial,
  archiveMaterial,
} from '../controllers/materialController.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
router.get('/', listMaterials);
router.post('/', upload.single('file'), uploadMaterial);
router.get('/:id/download', downloadMaterial);
router.patch('/:id/archive', archiveMaterial);
export default router;
