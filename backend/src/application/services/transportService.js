import prisma from '../../infrastructure/orm/prismaClient.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';
const owned = ({ tenantId, schoolId }) => ({ tenantId, schoolId });
export async function getTransportOverview(scope) {
  const where = owned(scope);
  const [vehicles, drivers, routes, upcomingTrips, failedInspections] = await Promise.all([
    prisma.vehicle.count({ where }),
    prisma.transportDriver.count({ where }),
    prisma.transportRoute.count({ where }),
    prisma.transportTrip.count({
      where: { ...where, scheduledAt: { gte: new Date() }, status: { not: 'CANCELLED' } },
    }),
    prisma.vehicleInspection.count({ where: { ...where, passed: false } }),
  ]);
  return { vehicles, drivers, routes, upcomingTrips, failedInspections };
}
export const listVehicles = (scope, search = '') =>
  prisma.vehicle.findMany({
    where: {
      ...owned(scope),
      ...(search
        ? {
            OR: [
              { vehicleNumber: { contains: search, mode: 'insensitive' } },
              { registrationNumber: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { vehicleNumber: 'asc' },
    take: 100,
  });
export const createVehicle = (scope, data) =>
  prisma.vehicle.create({ data: { ...owned(scope), ...data } });
export async function updateVehicleStatus(scope, id, status) {
  const changed = await prisma.vehicle.updateMany({
    where: { id, ...owned(scope) },
    data: { status },
  });
  if (!changed.count) throw new NotFoundError('Vehicle not found');
  return prisma.vehicle.findFirst({ where: { id, ...owned(scope) } });
}
export const listDrivers = (scope) =>
  prisma.transportDriver.findMany({ where: owned(scope), orderBy: { name: 'asc' }, take: 100 });
export const createDriver = (scope, data) =>
  prisma.transportDriver.create({ data: { ...owned(scope), ...data } });
export const listRoutes = (scope) =>
  prisma.transportRoute.findMany({
    where: owned(scope),
    include: { stops: { orderBy: { sequence: 'asc' } } },
    orderBy: { code: 'asc' },
  });
export const createRoute = (scope, data) =>
  prisma.transportRoute.create({
    data: { ...owned(scope), code: data.code, name: data.name, stops: { create: data.stops } },
    include: { stops: true },
  });
export const listTrips = (scope) =>
  prisma.transportTrip.findMany({
    where: owned(scope),
    include: { route: true },
    orderBy: { scheduledAt: 'desc' },
    take: 100,
  });
export async function createTrip(scope, data) {
  const route = await prisma.transportRoute.findFirst({
    where: { id: data.routeId, ...owned(scope), active: true },
  });
  if (!route) throw new NotFoundError('Transport route not found');
  return prisma.transportTrip.create({ data: { ...owned(scope), ...data } });
}
export async function inspectVehicle(scope, vehicleId, data) {
  const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, ...owned(scope) } });
  if (!vehicle) throw new NotFoundError('Vehicle not found');
  return prisma.vehicleInspection.create({ data: { ...owned(scope), vehicleId, ...data } });
}
