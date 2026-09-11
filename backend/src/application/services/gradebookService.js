import prisma from '../../infrastructure/orm/prismaClient.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';
import ValidationError from '../../shared/errors/ValidationError.js';

const owned = (scope) => ({ tenantId: scope.tenantId, schoolId: scope.schoolId });
const isAdmin = (access = {}) =>
  access.platformRole === 'OWNER' ||
  access.roles?.includes('PLATFORM_ADMIN') ||
  access.roles?.includes('SCHOOL_ADMIN');
const isStaff = (access = {}) => isAdmin(access) || access.roles?.includes('TEACHER');

async function requireClassroom(
  scope,
  classroomId,
  userId,
  access,
  staffOnly = false,
  db = prisma
) {
  const classroom = await db.digitalClassroom.findFirst({
    where: { id: classroomId, ...owned(scope), status: { not: 'ARCHIVED' } },
    include: { memberships: { where: { userId, status: 'ACTIVE' } } },
  });
  if (!classroom) throw new NotFoundError('Classroom not found');
  const membership = classroom.memberships[0];
  const manages = isAdmin(access) || classroom.ownerId === userId || membership?.role === 'TEACHER';
  if (staffOnly && !manages)
    throw new AuthorizationError('Only classroom teachers can manage grades');
  if (!staffOnly && !manages && !membership)
    throw new AuthorizationError('You are not a member of this classroom');
  return classroom;
}

async function requireSubmission(
  scope,
  submissionId,
  userId,
  access,
  staffOnly = false,
  db = prisma
) {
  const submission = await db.studentSubmission.findFirst({
    where: { id: submissionId, ...owned(scope) },
    include: { assignment: true },
  });
  if (!submission) throw new NotFoundError('Submission not found');
  await requireClassroom(scope, submission.assignment.classroomId, userId, access, staffOnly, db);
  if (!staffOnly && !isStaff(access) && submission.studentId !== userId)
    throw new AuthorizationError('You cannot view this grade');
  return submission;
}

