import crypto from 'node:crypto';
import prisma from '../../infrastructure/orm/prismaClient.js';
import communicationService from './communicationService.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';
import ValidationError from '../../shared/errors/ValidationError.js';

const owned = ({ tenantId, schoolId }) => ({ tenantId, schoolId });
const admin = (access = {}) =>
  access.platformRole === 'OWNER' ||
  access.roles?.includes('PLATFORM_ADMIN') ||
  access.roles?.includes('SCHOOL_ADMIN');
const transitions = {
  SCHEDULED: ['LIVE', 'CANCELLED'],
  LIVE: ['ENDED', 'CANCELLED'],
  ENDED: [],
  CANCELLED: [],
};

async function requireClassroom(scope, classroomId, userId, access, teacherOnly = false) {
  const classroom = await prisma.digitalClassroom.findFirst({
    where: { id: classroomId, ...owned(scope), status: 'ACTIVE' },
    include: { memberships: { where: { userId, status: 'ACTIVE' } } },
  });
  if (!classroom) throw new NotFoundError('Digital classroom not found');
  if (admin(access) || classroom.ownerId === userId) return classroom;
  const membership = classroom.memberships[0];
  if (!membership) throw new AuthorizationError('You are not a member of this classroom');
  if (teacherOnly && membership.role !== 'TEACHER') {
    throw new AuthorizationError('Only classroom teachers can manage live sessions');
  }
  return classroom;
}

export async function list(scope, classroomId, userId, access, status) {
  await requireClassroom(scope, classroomId, userId, access);
  return prisma.classroomLiveSession.findMany({
    where: {
      ...owned(scope),
      classroomId,
      ...(status ? { status } : { status: { not: 'CANCELLED' } }),
    },
    orderBy: { scheduledAt: 'asc' },
    include: {
      host: { select: { id: true, firstName: true, lastName: true, email: true } },
      classroom: { select: { id: true, name: true, code: true } },
    },
    take: 100,
  });
}

export async function listRecordings(scope, userId, access) {
  const classrooms = admin(access)
    ? await prisma.digitalClassroom.findMany({
        where: { ...owned(scope), status: 'ACTIVE' },
        select: { id: true },
      })
    : await prisma.digitalClassroom.findMany({
        where: {
          ...owned(scope),
          status: 'ACTIVE',
          OR: [{ ownerId: userId }, { memberships: { some: { userId, status: 'ACTIVE' } } }],
        },
        select: { id: true },
      });

  const classroomIds = classrooms.map((c) => c.id);
  if (!classroomIds.length) return [];

  return prisma.classroomLiveSession.findMany({
    where: {
      ...owned(scope),
      classroomId: { in: classroomIds },
      recordingUrl: { not: null },
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      host: { select: { id: true, firstName: true, lastName: true } },
      classroom: { select: { id: true, name: true, code: true } },
    },
    take: 100,
  });
}

export async function create(scope, hostId, access, data) {
  await requireClassroom(scope, data.classroomId, hostId, access, true);
  const code = data.roomCode || `virtual-${crypto.randomBytes(4).toString('hex')}`;
  const meetingUrl = data.meetingUrl || `https://meet.sais.local/room/${code}`;

  const session = await prisma.classroomLiveSession.create({
    data: {
      ...owned(scope),
      classroomId: data.classroomId,
      hostId,
      title: data.title,
      description: data.description,
      scheduledAt: data.scheduledAt,
      meetingUrl,
      roomCode: code,
      status: data.status || 'SCHEDULED',
    },
  });

  const members = await prisma.digitalClassroomMember.findMany({
    where: { classroomId: data.classroomId, ...owned(scope), status: 'ACTIVE' },
    select: { userId: true },
  });
  const recipients = members.map((m) => m.userId).filter((id) => id !== hostId);
  if (recipients.length) {
    await communicationService.createNotification(scope, {
      userIds: recipients,
      channels: ['IN_APP'],
      eventType: 'LMS_LIVE_SESSION_SCHEDULED',
      aggregateType: 'ClassroomLiveSession',
      aggregateId: session.id,
      payload: {
        classroomId: session.classroomId,
        title: session.title,
        scheduledAt: session.scheduledAt,
      },
    });
  }

  return session;
}

export async function get(scope, id, userId, access) {
  const session = await prisma.classroomLiveSession.findFirst({
    where: { id, ...owned(scope) },
    include: {
      host: { select: { id: true, firstName: true, lastName: true, email: true } },
      classroom: { select: { id: true, name: true, code: true } },
    },
  });
  if (!session) throw new NotFoundError('Live session not found');
  await requireClassroom(scope, session.classroomId, userId, access);
  return session;
}

export async function updateStatus(scope, id, actorId, access, status, data = {}) {
  const session = await prisma.classroomLiveSession.findFirst({
    where: { id, ...owned(scope) },
  });
  if (!session) throw new NotFoundError('Live session not found');
  await requireClassroom(scope, session.classroomId, actorId, access, true);

  if (!transitions[session.status]?.includes(status)) {
    throw new ValidationError(`Live session cannot move from ${session.status} to ${status}`);
  }

  const updated = await prisma.classroomLiveSession.update({
    where: { id },
    data: {
      status,
      ...(status === 'ENDED' ? { endedAt: new Date() } : {}),
      ...(data.recordingUrl ? { recordingUrl: data.recordingUrl } : {}),
      ...(data.recordingTitle ? { recordingTitle: data.recordingTitle } : {}),
    },
  });

  if (status === 'LIVE') {
    const members = await prisma.digitalClassroomMember.findMany({
      where: { classroomId: session.classroomId, ...owned(scope), status: 'ACTIVE' },
      select: { userId: true },
    });
    const recipients = members.map((m) => m.userId).filter((id) => id !== actorId);
    if (recipients.length) {
      await communicationService.createNotification(scope, {
        userIds: recipients,
        channels: ['IN_APP'],
        eventType: 'LMS_LIVE_SESSION_STARTED',
        aggregateType: 'ClassroomLiveSession',
        aggregateId: updated.id,
        payload: {
          classroomId: updated.classroomId,
          title: updated.title,
          meetingUrl: updated.meetingUrl,
        },
      });
    }
  }

  return updated;
}
