import prisma from '../../infrastructure/orm/prismaClient.js';
import {
  assertExaminationTransition,
  assertMarkWritable,
  assertScore,
} from '../../domain/examinationLifecycle.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';
import ValidationError from '../../shared/errors/ValidationError.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';

const scope = ({ tenantId, schoolId }) => ({ tenantId, schoolId });
export async function listExaminations(context, { status } = {}) {
  const items = await prisma.examination.findMany({
    where: { ...scope(context), ...(status ? { status } : {}) },
    orderBy: { createdAt: 'desc' },
  });
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      _count: {
        candidates: await prisma.examinationCandidate.count({
          where: { ...scope(context), examinationId: item.id },
        }),
        schedules: await prisma.examinationSchedule.count({
          where: { ...scope(context), examinationId: item.id },
        }),
        marks: await prisma.examinationMark.count({
          where: { ...scope(context), examinationId: item.id },
        }),
      },
    }))
  );
}
export const createExamination = (context, data, actorId) =>
  prisma.examination.create({
    data: { ...scope(context), name: data.name, code: data.code, createdById: actorId },
  });
export async function getExamination(id, context) {
  const examination = await prisma.examination.findFirst({ where: { id, ...scope(context) } });
  if (!examination) throw new NotFoundError('Examination not found');
  const [candidates, schedules, marks, audits] = await Promise.all([
    prisma.examinationCandidate.findMany({
      where: { ...scope(context), examinationId: id },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.examinationSchedule.findMany({
      where: { ...scope(context), examinationId: id },
      orderBy: { scheduledAt: 'asc' },
    }),
    prisma.examinationMark.findMany({
      where: { ...scope(context), examinationId: id },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.examinationAudit.findMany({
      where: { ...scope(context), examinationId: id },
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  return { ...examination, candidates, schedules, marks, audits };
}
export async function addCandidate(id, context, input) {
  await getExamination(id, context);
  const [student, classRecord] = await Promise.all([
    prisma.student.findFirst({
      where: {
        id: input.studentId,
        tenantId: context.tenantId,
        schoolId: context.schoolId,
        deletedAt: null,
      },
    }),
    prisma.class.findFirst({ where: { id: input.classId, ...scope(context), deletedAt: null } }),
  ]);
  if (!student || !classRecord)
    throw new ValidationError('Student or class is outside the selected school context');
  const enrollment = await prisma.classEnrollment.findFirst({
    where: { studentId: student.id, classId: classRecord.id, ...scope(context), status: 'ACTIVE' },
  });
  if (!enrollment)
    throw new ValidationError('Student is not actively enrolled in the selected class');
  return prisma.examinationCandidate.upsert({
    where: { examinationId_studentId: { examinationId: id, studentId: student.id } },
    create: {
      ...scope(context),
      examinationId: id,
      studentId: student.id,
      classId: classRecord.id,
    },
    update: { classId: classRecord.id },
  });
}
export async function addSchedule(id, context, input) {
  const examination = await getExamination(id, context);
  if (examination.status !== 'DRAFT')
    throw new ValidationError('Schedules can only be changed while the examination is in draft');
  const [classRecord, subject] = await Promise.all([
    prisma.class.findFirst({ where: { id: input.classId, ...scope(context), deletedAt: null } }),
    prisma.subject.findFirst({
      where: { code: input.subjectCode, ...scope(context), deletedAt: null },
    }),
  ]);
  if (!classRecord || !subject)
    throw new ValidationError('Class or subject is outside the selected school context');
  return prisma.examinationSchedule.upsert({
    where: {
      examinationId_subjectCode_classId: {
        examinationId: id,
        subjectCode: subject.code,
        classId: classRecord.id,
      },
    },
    create: {
      ...scope(context),
      examinationId: id,
      subjectCode: subject.code,
      classId: classRecord.id,
      scheduledAt: input.scheduledAt,
    },
    update: { scheduledAt: input.scheduledAt },
  });
}
export async function changeStatus(id, context, input, actorId) {
  const current = await getExamination(id, context);
  assertExaminationTransition(current.status, input.status);
  if (input.status === 'SCHEDULED' && (!current.candidates.length || !current.schedules.length))
    throw new ValidationError(
      'Add at least one candidate and schedule before scheduling the examination'
    );
  return prisma.$transaction(async (tx) => {
    const updated = await tx.examination.update({
      where: { id },
      data: {
        status: input.status,
        ...(input.status === 'LOCKED' ? { lockedAt: new Date() } : {}),
      },
    });
    await tx.examinationAudit.create({
      data: {
        ...scope(context),
        examinationId: id,
        actorId,
        action: 'STATUS_CHANGED',
        metadata: { from: current.status, to: input.status, reason: input.reason },
      },
    });
    return updated;
  });
}
export async function assertMarkAuthorization(
  context,
  actorId,
  roles,
  candidate,
  subjectCode,
  db = prisma
) {
  if (roles?.some((role) => ['PLATFORM_ADMIN', 'SCHOOL_ADMIN'].includes(role))) return;

  const teacher = await db.teacher.findFirst({
    where: {
      userId: actorId,
      ...scope(context),
      status: 'ACTIVE',
      deletedAt: null,
    },
    select: { id: true },
  });
  if (!teacher) throw new AuthorizationError('An active teacher identity is required');

  const assignment = await db.teacherTeachingAssignment.findFirst({
    where: {
      ...scope(context),
      teacherId: teacher.id,
      classId: candidate.classId,
      status: 'ACTIVE',
      subject: {
        code: subjectCode,
        ...scope(context),
        deletedAt: null,
      },
    },
    select: { id: true },
  });
  if (!assignment) {
    throw new AuthorizationError(
      'You are not assigned to teach this subject for the candidate class'
    );
  }
}

export async function upsertMark(id, context, input, actorId, roles = []) {
  const examination = await getExamination(id, context);
  assertMarkWritable(examination.status, null);
  if (!['IN_PROGRESS', 'MARKING', 'MODERATION'].includes(examination.status))
    throw new ValidationError('Marks can only be entered during an active marking workflow');
  assertScore(input.score, input.maxScore);
  const candidate = examination.candidates.find((item) => item.id === input.candidateId);
  if (!candidate) throw new NotFoundError('Candidate not found in examination');
  const schedule = examination.schedules.find(
    (item) =>
      item.subjectCode === input.subjectCode &&
      (!item.classId || item.classId === candidate.classId)
  );
  if (!schedule) throw new ValidationError('Subject is not scheduled for the candidate class');
  await assertMarkAuthorization(context, actorId, roles, candidate, input.subjectCode);
  return prisma.examinationMark.upsert({
    where: {
      examinationId_candidateId_subjectCode: {
        examinationId: id,
        candidateId: candidate.id,
        subjectCode: input.subjectCode,
      },
    },
    create: {
      ...scope(context),
      examinationId: id,
      candidateId: candidate.id,
      subjectCode: input.subjectCode,
      marks: input.score,
      recordedById: actorId,
    },
    update: { marks: input.score, recordedById: actorId },
  });
}