const gradeInclude = {
  rubricScores: { include: { criterion: true } },
  feedback: {
    include: { author: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { createdAt: 'asc' },
  },
};

export async function listRubrics(scope, classroomId, userId, access) {
  await requireClassroom(scope, classroomId, userId, access);
  return prisma.rubric.findMany({
    where: {
      ...owned(scope),
      classroomId,
      ...(isStaff(access) ? {} : { status: 'PUBLISHED' }),
    },
    include: { criteria: { orderBy: { position: 'asc' } } },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function createRubric(scope, userId, access, data) {
  await requireClassroom(scope, data.classroomId, userId, access, true);
  return prisma.rubric.create({
    data: {
      ...owned(scope),
      classroomId: data.classroomId,
      authorId: userId,
      title: data.title,
      description: data.description,
      criteria: {
        create: data.criteria.map((criterion, position) => ({ ...criterion, position })),
      },
    },
    include: { criteria: { orderBy: { position: 'asc' } } },
  });
}

export async function changeRubricStatus(scope, id, userId, access, status) {
  const rubric = await prisma.rubric.findFirst({ where: { id, ...owned(scope) } });
  if (!rubric) throw new NotFoundError('Rubric not found');
  await requireClassroom(scope, rubric.classroomId, userId, access, true);
  if (rubric.status === 'ARCHIVED') throw new ValidationError('Archived rubrics cannot be changed');
  return prisma.rubric.update({ where: { id }, data: { status } });
}

export async function assignRubric(scope, assignmentId, userId, access, rubricId) {
  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, ...owned(scope) },
  });
  if (!assignment) throw new NotFoundError('Assignment not found');
  await requireClassroom(scope, assignment.classroomId, userId, access, true);
  if (rubricId) {
    const rubric = await prisma.rubric.findFirst({
      where: {
        id: rubricId,
        classroomId: assignment.classroomId,
        ...owned(scope),
        status: { not: 'ARCHIVED' },
      },
    });
    if (!rubric) throw new ValidationError('Rubric is outside the assignment classroom');
  }
  return prisma.assignment.update({ where: { id: assignmentId }, data: { rubricId } });
}

export async function listGrades(scope, assignmentId, userId, access) {
  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, ...owned(scope) },
  });
  if (!assignment) throw new NotFoundError('Assignment not found');
  await requireClassroom(scope, assignment.classroomId, userId, access, isStaff(access));
  return prisma.studentSubmission.findMany({
    where: {
      ...owned(scope),
      assignmentId,
      ...(isStaff(access) ? {} : { studentId: userId }),
      ...(isStaff(access) ? {} : { grade: { is: { status: 'RELEASED' } } }),
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, email: true } },
      assignment: { select: { id: true, title: true, points: true, rubricId: true } },
      versions: { orderBy: { version: 'desc' }, take: 1 },
      grade: { include: gradeInclude },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function saveGrade(scope, submissionId, userId, access, data) {
  const submission = await requireSubmission(scope, submissionId, userId, access, true);
  if (data.score > data.maxScore) throw new ValidationError('Score cannot exceed maximum score');
  const assignment = await prisma.assignment.findUnique({
    where: { id: submission.assignmentId },
    include: { rubric: { include: { criteria: true } } },
  });
  const criteria = new Map((assignment.rubric?.criteria ?? []).map((item) => [item.id, item]));
  if (new Set(data.rubricScores.map((item) => item.criterionId)).size !== data.rubricScores.length)
    throw new ValidationError('Each rubric criterion may be scored only once');
  if (criteria.size && data.rubricScores.length !== criteria.size)
    throw new ValidationError('Every rubric criterion requires a score');
  for (const rubricScore of data.rubricScores) {
    const criterion = criteria.get(rubricScore.criterionId);
    if (!criterion || rubricScore.points > criterion.maxPoints)
      throw new ValidationError('Rubric score is outside the assigned rubric');
  }
  return prisma.$transaction(async (tx) => {
    const grade = await tx.submissionGrade.upsert({
      where: { submissionId },
      create: {
        ...owned(scope),
        submissionId,
        graderId: userId,
        score: data.score,
        maxScore: data.maxScore,
        summary: data.summary,
      },
      update: {
        graderId: userId,
        score: data.score,
        maxScore: data.maxScore,
        summary: data.summary,
        status: 'DRAFT',
        releasedAt: null,
      },
    });
    await tx.rubricScore.deleteMany({ where: { gradeId: grade.id } });
    if (data.rubricScores.length) {
      await tx.rubricScore.createMany({
        data: data.rubricScores.map((item) => ({ ...item, gradeId: grade.id })),
      });
    }
    return tx.submissionGrade.findUnique({ where: { id: grade.id }, include: gradeInclude });
  });
}

export async function releaseGrade(scope, id, userId, access) {
  const grade = await prisma.submissionGrade.findFirst({
    where: { id, ...owned(scope) },
    include: { submission: { include: { assignment: true } } },
  });
  if (!grade) throw new NotFoundError('Grade not found');
  await requireClassroom(scope, grade.submission.assignment.classroomId, userId, access, true);
  return prisma.submissionGrade.update({
    where: { id },
    data: { status: 'RELEASED', releasedAt: new Date() },
    include: gradeInclude,
  });
}

export async function addFeedback(scope, id, userId, access, body) {
  const grade = await prisma.submissionGrade.findFirst({
    where: { id, ...owned(scope) },
    include: { submission: { include: { assignment: true } } },
  });
  if (!grade) throw new NotFoundError('Grade not found');
  await requireClassroom(
    scope,
    grade.submission.assignment.classroomId,
    userId,
    access,
    isStaff(access)
  );
  if (!isStaff(access) && (grade.status !== 'RELEASED' || grade.submission.studentId !== userId))
    throw new AuthorizationError('Feedback is not available');
  return prisma.gradeFeedback.create({ data: { gradeId: id, authorId: userId, body } });
}
