import test from 'node:test';
import assert from 'node:assert/strict';
import {
  notificationCreateSchema,
  notificationQuerySchema,
  preferenceSchema,
} from '../../src/application/validators/communicationValidators.js';
const fail = () => assert.fail('must not access persistence');
const db = {
  $on() {},
  notificationEvent: { findMany: fail },
  notificationDelivery: { findMany: fail, updateMany: fail, count: fail },
  notificationPreference: { findMany: fail, upsert: fail },
};
globalThis.__prisma = db;
const { default: service } = await import('../../src/application/services/communicationService.js');
const id = '00000000-0000-4000-8000-000000000001';
const scope = { tenantId: 'tenant', schoolId: 'school' };
const input = {
  eventType: 'ANNOUNCEMENT',
  payload: { title: 'Title', body: 'Body' },
  userIds: [id],
  channels: ['IN_APP'],
};

test('communication payloads reject unknown ownership and nested fields', () => {
  assert.equal(notificationCreateSchema.safeParse({ body: input }).success, true);
  for (const body of [
    { ...input, tenantId: id },
    { ...input, payload: { ...input.payload, recipientId: id } },
  ]) {
    assert.equal(notificationCreateSchema.safeParse({ body }).success, false);
  }
  assert.equal(notificationQuerySchema.safeParse({ query: { userId: id } }).success, false);
  assert.equal(
    preferenceSchema.safeParse({ body: { channel: 'EMAIL', enabled: true, userId: id } }).success,
    false
  );
});

test('quiet hours require bounded 24-hour clock values', () => {
  const body = {
    channel: 'EMAIL',
    enabled: true,
    quietHours: { startsAt: '22:00', endsAt: '06:00' },
  };
  assert.equal(preferenceSchema.safeParse({ body }).success, true);
  for (const startsAt of ['24:00', '12:60', 'invalid', '']) {
    assert.equal(
      preferenceSchema.safeParse({
        body: { ...body, quietHours: { ...body.quietHours, startsAt } },
      }).success,
      false
    );
  }
});

test('communication operations fail closed without school scope', async () => {
  for (const operation of [
    () => service.listNotifications({}),
    () => service.inbox({}, id),
    () => service.createNotification({}, input),
    () => service.markRead({}, id, id),
    () => service.unreadCount({}, id),
    () => service.getPreferences({}, id),
    () => service.upsertPreference({}, id, { channel: 'EMAIL', enabled: true }),
    () => service.deliveryHealth({}),
  ])
    await assert.rejects(async () => operation(), /context is required/);
});

test('recipient ownership and deduplicated deliveries use one transaction', async () => {
  db.$transaction = async (work) =>
    work({
      user: {
        count: async ({ where }) => {
          assert.deepEqual(where, { id: { in: [id] }, tenantId: 'tenant', deletedAt: null });
          return 1;
        },
      },
      notificationEvent: {
        create: async ({ data }) => {
          assert.equal(data.schoolId, 'school');
          return { id: 'event' };
        },
      },
      notificationDelivery: {
        createMany: async ({ data }) => {
          assert.deepEqual(data, [
            { ...scope, eventId: 'event', recipientId: id, channel: 'IN_APP' },
          ]);
        },
      },
    });
  await service.createNotification(scope, {
    ...input,
    userIds: [id, id],
    channels: ['IN_APP', 'IN_APP'],
  });
});

test('foreign or deleted recipients prevent event and delivery creation', async () => {
  db.$transaction = async (work) =>
    work({
      user: { count: async () => 0 },
      notificationEvent: { create: fail },
      notificationDelivery: { createMany: fail },
    });
  await assert.rejects(
    service.createNotification(scope, input),
    /outside the authenticated tenant/
  );
});
