import { generateRecordCode } from '../../shared/utils/recordCode.js';
import prisma from '../../infrastructure/orm/prismaClient.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';
import ValidationError from '../../shared/errors/ValidationError.js';

const owned = ({ tenantId, schoolId }) => ({ tenantId, schoolId });
const isAdministrator = (roles = []) =>
  roles.includes('PLATFORM_ADMIN') || roles.includes('SCHOOL_ADMIN');

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

export function list(scope, userId, roles = []) {
  return prisma.digitalClassroom.findMany({
    where: {
      ...owned(scope),
      status: { not: 'ARCHIVED' },
      ...(isAdministrator(roles)
        ? {}
        : { OR: [{ ownerId: userId }, { memberships: { some: { userId, status: 'ACTIVE' } } }] }),
    },
    include: { _count: { select: { memberships: { where: { status: 'ACTIVE' } } } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function create(scope, userId, data) {
  if (data.classId) {
    const academicClass = await prisma.class.findFirst({
      where: { id: data.classId, ...owned(scope), deletedAt: null },
      select: { id: true },
    });
    if (!academicClass) throw new ValidationError('Academic class is outside the selected school');
  }
  return prisma.digitalClassroom.create({
    data: {
      ...owned(scope),
      ...data,
      code:
        data.code?.toUpperCase() ||
        generateRecordCode('DCL', scope.schoolId, [data.name, data.classId]),
      ownerId: userId,
      memberships: {
        create: { ...owned(scope), userId, role: 'OWNER' },
      },
    },
    include: { memberships: true },
  });
}

export async function details(scope, classroomId, userId, roles) {
  return requireClassroom(scope, classroomId, userId, roles);
}

export async function addMember(scope, classroomId, actorId, roles, data) {
  const classroom = await requireClassroom(scope, classroomId, actorId, roles);
  if (!isAdministrator(roles) && classroom.ownerId !== actorId) {
    throw new AuthorizationError('Only the classroom owner can manage members');
  }
  const user = await prisma.user.findFirst({
    where: { id: data.userId, tenantId: scope.tenantId, deletedAt: null },
    select: { id: true },
  });
  if (!user) throw new NotFoundError('User not found');
  return prisma.digitalClassroomMember.upsert({
    where: { classroomId_userId: { classroomId, userId: data.userId } },
    update: { role: data.role, status: 'ACTIVE', removedAt: null },
    create: { classroomId, ...owned(scope), userId: data.userId, role: data.role },
  });
}

export async function removeMember(scope, classroomId, actorId, roles, userId) {
  const classroom = await requireClassroom(scope, classroomId, actorId, roles);
  if (!isAdministrator(roles) && classroom.ownerId !== actorId) {
    throw new AuthorizationError('Only the classroom owner can manage members');
  }
  if (classroom.ownerId === userId)
    throw new ValidationError('The classroom owner cannot be removed');
  const changed = await prisma.digitalClassroomMember.updateMany({
    where: { classroomId, userId, ...owned(scope), status: 'ACTIVE' },
    data: { status: 'REMOVED', removedAt: new Date() },
  });
  if (!changed.count) throw new NotFoundError('Active classroom member not found');
  return { removed: true };
}

export async function archive(scope, classroomId, actorId, roles) {
  const classroom = await requireClassroom(scope, classroomId, actorId, roles);
  if (!isAdministrator(roles) && classroom.ownerId !== actorId) {
    throw new AuthorizationError('Only the classroom owner can archive this classroom');
  }
  return prisma.digitalClassroom.update({
    where: { id: classroomId },
    data: { status: 'ARCHIVED', archivedAt: new Date() },
  });
}
