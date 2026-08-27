import prisma from '../../infrastructure/orm/prismaClient.js';
import {
  assertExaminationTransition,
  assertMarkWritable,
  assertScore,
} from '../../domain/examinationLifecycle.js';

const VALID_STATUSES = new Set(['DRAFT', 'OPEN', 'CLOSED', 'LOCKED']);
const validateScope = ({ tenantId, schoolId }) => {
  if (!tenantId || !schoolId) throw new Error('School context is required');
};
const validateId = (value, label) => {
  if (!/^[0-9a-f-]{36}$/i.test(String(value || ''))) throw new Error(`${label} is invalid`);
};

export async function listExaminations({ tenantId, schoolId, status }) {
  validateScope({ tenantId, schoolId });
  if (status && !VALID_STATUSES.has(status)) throw new Error('Invalid examination status');
  return prisma.$queryRaw`
    SELECT id, "tenantId", "schoolId", name, code, status, "createdById", "lockedAt", "createdAt", "updatedAt"
    FROM "Examination" WHERE "tenantId" = ${tenantId}::uuid AND "schoolId" = ${schoolId}::uuid
    ${status ? prisma.$queryRaw`AND status = ${status}` : prisma.$queryRaw``}
    ORDER BY "createdAt" DESC`;
}

export async function createExamination({ tenantId, schoolId, name, code, createdById }) {
  validateScope({ tenantId, schoolId });
  if (!name?.trim() || !code?.trim()) throw new Error('Name and code are required');
  return prisma.$queryRaw`
    INSERT INTO "Examination" ("tenantId", "schoolId", name, code, "createdById")
    VALUES (${tenantId}::uuid, ${schoolId}::uuid, ${name.trim()}, ${code.trim()}, ${createdById || null}::uuid)
    RETURNING *`;
}

export async function getExamination({ id, tenantId, schoolId }) {
  validateScope({ tenantId, schoolId });
  validateId(id, 'Examination id');
  const rows =
    await prisma.$queryRaw`SELECT * FROM "Examination" WHERE id = ${id}::uuid AND "tenantId" = ${tenantId}::uuid AND "schoolId" = ${schoolId}::uuid`;
  if (!rows[0]) throw new Error('Examination not found');
  const [candidates, schedules, marks] = await Promise.all([
    prisma.$queryRaw`SELECT * FROM "ExaminationCandidate" WHERE "examinationId" = ${id}::uuid AND "tenantId" = ${tenantId}::uuid AND "schoolId" = ${schoolId}::uuid`,
    prisma.$queryRaw`SELECT * FROM "ExaminationSchedule" WHERE "examinationId" = ${id}::uuid AND "tenantId" = ${tenantId}::uuid AND "schoolId" = ${schoolId}::uuid`,
    prisma.$queryRaw`SELECT * FROM "ExaminationMark" WHERE "examinationId" = ${id}::uuid AND "tenantId" = ${tenantId}::uuid AND "schoolId" = ${schoolId}::uuid`,
  ]);
  return { ...rows[0], candidates, schedules, marks };
}

export async function changeStatus({ id, tenantId, schoolId, status, actorId }) {
  validateScope({ tenantId, schoolId });
  validateId(id, 'Examination id');
  if (!VALID_STATUSES.has(status)) throw new Error('Invalid examination status');
  const current =
    await prisma.$queryRaw`SELECT status FROM "Examination" WHERE id = ${id}::uuid AND "tenantId" = ${tenantId}::uuid AND "schoolId" = ${schoolId}::uuid`;
  if (!current[0]) throw new Error('Examination not found');
  assertExaminationTransition(current[0].status, status);
  return prisma.$transaction(async (tx) => {
    const updated =
      await tx.$queryRaw`UPDATE "Examination" SET status = ${status}, "lockedAt" = ${status === 'LOCKED' ? new Date() : null}, "updatedAt" = now() WHERE id = ${id}::uuid AND "tenantId" = ${tenantId}::uuid AND "schoolId" = ${schoolId}::uuid RETURNING *`;
    await tx.$queryRaw`INSERT INTO "ExaminationAudit" ("tenantId", "schoolId", "examinationId", "actorId", action, metadata) VALUES (${tenantId}::uuid, ${schoolId}::uuid, ${id}::uuid, ${actorId || null}::uuid, 'STATUS_CHANGED', ${JSON.stringify({ from: current[0].status, to: status })}::jsonb)`;
    return updated[0];
  });
}

export async function upsertMark({
  id,
  tenantId,
  schoolId,
  candidateId,
  subjectCode,
  marks,
  score,
  maxScore,
  actorId,
}) {
  validateScope({ tenantId, schoolId });
  validateId(id, 'Examination id');
  validateId(candidateId, 'Candidate id');
  const numericScore = Number(marks ?? score);
  const maximum = Number(maxScore ?? 100);
  if (!subjectCode?.trim() || !Number.isFinite(numericScore) || !Number.isFinite(maximum))
    throw new Error('Subject and numeric marks are required');
  const exam =
    await prisma.$queryRaw`SELECT status FROM "Examination" WHERE id = ${id}::uuid AND "tenantId" = ${tenantId}::uuid AND "schoolId" = ${schoolId}::uuid`;
  if (!exam[0]) throw new Error('Examination not found');
  const candidate =
    await prisma.$queryRaw`SELECT id FROM "ExaminationCandidate" WHERE id = ${candidateId}::uuid AND "examinationId" = ${id}::uuid AND "tenantId" = ${tenantId}::uuid AND "schoolId" = ${schoolId}::uuid`;
  if (!candidate[0]) throw new Error('Candidate not found in examination');
  assertMarkWritable(exam[0].status, null);
  assertScore(numericScore, maximum);
  const result =
    await prisma.$queryRaw`INSERT INTO "ExaminationMark" ("tenantId", "schoolId", "examinationId", "candidateId", "subjectCode", marks, "recordedById") VALUES (${tenantId}::uuid, ${schoolId}::uuid, ${id}::uuid, ${candidateId}::uuid, ${subjectCode.trim()}, ${numericScore}, ${actorId || null}::uuid) ON CONFLICT ("examinationId", "candidateId", "subjectCode") DO UPDATE SET marks = EXCLUDED.marks, "recordedById" = EXCLUDED."recordedById", "updatedAt" = now() RETURNING *`;
  return result[0];
}
