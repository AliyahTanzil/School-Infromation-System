import prisma from '../../infrastructure/orm/prismaClient.js';

export async function getTransportOverview({ schoolId, tenantId }) {
  const scope = { schoolId, tenantId };
  const [vehicles, drivers, routes, trips, inspections] = await Promise.all([
    prisma.vehicle.count({ where: scope }),
    prisma.transportDriver.count({ where: scope }),
    prisma.transportRoute.count({ where: scope }),
    prisma.transportTrip.count({ where: scope, scheduledAt: { gte: new Date() } }),
    prisma.vehicleInspection.count({ where: { vehicle: scope, passed: false } }),
  ]);
  return { vehicles, drivers, routes, upcomingTrips: trips, failedInspections: inspections };
}

export async function listVehicles({ schoolId, tenantId, search }) {
  return prisma.vehicle.findMany({
    where: {
      schoolId,
      tenantId,
      ...(search
        ? {
            OR: [
              { vehicleNumber: { contains: search, mode: 'insensitive' } },
              { registrationNumber: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: { type: true },
    orderBy: { vehicleNumber: 'asc' },
  });
}

export async function listRoutes({ schoolId, tenantId }) {
  return prisma.transportRoute.findMany({
    where: { schoolId, tenantId },
    include: { stops: { orderBy: { sequence: 'asc' } } },
    orderBy: { code: 'asc' },
  });
}
