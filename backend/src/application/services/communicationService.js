import prisma from '../../infrastructure/orm/prismaClient.js';

const channels = ['IN_APP', 'EMAIL', 'SMS', 'PUSH'];

const communicationService = {
  async listNotifications(query = {}) {
    return prisma.notificationEvent.findMany({
      where: {
        tenantId: query.tenantId,
        ...(query.schoolId ? { schoolId: query.schoolId } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(query.limit) || 50, 100),
    });
  },

  async createNotification(input) {
    if (!input.tenantId || !input.schoolId || !input.eventType)
      throw new Error('tenantId, schoolId, and eventType are required');
    const recipients = [...new Set(input.userIds || [])];
    const selectedChannels = (input.channels || ['IN_APP']).filter((channel) =>
      channels.includes(channel)
    );
    if (!recipients.length || !selectedChannels.length)
      throw new Error('userIds and valid channels are required');
    return prisma.$transaction(async (tx) => {
      const event = await tx.notificationEvent.create({
        data: {
          tenantId: input.tenantId,
          schoolId: input.schoolId,
          eventType: input.eventType,
          aggregateType: input.aggregateType,
          aggregateId: input.aggregateId,
          payload: input.payload || {},
        },
      });
      await tx.notificationDelivery.createMany({
        data: recipients.flatMap((recipientId) =>
          selectedChannels.map((channel) => ({
            tenantId: input.tenantId,
            schoolId: input.schoolId,
            eventId: event.id,
            recipientId,
            channel,
          }))
        ),
      });
      return event;
    });
  },

  async markRead(notificationId, userId) {
    return prisma.notificationDelivery.updateMany({
      where: { eventId: notificationId, recipientId: userId },
      data: { status: 'READ', deliveredAt: new Date() },
    });
  },

  async unreadCount(userId) {
    return prisma.notificationDelivery.count({
      where: { recipientId: userId, status: { not: 'READ' } },
    });
  },

  async getPreferences(userId, schoolId, tenantId) {
    if (!userId || !schoolId || !tenantId)
      throw new Error('userId, schoolId, and tenantId are required');
    return prisma.notificationPreference.findMany({
      where: { userId, schoolId, tenantId },
      orderBy: { channel: 'asc' },
    });
  },

  async upsertPreferences(input) {
    if (!input.userId || !input.schoolId || !input.tenantId || !channels.includes(input.channel))
      throw new Error('tenantId, userId, schoolId, and valid channel are required');
    return prisma.notificationPreference.upsert({
      where: {
        tenantId_schoolId_userId_channel: {
          tenantId: input.tenantId,
          schoolId: input.schoolId,
          userId: input.userId,
          channel: input.channel,
        },
      },
      create: {
        tenantId: input.tenantId,
        schoolId: input.schoolId,
        userId: input.userId,
        channel: input.channel,
        enabled: input.enabled ?? true,
        quietHours: input.quietHours,
      },
      update: { enabled: input.enabled ?? true, quietHours: input.quietHours },
    });
  },

  async deliveryHealth(schoolId, tenantId) {
    const where = { ...(schoolId ? { schoolId } : {}), ...(tenantId ? { tenantId } : {}) };
    const [total, delivered, failed, pending] = await Promise.all([
      prisma.notificationDelivery.count({ where }),
      prisma.notificationDelivery.count({ where: { ...where, status: 'DELIVERED' } }),
      prisma.notificationDelivery.count({ where: { ...where, status: 'FAILED' } }),
      prisma.notificationDelivery.count({ where: { ...where, status: 'PENDING' } }),
    ]);
    return {
      total,
      delivered,
      failed,
      pending,
      deliveryRate: total ? Number(((delivered / total) * 100).toFixed(1)) : 100,
    };
  },
};

export default communicationService;
