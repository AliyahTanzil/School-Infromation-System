import { ExaminationStatus, MarkStatus } from '@prisma/client';
import {
  assertExaminationTransition,
  assertMarkWritable,
  assertScore,
} from '../../domain/examinationLifecycle.js';
import prisma from '../../infrastructure/orm/prismaClient.js';

export async function listExaminations({ tenantId, schoolId, status }) {
  return prisma.examination.findMany({
    where: { tenantId, schoolId, ...(status ? { status } : {}) },
    orderBy: { createdAt: 'desc' },
    include: {
      period: true,
      _count: { select: { candidates: true, schedules: true, marks: true } },
    },
  });
}

export async function createExamination({ tenantId, schoolId, ...data }) {
  return prisma.examination.create({ data: { tenantId, schoolId, ...data } });
}

export async function getExamination({ id, tenantId, schoolId }) {
  const exam = await prisma.examination.findFirst({
    where: { id, tenantId, schoolId },
    include: {
      period: true,
      candidates: { include: { student: { include: { profile: true } } } },
      schedules: { include: { class: true } },
      marks: true,
    },
  });
  if (!exam) throw new Error('Examination not found');
  return exam;
}

export async function changeStatus({ id, tenantId, schoolId, status, actorId }) {
  const current = await prisma.examination.findFirst({ where: { id, tenantId, schoolId } });
  if (!current) throw new Error('Examination not found');
  assertExaminationTransition(current.status, status);
  return prisma.$transaction(async (tx) => {
    const exam = await tx.examination.update({
      where: { id },
      data: { status, lockedAt: status === ExaminationStatus.LOCKED ? new Date() : undefined },
    });
    await tx.examinationAudit.create({
      data: {
        tenantId,
        schoolId,
        examinationId: id,
        actorId,
        action: 'STATUS_CHANGED',
        metadata: { from: current.status, to: status },
      },
    });
    return exam;
  });
}

export async function upsertMark({
  id,
  tenantId,
  schoolId,
  score,
  maxScore,
  subjectCode,
  studentId,
}) {
  const exam = await prisma.examination.findFirst({ where: { id, tenantId, schoolId } });
  if (!exam) throw new Error('Examination not found');
  const existing = await prisma.examinationMark.findUnique({
    where: { examinationId_studentId_subjectCode: { examinationId: id, studentId, subjectCode } },
  });
  assertMarkWritable(exam.status, existing?.status);
  assertScore(score, maxScore);
  return prisma.examinationMark.upsert({
    where: { examinationId_studentId_subjectCode: { examinationId: id, studentId, subjectCode } },
    create: {
      tenantId,
      schoolId,
      examinationId: id,
      studentId,
      subjectCode,
      score,
      maxScore,
      status: MarkStatus.DRAFT,
    },
    update: { score, maxScore, status: MarkStatus.DRAFT },
  });
}
