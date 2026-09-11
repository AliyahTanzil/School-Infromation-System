import prisma from '../../infrastructure/orm/prismaClient.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';

const owned = ({ tenantId, schoolId }) => ({ tenantId, schoolId });
const isAdministrator = (access = {}) =>
  access.platformRole === 'OWNER' ||
  access.roles?.includes('PLATFORM_ADMIN') ||
  access.roles?.includes('SCHOOL_ADMIN');
const canManage = (classroom, userId, access) =>
  isAdministrator(access) ||
  classroom.ownerId === userId ||
  classroom.memberships.some((membership) => membership.role === 'TEACHER');

async function requireClassroom(scope, classroomId, userId, access, db = prisma) {
  const classroom = await db.digitalClassroom.findFirst({
    where: { id: classroomId, ...owned(scope), status: { not: 'ARCHIVED' } },
    include: { memberships: { where: { userId, status: 'ACTIVE' } } },
  });
  if (!classroom) throw new NotFoundError('Digital classroom not found');
  if (!isAdministrator(access) && classroom.ownerId !== userId && !classroom.memberships.length) {
    throw new AuthorizationError('You are not a member of this classroom');
  }
  return classroom;
}

export async function list(scope, classroomId, userId, access = {}) {
  await requireClassroom(scope, classroomId, userId, access);
  return prisma.digitalMaterial.findMany({
    where: { ...owned(scope), classroomId, status: 'ACTIVE' },
    include: { uploader: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function assertCanUpload(scope, classroomId, userId, access) {
  const classroom = await requireClassroom(scope, classroomId, userId, access);
  if (!canManage(classroom, userId, access)) {
    throw new AuthorizationError('Only classroom teachers can upload materials');
  }
}

export async function create(scope, userId, access, input) {
  await assertCanUpload(scope, input.classroomId, userId, access);
  return prisma.digitalMaterial.create({ data: { ...owned(scope), uploaderId: userId, ...input } });
}

export async function getById(scope, id, userId, access) {
  const material = await prisma.digitalMaterial.findFirst({
    where: { id, ...owned(scope), status: 'ACTIVE' },
  });
  if (!material) throw new NotFoundError('Material not found');
  await requireClassroom(scope, material.classroomId, userId, access);
  return material;
}

export async function archive(scope, id, userId, access) {
  const material = await getById(scope, id, userId, access);
  const classroom = await requireClassroom(scope, material.classroomId, userId, access);
  if (!canManage(classroom, userId, access)) {
    throw new AuthorizationError('Only classroom teachers can archive materials');
  }
  return prisma.digitalMaterial.update({ where: { id }, data: { status: 'ARCHIVED' } });
}
