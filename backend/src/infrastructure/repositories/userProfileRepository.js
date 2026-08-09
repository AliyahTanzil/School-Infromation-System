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
export function upsertPreference(userId, data, tx) {
  return db(tx).userPreference.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}
export function findPreference(userId, tx) {
  return db(tx).userPreference.findUnique({ where: { userId } });
}
export default { upsert, findByUserId, upsertPreference, findPreference };
