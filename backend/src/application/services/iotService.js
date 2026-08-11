import crypto from 'node:crypto';
import prisma from '../../infrastructure/orm/prismaClient.js';

const demo = {
  summary: { devices: 48, online: 42, gateways: 6, alerts: 3, energyToday: '1,284 kWh' },
  gateways: [
    { name: 'North campus gateway', status: 'ONLINE', devices: 18, lastSeen: '12 sec ago' },
    { name: 'Science block gateway', status: 'ONLINE', devices: 12, lastSeen: '21 sec ago' },
    { name: 'Boarding gateway', status: 'DEGRADED', devices: 8, lastSeen: '4 min ago' },
  ],
  telemetry: [
    { label: 'Average classroom temperature', value: '22.4°C', trend: '+0.6°', state: 'steady' },
    { label: 'Air quality index', value: '31 AQI', trend: '-8%', state: 'improving' },
    { label: 'Lighting occupancy', value: '74%', trend: '+12%', state: 'active' },
    { label: 'Water consumption', value: '18.2 m³', trend: '-4%', state: 'on target' },
  ],
  alerts: [
    {
      title: 'Boarding gateway heartbeat delayed',
      severity: 'WARNING',
      detail: 'Last signal received 4 minutes ago',
    },
    {
      title: 'Science Lab 2 air quality threshold',
      severity: 'INFO',
      detail: 'Ventilation rule activated',
    },
    {
      title: 'Gym lighting schedule drift',
      severity: 'CRITICAL',
      detail: 'Manual review required before command',
    },
  ],
  activity: [
    { action: 'Ventilation rule activated', target: 'Science Lab 2', when: '2 min ago' },
    { action: 'Firmware check completed', target: 'North campus gateway', when: '18 min ago' },
    { action: 'Smart classroom scene applied', target: 'Room B-204', when: '31 min ago' },
  ],
};

const hash = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

export const getIoTOverview = async ({ tenantId, schoolId }) => {
  if (!tenantId || tenantId === 'demo-tenant') return demo;
  const [devices, online, gateways, alerts] = await Promise.all([
    prisma.iOTDevice.count({ where: { tenantId, schoolId } }),
    prisma.iOTDevice.count({ where: { tenantId, schoolId, status: 'ONLINE' } }),
    prisma.iOTGateway.count({ where: { tenantId, schoolId } }),
    prisma.iOTAlert.count({ where: { tenantId, schoolId, resolvedAt: null } }),
  ]);
  return {
    summary: { devices, online, gateways, alerts, energyToday: '—' },
    gateways: [],
    telemetry: [],
    alerts: [],
    activity: [],
  };
};

export const queueCommand = async ({
  tenantId,
  schoolId,
  deviceId,
  commandKey,
  payload,
  requestedById,
  idempotencyKey,
}) => {
  const allowed = new Set(['LIGHTS_ON', 'LIGHTS_OFF', 'VENTILATION_ON', 'SCENE_APPLY']);
  if (!allowed.has(commandKey)) throw new Error('COMMAND_NOT_ALLOWED');
  if (tenantId === 'demo-tenant')
    return { id: `demo-${hash(idempotencyKey).slice(0, 12)}`, status: 'QUEUED', commandKey };
  return prisma.iOTCommand.create({
    data: { tenantId, schoolId, deviceId, commandKey, payload, requestedById, idempotencyKey },
  });
};
