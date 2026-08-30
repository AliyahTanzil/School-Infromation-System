import prisma from '../../infrastructure/orm/prismaClient.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';
import ConflictError from '../../shared/errors/ConflictError.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';
import ValidationError from '../../shared/errors/ValidationError.js';

const owned = ({ tenantId, schoolId }) => ({ tenantId, schoolId });
const admin = (roles = []) => roles.includes('PLATFORM_ADMIN') || roles.includes('SCHOOL_ADMIN');
const transitions = {
  DRAFT: ['PUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['CLOSED'],
  CLOSED: ['ARCHIVED'],
};

async function requireClassroom(scope, classroomId, userId, roles, staffOnly = false, db = prisma) {
  const classroom = await db.digitalClassroom.findFirst({
    where: { id: classroomId, ...owned(scope), status: 'ACTIVE' },
    include: { memberships: { where: { userId, status: 'ACTIVE' } } },
  });
  if (!classroom) throw new NotFoundError('Digital classroom not found');
  if (admin(roles) || classroom.ownerId === userId) return { classroom, membership: null };
  const membership = classroom.memberships[0];
  if (!membership) throw new AuthorizationError('You are not a member of this classroom');
  if (staffOnly && membership.role !== 'TEACHER') {
    throw new AuthorizationError('Only classroom teachers can manage quizzes');
  }
  return { classroom, membership };
}

async function requireQuiz(scope, id, userId, roles, staffOnly = false, db = prisma) {
  const quiz = await db.quiz.findFirst({ where: { id, ...owned(scope) } });
  if (!quiz) throw new NotFoundError('Quiz not found');
  const access = await requireClassroom(scope, quiz.classroomId, userId, roles, staffOnly, db);
  return { quiz, ...access };
}

export async function list(scope, classroomId, userId, roles) {
  const { classroom, membership } = await requireClassroom(scope, classroomId, userId, roles);
  const staff = admin(roles) || classroom.ownerId === userId || membership?.role === 'TEACHER';
  return prisma.quiz.findMany({
    where: {
      ...owned(scope),
      classroomId,
      ...(staff ? { status: { not: 'ARCHIVED' } } : { status: 'PUBLISHED' }),
    },
    include: { _count: { select: { questions: true, attempts: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function details(scope, id, userId, roles) {
  const { quiz, classroom, membership } = await requireQuiz(scope, id, userId, roles);
  const staff = admin(roles) || classroom.ownerId === userId || membership?.role === 'TEACHER';
  if (!staff && quiz.status !== 'PUBLISHED') throw new NotFoundError('Quiz not found');
  return prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          type: true,
          prompt: true,
          options: true,
          points: true,
          position: true,
          ...(staff ? { correctAnswer: true } : {}),
        },
      },
      attempts: !staff
        ? { where: { studentId: userId }, orderBy: { attemptNumber: 'desc' }, take: 10 }
        : { orderBy: { startedAt: 'desc' }, take: 100 },
    },
  });
}

export async function create(scope, authorId, roles, data) {
  await requireClassroom(scope, data.classroomId, authorId, roles, true);
  if (data.assignmentId) {
    const assignment = await prisma.assignment.findFirst({
      where: { id: data.assignmentId, ...owned(scope), classroomId: data.classroomId },
    });
    if (!assignment) throw new ValidationError('Assignment is outside the quiz classroom');
  }
  if (data.assessmentWeightId) {
    const weight = await prisma.assessmentWeight.findFirst({
      where: {
        id: data.assessmentWeightId,
        scheme: { ...owned(scope), status: 'ACTIVE', deletedAt: null },
      },
    });
    if (!weight)
      throw new ValidationError('Assessment weight is not part of an active school policy');
  }
  return prisma.quiz.create({ data: { ...owned(scope), ...data, authorId } });
}

export async function addQuestion(scope, id, actorId, roles, data) {
  const { quiz } = await requireQuiz(scope, id, actorId, roles, true);
  if (quiz.status !== 'DRAFT') throw new ValidationError('Published quiz questions are immutable');
  if (data.type !== 'SHORT_ANSWER' && data.options.length < 2) {
    throw new ValidationError('Choice questions require at least two options');
  }
  if (data.type !== 'SHORT_ANSWER' && !data.options.includes(String(data.correctAnswer))) {
    throw new ValidationError('Correct answer must match a supplied option');
  }
  const position = await prisma.quizQuestion.count({ where: { quizId: id } });
  return prisma.quizQuestion.create({ data: { quizId: id, ...data, position } });
}

export async function changeStatus(scope, id, actorId, roles, status) {
  const { quiz } = await requireQuiz(scope, id, actorId, roles, true);
  if (!transitions[quiz.status]?.includes(status)) {
    throw new ValidationError(`Quiz cannot move from ${quiz.status} to ${status}`);
  }
  if (status === 'PUBLISHED' && !(await prisma.quizQuestion.count({ where: { quizId: id } }))) {
    throw new ValidationError('A quiz needs at least one question before publication');
  }
  const now = new Date();
  return prisma.quiz.update({
    where: { id },
    data: {
      status,
      ...(status === 'PUBLISHED' ? { publishedAt: now } : {}),
      ...(status === 'CLOSED' ? { closedAt: now } : {}),
    },
  });
}

export async function startAttempt(scope, id, studentId, roles) {
  const { quiz, membership } = await requireQuiz(scope, id, studentId, roles);
  if (membership?.role !== 'STUDENT')
    throw new AuthorizationError('An active student membership is required');
  if (quiz.status !== 'PUBLISHED') throw new ValidationError('Quiz is not accepting attempts');
  const count = await prisma.quizAttempt.count({ where: { quizId: id, studentId } });
  if (count >= quiz.maxAttempts) throw new ConflictError('Quiz attempt limit reached');
  return prisma.quizAttempt.create({
    data: {
      ...owned(scope),
      quizId: id,
      studentId,
      attemptNumber: count + 1,
      expiresAt: new Date(Date.now() + quiz.durationMinutes * 60000),
    },
  });
}

async function requireAttempt(scope, attemptId, studentId, db = prisma) {
  const attempt = await db.quizAttempt.findFirst({
    where: { id: attemptId, studentId, ...owned(scope) },
    include: { quiz: true },
  });
  if (!attempt) throw new NotFoundError('Quiz attempt not found');
  if (attempt.status !== 'IN_PROGRESS')
    throw new ValidationError('Quiz attempt is no longer editable');
  if (attempt.expiresAt <= new Date()) throw new ValidationError('Quiz attempt has expired');
  return attempt;
}

export async function saveAnswer(scope, attemptId, studentId, data) {
  const attempt = await requireAttempt(scope, attemptId, studentId);
  const question = await prisma.quizQuestion.findFirst({
    where: { id: data.questionId, quizId: attempt.quizId },
  });
  if (!question) throw new ValidationError('Question is outside this quiz');
  return prisma.quizAnswer.upsert({
    where: { attemptId_questionId: { attemptId, questionId: data.questionId } },
    update: { response: data.response, answeredAt: new Date() },
    create: { attemptId, questionId: data.questionId, response: data.response },
  });
}

const normalized = (value) => String(value).trim().toLowerCase();
export async function submitAttempt(scope, attemptId, studentId) {
  await requireAttempt(scope, attemptId, studentId);
  return prisma.$transaction(async (tx) => {
    const attempt = await tx.quizAttempt.findUnique({
      where: { id: attemptId },
      include: { answers: { include: { question: true } }, quiz: { include: { questions: true } } },
    });
    let score = 0;
    for (const answer of attempt.answers) {
      const awarded =
        normalized(answer.response) === normalized(answer.question.correctAnswer)
          ? answer.question.points
          : 0;
      score += awarded;
      await tx.quizAnswer.update({ where: { id: answer.id }, data: { pointsAwarded: awarded } });
    }
    const maxScore = attempt.quiz.questions.reduce((sum, question) => sum + question.points, 0);
    return tx.quizAttempt.update({
      where: { id: attemptId },
      data: { status: 'SUBMITTED', submittedAt: new Date(), score, maxScore },
    });
  });
}
