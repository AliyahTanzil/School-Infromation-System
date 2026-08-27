import prisma from '../../infrastructure/orm/prismaClient.js';

export async function getBoardingOverview({ tenantId, schoolId }) {
  const [dormitories, rooms, beds, allocations, applications] = await Promise.all([
    prisma.dormitory.count({ where: { tenantId, schoolId, status: 'ACTIVE' } }),
    prisma.dormitoryRoom.count({
      where: { floor: { building: { dormitory: { schoolId } } }, status: 'ACTIVE' },
    }),
    prisma.dormitoryBed.count({
      where: { room: { floor: { building: { dormitory: { schoolId } } } } },
    }),
    prisma.boardingAllocation.count({ where: { tenantId, schoolId, status: 'ACTIVE' } }),
    prisma.boardingApplication.count({ where: { tenantId, schoolId, status: 'PENDING' } }),
  ]);
  return {
    dormitories,
    rooms,
    beds,
    occupiedBeds: allocations,
    pendingApplications: applications,
    availableBeds: Math.max(0, beds - allocations),
  };
}

export async function listDormitories({ schoolId }) {
  return prisma.dormitory.findMany({
    where: { tenantId, schoolId },
    include: {
      buildings: { include: { floors: { include: { rooms: { include: { beds: true } } } } } },
    },
    orderBy: { name: 'asc' },
  });
}
