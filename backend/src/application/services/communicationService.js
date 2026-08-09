import prisma from '../../infrastructure/orm/prismaClient.js';

const communicationService = {
  async listNotifications(query = {}) {
    const where = {};
    if (query.schoolId) where.schoolId = query.schoolId;
    if (query.status) where.status = query.status;
    return prisma.notification.findMany({
      where,
      include: { recipients: true, deliveries: true },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(query.limit) || 50, 100),
    });
  },

  async createNotification(input) {
    const userIds = [...new Set(input.userIds || [])];
    if (!input.schoolId || !input.tenantId || !input.title || !input.body || userIds.length === 0)
      throw new Error('schoolId, tenantId, title, body, and userIds are required');
    return prisma.notification.create({
      data: {
        tenantId: input.tenantId,
        schoolId: input.schoolId,
        title: input.title,
        body: input.body,
        type: input.type || 'GENERAL',
        priority: input.priority || 'NORMAL',
        sourceModule: input.sourceModule,
        sourceEntity: input.sourceEntity,
        sourceEntityId: input.sourceEntityId,
        data: input.data || {},
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
        recipients: { create: userIds.map((userId) => ({ userId })) },
      },
      include: { recipients: true, deliveries: true },
    });
  },

  async markRead(notificationId, userId) {
    return prisma.notificationRecipient.update({
      where: { notificationId_userId: { notificationId, userId } },
      data: { readAt: new Date() },
    });
  },

  async unreadCount(userId) {
    return prisma.notificationRecipient.count({
      where: { userId, readAt: null, notification: { status: { not: 'CANCELLED' } } },
    });
  },
};

export default communicationService;
