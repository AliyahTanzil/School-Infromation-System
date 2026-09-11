import prisma from '../../infrastructure/orm/prismaClient.js';
import ValidationError from '../../shared/errors/ValidationError.js';
import { MAX_SEARCH_QUERY_LENGTH } from '../../domain/searchQuery.js';
import {
  learnerAssignmentVisibility,
  managesClassroom,
} from '../../domain/assignmentVisibility.js';

const owned = ({ tenantId, schoolId }) => ({ tenantId, schoolId });

const isAdministrator = (access = {}) =>
  access.platformRole === 'OWNER' ||
  access.roles?.includes('PLATFORM_ADMIN') ||
  access.roles?.includes('SCHOOL_ADMIN');

/**
 * Perform a permission-aware search across classrooms, assignments, materials, announcements/stream posts, and subjects.
 */
export async function globalSearch(scope, userId, access = {}, queryStr = '', db = prisma) {
  if (!scope?.tenantId || !scope?.schoolId || !userId)
    throw new ValidationError('Authenticated tenant and school scope required');
  if (typeof queryStr !== 'string' || queryStr.length > MAX_SEARCH_QUERY_LENGTH)
    throw new ValidationError(
      `Search must be a string of at most ${MAX_SEARCH_QUERY_LENGTH} characters`
    );
  const query = queryStr.trim();
  if (!query) {
    return {
      query: '',
      classrooms: [],
      assignments: [],
      materials: [],
      announcements: [],
      subjects: [],
      totalResults: 0,
    };
  }

  const isAdmin = isAdministrator(access);

  // 1. Get accessible classroom IDs for this user in this tenant/school scope
  const accessibleClassrooms = await db.digitalClassroom
    .findMany({
      where: {
        ...owned(scope),
        status: { not: 'ARCHIVED' },
        ...(isAdmin
          ? {}
          : {
              OR: [{ ownerId: userId }, { memberships: { some: { userId, status: 'ACTIVE' } } }],
            }),
      },
      select: {
        id: true,
        name: true,
        code: true,
        ownerId: true,
        memberships: {
          where: { userId, status: 'ACTIVE' },
          select: { userId: true, status: true, role: true },
        },
      },
    })
    .catch(() => []);

  const classroomIds = accessibleClassrooms.map((c) => c.id);
  const managedClassroomIds = accessibleClassrooms
    .filter((classroom) => isAdmin || managesClassroom(classroom, userId, access.roles ?? []))
    .map((classroom) => classroom.id);

  // 2. Perform searches concurrently across categories
  const [classrooms, assignments, materials, announcements, streamPosts, subjects] =
    await Promise.all([
      // Classrooms
      db.digitalClassroom
        .findMany({
          where: {
            ...owned(scope),
            id: { in: classroomIds },
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { code: { contains: query, mode: 'insensitive' } },
              { section: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            name: true,
            code: true,
            section: true,
            description: true,
            status: true,
          },
          take: 10,
        })
        .catch(() => []),

      // Assignments
      classroomIds.length > 0
        ? db.assignment
            .findMany({
              where: {
                ...owned(scope),
                classroomId: { in: classroomIds },
                AND: [
                  {
                    OR: [
                      { classroomId: { in: managedClassroomIds } },
                      learnerAssignmentVisibility(),
                    ],
                  },
                ],
                OR: [
                  { title: { contains: query, mode: 'insensitive' } },
                  { description: { contains: query, mode: 'insensitive' } },
                  { topic: { contains: query, mode: 'insensitive' } },
                ],
              },
              select: {
                id: true,
                title: true,
                description: true,
                type: true,
                classroomId: true,
                dueAt: true,
                points: true,
                status: true,
                classroom: { select: { id: true, name: true } },
              },
              take: 10,
            })
            .catch(() => [])
        : [],

      // Digital Materials
      classroomIds.length > 0
        ? db.digitalMaterial
            .findMany({
              where: {
                ...owned(scope),
                classroomId: { in: classroomIds },
                status: 'ACTIVE',
                OR: [
                  { title: { contains: query, mode: 'insensitive' } },
                  { description: { contains: query, mode: 'insensitive' } },
                  { pathname: { contains: query, mode: 'insensitive' } },
                ],
              },
              select: {
                id: true,
                title: true,
                description: true,
                pathname: true,
                contentType: true,
                classroomId: true,
                classroom: { select: { id: true, name: true } },
              },
              take: 10,
            })
            .catch(() => [])
        : [],

      // Announcements
      classroomIds.length > 0
        ? db.classroomAnnouncement
            .findMany({
              where: {
                ...owned(scope),
                classroomId: { in: classroomIds },
                status: 'PUBLISHED',
                OR: [
                  { title: { contains: query, mode: 'insensitive' } },
                  { body: { contains: query, mode: 'insensitive' } },
                ],
              },
              select: {
                id: true,
                title: true,
                body: true,
                classroomId: true,
                createdAt: true,
                classroom: { select: { id: true, name: true } },
              },
              take: 10,
            })
            .catch(() => [])
        : [],

      // Stream Posts
      classroomIds.length > 0
        ? db.classroomStreamPost
            .findMany({
              where: {
                ...owned(scope),
                classroomId: { in: classroomIds },
                status: 'PUBLISHED',
                body: { contains: query, mode: 'insensitive' },
              },
              select: {
                id: true,
                body: true,
                classroomId: true,
                createdAt: true,
                classroom: { select: { id: true, name: true } },
              },
              take: 10,
            })
            .catch(() => [])
        : [],

      // Subjects
      db.subject
        .findMany({
          where: {
            ...owned(scope),
            status: 'ACTIVE',
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { code: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
          },
          take: 10,
        })
        .catch(() => []),
    ]);

  const combinedAnnouncements = [
    ...announcements.map((a) => ({ ...a, kind: 'announcement' })),
    ...streamPosts.map((p) => ({ ...p, title: p.body?.slice(0, 40) || 'Post', kind: 'post' })),
  ].slice(0, 10);

  const totalResults =
    classrooms.length +
    assignments.length +
    materials.length +
    combinedAnnouncements.length +
    subjects.length;

  return {
    query,
    classrooms,
    assignments,
    materials,
    announcements: combinedAnnouncements,
    subjects,
    totalResults,
  };
}
