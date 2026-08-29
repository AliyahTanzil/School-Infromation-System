import prisma from '../../infrastructure/orm/prismaClient.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';

const owned = ({ tenantId, schoolId }) => ({ tenantId, schoolId });
const isAdministrator = (roles = []) =>
  roles.includes('PLATFORM_ADMIN') || roles.includes('SCHOOL_ADMIN');
const canManage = (classroom, userId, roles) =>
  isAdministrator(roles) ||
  classroom.ownerId === userId ||
  classroom.memberships.some((membership) => membership.role === 'TEACHER');

async function requireClassroom(scope, classroomId, userId, roles, db = prisma) {
  const classroom = await db.digitalClassroom.findFirst({
    where: { id: classroomId, ...owned(scope), status: { not: 'ARCHIVED' } },
    include: { memberships: { where: { userId, status: 'ACTIVE' } } },
  });
  if (!classroom) throw new NotFoundError('Digital classroom not found');
  if (!isAdministrator(roles) && classroom.ownerId !== userId && !classroom.memberships.length) {
    throw new AuthorizationError('You are not a member of this classroom');
  }
  return classroom;
}

export async function list(scope, classroomId, userId, roles = []) {
  await requireClassroom(scope, classroomId, userId, roles);
  return prisma.digitalMaterial.findMany({
    where: { ...owned(scope), classroomId, status: 'ACTIVE' },
    include: { uploader: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function create(scope, userId, roles, input) {
  const classroom = await requireClassroom(scope, input.classroomId, userId, roles);
  if (!canManage(classroom, userId, roles)) {
    throw new AuthorizationError('Only classroom teachers can upload materials');
  }
  return prisma.digitalMaterial.create({ data: { ...owned(scope), uploaderId: userId, ...input } });
}

export async function getById(scope, id, userId, roles) {
  const material = await prisma.digitalMaterial.findFirst({
    where: { id, ...owned(scope), status: 'ACTIVE' },
  });
  if (!material) throw new NotFoundError('Material not found');
  await requireClassroom(scope, material.classroomId, userId, roles);
  return material;
}

export async function archive(scope, id, userId, roles) {
  const material = await getById(scope, id, userId, roles);
  const classroom = await requireClassroom(scope, material.classroomId, userId, roles);
  if (!canManage(classroom, userId, roles)) {
    throw new AuthorizationError('Only classroom teachers can archive materials');
  }
  return prisma.digitalMaterial.update({ where: { id }, data: { status: 'ARCHIVED' } });
}
