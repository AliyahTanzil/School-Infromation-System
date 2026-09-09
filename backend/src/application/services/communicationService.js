import prisma from '../../infrastructure/orm/prismaClient.js';
import ValidationError from '../../shared/errors/ValidationError.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';
const channels = ['IN_APP', 'EMAIL', 'SMS', 'PUSH'];
const scopeWhere = (scope) => {
  if (!scope?.tenantId || !scope?.schoolId)
    throw new AuthorizationError(
      'Communication school context is required',
      'SCHOOL_CONTEXT_REQUIRED'
    );
  return { tenantId: scope.tenantId, schoolId: scope.schoolId };
};
const hydrateDelivery = async (delivery, db = prisma) => ({
  ...delivery,
  event: await db.notificationEvent.findFirst({
    where: { id: delivery.eventId, ...scopeWhere(delivery) },
  }),
});

const communicationService = {
  async listNotifications(scope, query = {}) {
    return prisma.notificationEvent.findMany({
      where: { ...scopeWhere(scope), ...(query.status ? { status: query.status } : {}) },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(query.limit) || 50, 100),
    });
  },
  async inbox(scope, userId, query = {}) {
    const rows = await prisma.notificationDelivery.findMany({
      where: {
        ...scopeWhere(scope),
        recipientId: userId,
        ...(query.status ? { status: query.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(query.limit) || 50, 100),
    });
    return Promise.all(rows.map((row) => hydrateDelivery(row)));
  },
  async createNotification(scope, input) {
    const ownership = scopeWhere(scope);
    const recipients = [...new Set(input.userIds)];
    const selectedChannels = [...new Set(input.channels)].filter((channel) =>
      channels.includes(channel)
    );
    if (!selectedChannels.length)
      throw new ValidationError('At least one valid delivery channel is required');
    return prisma.$transaction(async (tx) => {
      const validRecipients = await tx.user.count({
        where: { id: { in: recipients }, tenantId: ownership.tenantId, deletedAt: null },
      });
      if (validRecipients !== recipients.length)
        throw new ValidationError('One or more recipients are outside the authenticated tenant');
      const event = await tx.notificationEvent.create({
        data: {
          ...scopeWhere(scope),
          eventType: input.eventType,
          aggregateType: input.aggregateType,
          aggregateId: input.aggregateId,
          payload: input.payload,
        },
      });
      await tx.notificationDelivery.createMany({
        data: recipients.flatMap((recipientId) =>
          selectedChannels.map((channel) => ({
            ...scopeWhere(scope),
            eventId: event.id,
            recipientId,
            channel,
          }))
        ),
      });
      return event;
    });
  },
  async markRead(scope, notificationId, userId) {
    return prisma.notificationDelivery.updateMany({
      where: { ...scopeWhere(scope), eventId: notificationId, recipientId: userId },
      data: { status: 'READ', deliveredAt: new Date() },
    });
  },
  unreadCount(scope, userId) {
    return prisma.notificationDelivery.count({
      where: { ...scopeWhere(scope), recipientId: userId, status: { not: 'READ' } },
    });
  },
  getPreferences(scope, userId) {
    return prisma.notificationPreference.findMany({
      where: { ...scopeWhere(scope), userId },
      orderBy: { channel: 'asc' },
    });
  },
  async upsertPreference(scope, userId, input) {
    return prisma.notificationPreference.upsert({
      where: {
        tenantId_schoolId_userId_channel: { ...scopeWhere(scope), userId, channel: input.channel },
      },
      create: {
        ...scopeWhere(scope),
        userId,
        channel: input.channel,
        enabled: input.enabled,
        quietHours: input.quietHours,
      },
      update: { enabled: input.enabled, quietHours: input.quietHours },
    });
  },
  async deliveryHealth(scope) {
    const where = scopeWhere(scope);
    const [total, delivered, failed, pending] = await Promise.all([
      prisma.notificationDelivery.count({ where }),
      prisma.notificationDelivery.count({
        where: { ...where, status: { in: ['DELIVERED', 'READ'] } },
      }),
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
