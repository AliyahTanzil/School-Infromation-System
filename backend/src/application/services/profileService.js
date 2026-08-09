import profileRepo from '../../infrastructure/repositories/userProfileRepository.js';
import userRepo from '../../infrastructure/repositories/userManagementRepository.js';
import auditRepo from '../../infrastructure/repositories/userAuditRepository.js';
import { NotFoundError } from '../../shared/errors/index.js';

export async function getProfile(userId) {
  const user = await userRepo.findById(userId);
  if (!user) throw new NotFoundError('User not found');
  return { profile: user.profile, preference: user.preference };
}

export async function updateProfile(userId, profile, preference, actorId, requestContext = {}) {
  const user = await userRepo.findById(userId);
  if (!user) throw new NotFoundError('User not found');
  const result = await Promise.resolve().then(async () => {
    const updatedProfile = profile ? await profileRepo.upsert(userId, profile) : user.profile;
    const updatedPreference = preference
      ? await profileRepo.upsertPreference(userId, preference)
      : user.preference;
    await auditRepo.create({
      actorId,
      subjectId: userId,
      eventType: preference ? 'PREFERENCE_UPDATED' : 'PROFILE_UPDATED',
      afterJson: { profile: updatedProfile, preference: updatedPreference },
      ...requestContext,
    });
    return { profile: updatedProfile, preference: updatedPreference };
  });
  return result;
}

export default { getProfile, updateProfile };
