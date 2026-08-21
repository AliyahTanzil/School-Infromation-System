import prisma from '../../infrastructure/orm/prismaClient.js';
import { sendExpoPushNotifications } from '../../infrastructure/notifications/expoPushService.js';

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
    const notification = await prisma.notification.create({
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
    const push = await sendExpoPushNotifications({
      userIds,
      title: input.title,
      body: input.body,
      data: input.data || {},
    });
    return { ...notification, pushDelivery: push };
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

  async getPreferences(userId, schoolId) {
    if (!userId || !schoolId) throw new Error('userId and schoolId are required');
    return prisma.notificationPreference.findUnique({
      where: { userId_schoolId: { userId, schoolId } },
    });
  },

  async upsertPreferences(input) {
    if (!input.userId || !input.schoolId) throw new Error('userId and schoolId are required');
    const data = {
      email: input.email ?? true,
      sms: input.sms ?? false,
      push: input.push ?? true,
      whatsapp: input.whatsapp ?? false,
      inApp: input.inApp ?? true,
      quietHours: input.quietHours || { start: '21:00', end: '07:00' },
    };
    return prisma.notificationPreference.upsert({
      where: { userId_schoolId: { userId: input.userId, schoolId: input.schoolId } },
      create: { userId: input.userId, schoolId: input.schoolId, ...data },
      update: data,
    });
  },

  async deliveryHealth(schoolId) {
    const where = schoolId ? { notification: { schoolId } } : {};
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
