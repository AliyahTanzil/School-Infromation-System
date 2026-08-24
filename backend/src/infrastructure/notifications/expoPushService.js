import prisma from '../orm/prismaClient.js';

const expoPushUrl = 'https://exp.host/--/api/v2/push/send';

export async function sendExpoPushNotifications({ userIds, title, body, data = {} }) {
  const ids = [...new Set(userIds)].filter(Boolean);
  if (!ids.length || !title || !body) return { sent: 0, failed: 0 };
  const devices = await prisma.userDevice.findMany({
    where: { userId: { in: ids }, pushToken: { not: null } },
    select: { id: true, pushToken: true },
  });
  const messages = devices.map((device) => ({
    to: device.pushToken,
    sound: 'default',
    title,
    body,
    data,
  }));
  if (!messages.length) return { sent: 0, failed: 0 };
  const response = await fetch(expoPushUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });
  if (!response.ok) throw new Error(`Expo push service returned ${response.status}`);
  const result = await response.json();
  const tickets = Array.isArray(result?.data) ? result.data : [];
  const invalidIds = tickets.flatMap((ticket, index) =>
    ticket?.details?.error === 'DeviceNotRegistered' ? [devices[index].id] : []
  );
  if (invalidIds.length)
    await prisma.userDevice.updateMany({
      where: { id: { in: invalidIds } },
      data: { pushToken: null },
    });
  return {
    sent: tickets.filter((ticket) => ticket?.status === 'ok').length,
    failed: tickets.filter((ticket) => ticket?.status === 'error').length,
  };
}

export default { sendExpoPushNotifications };
