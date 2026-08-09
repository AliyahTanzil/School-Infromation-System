import crypto from 'node:crypto';
import prisma from '../../infrastructure/orm/prismaClient.js';
import { ConflictError, NotFoundError } from '../../shared/errors/index.js';

const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxBytes = 5 * 1024 * 1024;
function sniff(buffer) {
  if (buffer.subarray(0, 3).toString('hex') === 'ffd8ff') return 'image/jpeg';
  if (buffer.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') return 'image/png';
  if (buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP')
    return 'image/webp';
  return null;
}
export async function upload(userId, file, actorId, context = {}) {
  if (!file || file.size > maxBytes)
    throw new ConflictError('Profile image must be smaller than 5 MB');
  const mimeType = sniff(file.buffer);
  if (!mimeType || !allowed.has(mimeType))
    throw new ConflictError('Unsupported or invalid image file');
  const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');
  const objectKey = `private/profile-images/${userId}/${crypto.randomUUID()}`;
  const image = await prisma.$transaction(async (tx) => {
    await tx.profileImage.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'REPLACED' },
    });
    const created = await tx.profileImage.create({
      data: { userId, objectKey, mimeType, byteSize: file.size, checksum, status: 'ACTIVE' },
    });
    await tx.userAudit.create({
      data: {
        actorId,
        subjectId: userId,
        eventType: 'IMAGE_UPLOADED',
        afterJson: { objectKey, mimeType, byteSize: file.size },
        ...context,
      },
    });
    return created;
  });
  return {
    id: image.id,
    status: image.status,
    mimeType: image.mimeType,
    byteSize: image.byteSize,
    objectKey: image.objectKey,
  };
}
export async function remove(userId, actorId, context = {}) {
  const image = await prisma.profileImage.findFirst({ where: { userId, status: 'ACTIVE' } });
  if (!image) throw new NotFoundError('Profile image not found');
  await prisma.$transaction(async (tx) => {
    await tx.profileImage.update({ where: { id: image.id }, data: { status: 'DELETED' } });
    await tx.userAudit.create({
      data: {
        actorId,
        subjectId: userId,
        eventType: 'IMAGE_DELETED',
        beforeJson: { objectKey: image.objectKey },
        ...context,
      },
    });
  });
  return { deleted: true };
}
export default { upload, remove };
