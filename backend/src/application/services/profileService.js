import profileRepo from '../../infrastructure/repositories/userProfileRepository.js';
import userRepo from '../../infrastructure/repositories/userManagementRepository.js';
import auditRepo from '../../infrastructure/repositories/userAuditRepository.js';
import prisma from '../../infrastructure/orm/prismaClient.js';
import { NotFoundError } from '../../shared/errors/index.js';

export async function getProfile(userId, tenantId) {
  const user = await userRepo.findById(userId, tenantId);
  if (!user) throw new NotFoundError('User not found');
  return { profile: user.profile, preference: user.preference };
}

export async function updateProfile(
  userId,
  profile,
  preference,
  actorId,
  tenantId,
  requestContext = {}
) {
  return prisma.$transaction(async (tx) => {
    const user = await userRepo.findById(userId, tenantId, {}, tx);
    if (!user) throw new NotFoundError('User not found');
    const updatedProfile = profile ? await profileRepo.upsert(userId, profile, tx) : user.profile;
    const updatedPreference = preference
      ? await profileRepo.upsertPreference(userId, preference, tx)
      : user.preference;
    await auditRepo.create(
      {
        actorId,
        subjectId: userId,
        eventType: preference ? 'PREFERENCE_UPDATED' : 'PROFILE_UPDATED',
        afterJson: { profile: updatedProfile, preference: updatedPreference },
        ...requestContext,
      },
      tx
    );
    return { profile: updatedProfile, preference: updatedPreference };
  });
}

export default { getProfile, updateProfile };
