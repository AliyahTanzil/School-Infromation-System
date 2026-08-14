import prisma from '../../infrastructure/orm/prismaClient.js';
import { generateOpaqueToken, hashToken } from '../../shared/utils/tokenUtils.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';

const ACTIVATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function requireOwner(ownerUserId) {
  const owner = await prisma.user.findUnique({ where: { id: ownerUserId } });
  if (!owner || owner.accountType !== 'APPLICATION_MANAGER') {
    throw new AuthorizationError('Only an application owner can manage activation requests');
  }
  return owner;
}

export async function createRequest({ userId, email, firstName, lastName, designation, ownerUserId }) {
  const token = generateOpaqueToken(32);
  const expiresAt = new Date(Date.now() + ACTIVATION_TTL_MS);
  const tokenHash = hashToken(token);
  await prisma.$executeRaw`
    INSERT INTO "UserActivationRequest" ("userId", "ownerUserId", "activationTokenHash", "expiresAt")
    VALUES (${userId}::uuid, ${ownerUserId}::uuid, ${tokenHash}, ${expiresAt})
  `;
  await prisma.$executeRaw`
    INSERT INTO "DevelopmentEmailOutbox" ("toEmail", "subject", "template", "payload")
    VALUES (${email}, ${'Tenant user activation request'}, ${'tenant-activation'}, ${JSON.stringify({ userId, firstName, lastName, designation, activationToken: token })}::jsonb)
  `;
  return { ownerEmail: (await requireOwner(ownerUserId)).email, expiresAt };
}

export async function listPending(ownerUserId) {
  await requireOwner(ownerUserId);
  return prisma.$queryRaw`
    SELECT r."id", r."userId", r."ownerUserId", r."status", r."expiresAt", r."createdAt",
           u."email", p."firstName", p."lastName"
    FROM "UserActivationRequest" r
    JOIN "User" u ON u."id" = r."userId"
    LEFT JOIN "UserProfile" p ON p."userId" = r."userId"
    WHERE r."ownerUserId" = ${ownerUserId}::uuid AND r."status" = 'PENDING'
    ORDER BY r."createdAt" DESC
  `;
}

export async function decide({ ownerUserId, requestId, decision }) {
  await requireOwner(ownerUserId);
  const rows = await prisma.$queryRaw`
    SELECT "id", "userId" FROM "UserActivationRequest"
    WHERE "id" = ${requestId}::uuid AND "ownerUserId" = ${ownerUserId}::uuid AND "status" = 'PENDING'
    LIMIT 1
  `;
  const request = rows[0];
  if (!request) throw new NotFoundError('Activation request not found');
  const status = decision === 'approve' ? 'APPROVED' : 'REJECTED';
  await prisma.$executeRaw`
    UPDATE "UserActivationRequest"
    SET "status" = ${status}, "activatedAt" = CASE WHEN ${status} = 'APPROVED' THEN CURRENT_TIMESTAMP ELSE NULL END,
        "rejectedAt" = CASE WHEN ${status} = 'REJECTED' THEN CURRENT_TIMESTAMP ELSE NULL END,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${requestId}::uuid
  `;
  if (status === 'APPROVED') {
    await prisma.user.update({ where: { id: request.userId }, data: { status: 'ACTIVE', emailVerifiedAt: new Date() } });
  }
  return { status, userId: request.userId };
}

export async function outbox(ownerUserId) {
  await requireOwner(ownerUserId);
  return prisma.$queryRaw`
    SELECT "id", "toEmail", "subject", "template", "payload", "createdAt", "readAt"
    FROM "DevelopmentEmailOutbox" ORDER BY "createdAt" DESC LIMIT 100
  `;
}

export default { createRequest, listPending, decide, outbox };
