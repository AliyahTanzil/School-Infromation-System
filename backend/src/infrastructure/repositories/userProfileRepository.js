import prisma from '../orm/prismaClient.js';

const db = (tx) => tx ?? prisma;

export function upsert(userId, data, tx) {
  return db(tx).userProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}
export function findByUserId(userId, tx) {
  return db(tx).userProfile.findUnique({ where: { userId } });
}
export async function upsertPreference(userId, data, tx) {
  const client = db(tx);
  const { locale, timezone, ...settingChanges } = data;
  const existing = await client.userPreference.findUnique({ where: { userId } });
  const currentSettings =
    existing?.settings && typeof existing.settings === 'object' && !Array.isArray(existing.settings)
      ? existing.settings
      : {};
  const preferenceData = {
    ...(locale ? { locale } : {}),
    ...(timezone ? { timezone } : {}),
    ...(Object.keys(settingChanges).length
      ? { settings: { ...currentSettings, ...settingChanges } }
      : {}),
  };
  return client.userPreference.upsert({
    where: { userId },
    create: { userId, ...preferenceData },
    update: preferenceData,
  });
}
export function findPreference(userId, tx) {
  return db(tx).userPreference.findUnique({ where: { userId } });
}
export default { upsert, findByUserId, upsertPreference, findPreference };
