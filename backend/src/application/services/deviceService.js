import prisma from '../../infrastructure/orm/prismaClient.js';

export async function registerPushToken({ userId, deviceFingerprint, platform, pushToken }) {
  if (!userId || !deviceFingerprint || !pushToken)
    throw new Error('Device and push token are required');
  if (!/^ExponentPushToken\[.+\]$/.test(pushToken)) throw new Error('Invalid Expo push token');
  return prisma.userDevice.upsert({
    where: { userId_deviceFingerprint: { userId, deviceFingerprint } },
    create: { userId, deviceFingerprint, platform, pushToken, lastSeenAt: new Date() },
    update: { platform, pushToken, lastSeenAt: new Date() },
  });
}

export default { registerPushToken };
