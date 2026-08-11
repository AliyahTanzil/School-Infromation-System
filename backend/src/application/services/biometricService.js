import prisma from '../../infrastructure/orm/prismaClient.js';

const demoDevices = [
  {
    id: 'demo-gate-a',
    deviceKey: 'gate-a',
    displayName: 'Main Gate Reader',
    location: 'North entrance',
    status: 'ACTIVE',
    capabilities: ['fingerprint', 'face'],
    lastSeenAt: new Date().toISOString(),
  },
  {
    id: 'demo-lab-b',
    deviceKey: 'lab-b',
    displayName: 'Science Lab Reader',
    location: 'Science block',
    status: 'OFFLINE',
    capabilities: ['fingerprint'],
    lastSeenAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export async function listDevices({ tenantId }) {
  if (!prisma?.biometricDevice) return demoDevices;
  return prisma.biometricDevice.findMany({ where: { tenantId }, orderBy: { displayName: 'asc' } });
}

export async function registerDevice({ tenantId, actorId, input }) {
  const deviceKey = String(input.deviceKey || '')
    .trim()
    .toLowerCase();
  const displayName = String(input.displayName || '').trim();
  if (!deviceKey || !displayName)
    throw Object.assign(new Error('Device key and display name are required'), { statusCode: 400 });
  const device = await prisma.biometricDevice.upsert({
    where: { tenantId_deviceKey: { tenantId, deviceKey } },
    update: {
      displayName,
      location: input.location?.trim() || null,
      capabilities: input.capabilities || ['fingerprint'],
      status: 'PENDING',
    },
    create: {
      tenantId,
      deviceKey,
      displayName,
      location: input.location?.trim() || null,
      capabilities: input.capabilities || ['fingerprint'],
    },
  });
  await prisma.biometricAuditEvent.create({
    data: {
      tenantId,
      actorId: actorId || null,
      action: 'DEVICE_REGISTERED',
      entityId: device.id,
      metadata: { deviceKey },
    },
  });
  return device;
}

export async function checkDeviceHealth({ tenantId, deviceId }) {
  if (deviceId?.startsWith('demo-'))
    return {
      status: deviceId === 'demo-gate-a' ? 'HEALTHY' : 'OFFLINE',
      checkedAt: new Date().toISOString(),
    };
  const device = await prisma.biometricDevice.findFirst({ where: { id: deviceId, tenantId } });
  if (!device) throw Object.assign(new Error('Device not found'), { statusCode: 404 });
  const status =
    device.lastSeenAt && Date.now() - device.lastSeenAt.getTime() < 15 * 60 * 1000
      ? 'HEALTHY'
      : 'OFFLINE';
  await prisma.biometricDevice.update({
    where: { id: device.id },
    data: { status: status === 'HEALTHY' ? 'ACTIVE' : 'OFFLINE' },
  });
  return { status, checkedAt: new Date().toISOString() };
}

export async function recordVerification({ tenantId, actorId, input }) {
  const device = await prisma.biometricDevice.findFirst({
    where: { id: input.deviceId, tenantId },
  });
  if (!device) throw Object.assign(new Error('Device not found'), { statusCode: 404 });
  const event = await prisma.biometricVerificationEvent.upsert({
    where: { tenantId_idempotencyKey: { tenantId, idempotencyKey: input.idempotencyKey } },
    update: {},
    create: {
      tenantId,
      deviceId: device.id,
      subjectRef: String(input.subjectRef || '').slice(0, 180),
      method: input.method || 'fingerprint',
      outcome: input.outcome || 'VERIFIED',
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
      idempotencyKey: input.idempotencyKey,
      metadataRedacted: { source: 'device' },
    },
  });
  await prisma.biometricAuditEvent.create({
    data: {
      tenantId,
      actorId: actorId || null,
      action: 'VERIFICATION_RECORDED',
      entityId: event.id,
      metadata: { outcome: event.outcome, method: event.method },
    },
  });
  return event;
}
