import { get } from '@vercel/blob';
import { put } from '@vercel/blob';
import {
  create,
  list,
  getById,
  archive,
  assertCanUpload,
} from '../../../application/services/materialService.js';

const scope = (req) => ({
  tenantId: req.schoolContext.tenantId,
  schoolId: req.schoolContext.schoolId,
});

const access = (req) => ({ roles: req.user.roles ?? [], platformRole: req.user.platformRole });

export async function listMaterials(req, res, next) {
  try {
    res.json({
      success: true,
      data: await list(scope(req), req.query.classroomId, req.user.id, access(req)),
    });
  } catch (error) {
    next(error);
  }
}

export function createMaterialUploader(putBlob = put) {
  return async function uploadMaterial(req, res, next) {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ success: false, error: 'File is required' });
      await assertCanUpload(scope(req), req.body.classroomId, req.user.id, access(req));
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-180);
      const blob = await putBlob(
        `materials/${scope(req).tenantId}/${crypto.randomUUID()}-${safeName}`,
        file.buffer,
        { access: 'private', contentType: file.mimetype }
      );
      const material = await create(scope(req), req.user.id, access(req), {
        classroomId: req.body.classroomId,
        title: req.body.title || file.originalname,
        description: req.body.description || null,
        pathname: blob.pathname,
        contentType: file.mimetype,
        size: file.size,
      });
      res.status(201).json({ success: true, data: material });
    } catch (error) {
      next(error);
    }
  };
}
export const uploadMaterial = createMaterialUploader();

export async function downloadMaterial(req, res, next) {
  try {
    const material = await getById(scope(req), req.params.id, req.user.id, access(req));
    const result = await get(material.pathname, { access: 'private' });
    if (!result) return res.status(404).json({ success: false, error: 'File not found' });
    res.set({
      'Content-Type': result.blob.contentType,
      ETag: result.blob.etag,
      'Cache-Control': 'private, no-cache',
    });
    result.stream.pipe(res);
  } catch (error) {
    next(error);
  }
}

export async function archiveMaterial(req, res, next) {
  try {
    res.json({
      success: true,
      data: await archive(scope(req), req.params.id, req.user.id, access(req)),
    });
  } catch (error) {
    next(error);
  }
}
