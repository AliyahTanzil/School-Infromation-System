import prisma from '../../infrastructure/orm/prismaClient.js';
import ConflictError from '../../shared/errors/ConflictError.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';
const owned = ({ tenantId, schoolId }) => ({ tenantId, schoolId });
async function requireTenantStudent(db, scope, studentId) {
  const student = await db.student.findFirst({
    where: { id: studentId, tenantId: scope.tenantId },
    select: { id: true },
  });
  if (!student) throw new NotFoundError('Student not found');
  return student;
}
export async function getBoardingOverview(scope) {
  const where = owned(scope);
  const [dormitories, rooms, beds, occupiedBeds, pendingApplications] = await Promise.all([
    prisma.dormitory.count({ where: { ...where, status: 'ACTIVE' } }),
    prisma.dormitoryRoom.count({ where: { ...where, status: 'ACTIVE' } }),
    prisma.dormitoryBed.count({ where }),
    prisma.boardingAllocation.count({ where: { ...where, status: 'ACTIVE' } }),
    prisma.boardingApplication.count({ where: { ...where, status: 'PENDING' } }),
  ]);
  return {
    dormitories,
    rooms,
    beds,
    occupiedBeds,
    pendingApplications,
    availableBeds: Math.max(0, beds - occupiedBeds),
  };
}
export const listDormitories = (scope) =>
  prisma.dormitory.findMany({
    where: owned(scope),
    include: { rooms: { include: { beds: true } } },
    orderBy: { name: 'asc' },
  });
export const createDormitory = (scope, data) =>
  prisma.dormitory.create({ data: { ...owned(scope), ...data } });
export async function addRoom(scope, dormitoryId, data) {
  const dorm = await prisma.dormitory.findFirst({ where: { id: dormitoryId, ...owned(scope) } });
  if (!dorm) throw new NotFoundError('Dormitory not found');
  return prisma.dormitoryRoom.create({
    data: {
      ...owned(scope),
      dormitoryId,
      roomNumber: data.roomNumber,
      beds: {
        create: Array.from({ length: data.bedCount }, (_, index) => ({
          ...owned(scope),
          bedNumber: String(index + 1),
        })),
      },
    },
    include: { beds: true },
  });
}
export const listApplications = (scope) =>
  prisma.boardingApplication.findMany({
    where: owned(scope),
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
export async function createApplication(scope, data) {
  await requireTenantStudent(prisma, scope, data.studentId);
  const existing = await prisma.boardingApplication.count({
    where: {
      ...owned(scope),
      studentId: data.studentId,
      status: { in: ['PENDING', 'APPROVED', 'ALLOCATED'] },
    },
  });
  if (existing) throw new ConflictError('Student already has an open boarding application');
  return prisma.boardingApplication.create({ data: { ...owned(scope), ...data } });
}
export async function decideApplication(scope, id, status, actorId) {
  const changed = await prisma.boardingApplication.updateMany({
    where: { id, ...owned(scope), status: 'PENDING' },
    data: { status, decidedById: actorId, decidedAt: new Date() },
  });
  if (!changed.count) throw new NotFoundError('Pending application not found');
  return prisma.boardingApplication.findFirst({ where: { id, ...owned(scope) } });
}
export const listAllocations = (scope) =>
  prisma.boardingAllocation.findMany({
    where: owned(scope),
    include: { bed: { include: { room: { include: { dormitory: true } } } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
export async function allocate(scope, data) {
  return prisma.$transaction(async (tx) => {
    await requireTenantStudent(tx, scope, data.studentId);
    const application = await tx.boardingApplication.findFirst({
      where: { ...owned(scope), studentId: data.studentId, status: 'APPROVED' },
      select: { id: true },
    });
    if (!application) throw new ConflictError('Student requires an approved boarding application');
    const existing = await tx.boardingAllocation.count({
      where: { ...owned(scope), studentId: data.studentId, status: 'ACTIVE' },
    });
    if (existing) throw new ConflictError('Student already has an active bed');
    const bed = await tx.dormitoryBed.updateMany({
      where: { id: data.bedId, ...owned(scope), status: 'AVAILABLE' },
      data: { status: 'OCCUPIED' },
    });
    if (!bed.count) throw new ConflictError('Bed is unavailable');
    const allocation = await tx.boardingAllocation.create({
      data: { ...owned(scope), ...data },
    });
    await tx.boardingApplication.update({
      where: { id: application.id },
      data: { status: 'ALLOCATED' },
    });
    return allocation;
  });
}
export async function checkout(scope, id) {
  return prisma.$transaction(async (tx) => {
    const allocation = await tx.boardingAllocation.findFirst({
      where: { id, ...owned(scope), status: 'ACTIVE' },
    });
    if (!allocation) throw new NotFoundError('Active allocation not found');
    await tx.dormitoryBed.update({
      where: { id: allocation.bedId },
      data: { status: 'AVAILABLE' },
    });
    return tx.boardingAllocation.update({
      where: { id },
      data: { status: 'CHECKED_OUT', checkedOutAt: new Date() },
    });
  });
}
