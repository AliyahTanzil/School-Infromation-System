import prisma from '../../infrastructure/orm/prismaClient.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';

const ACTIVATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function requireOwner(ownerUserId) {
  const owner = await prisma.user.findUnique({ where: { id: ownerUserId } });
  if (!owner || owner.accountType !== 'APPLICATION_MANAGER' || owner.platformRole !== 'OWNER') {
    throw new AuthorizationError('Only an application owner can manage activation requests');
  }
  return owner;
}

export async function createRequest({
  userId,
  email,
  firstName,
  lastName,
  designation,
  ownerUserId,
}) {
  const owner = await requireOwner(ownerUserId);
  const expiresAt = new Date(Date.now() + ACTIVATION_TTL_MS);
  await prisma.activationRequest.create({
    data: {
      userId,
      ownerUserId,
      email,
      firstName,
      lastName,
      designation,
      expiresAt,
    },
  });
  return { ownerEmail: owner.email, expiresAt };
}

export async function listPending(ownerUserId) {
  await requireOwner(ownerUserId);
  return prisma.activationRequest.findMany({
    where: { ownerUserId, status: 'PENDING', expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function decide({ ownerUserId, requestId, decision }) {
  await requireOwner(ownerUserId);
  const status = decision === 'approve' ? 'APPROVED' : 'REJECTED';
  return prisma.$transaction(async (tx) => {
    const changed = await tx.activationRequest.updateMany({
      where: { id: requestId, ownerUserId, status: 'PENDING', expiresAt: { gt: new Date() } },
      data: { status, decidedAt: new Date() },
    });
    if (!changed.count) throw new NotFoundError('Activation request not found or expired');
    const request = await tx.activationRequest.findFirst({
      where: { id: requestId, ownerUserId },
    });
    if (status === 'APPROVED') {
      const activated = await tx.user.updateMany({
        where: {
          id: request.userId,
          status: 'PENDING_VERIFICATION',
          deletedAt: null,
        },
        data: { status: 'ACTIVE', emailVerifiedAt: new Date() },
      });
      if (!activated.count) {
        throw new NotFoundError('Applicant is no longer awaiting activation');
      }
    }
    return { status, userId: request.userId };
  });
}

// Development verification mail is emitted through the configured email logger;
// there is no separate database outbox in the active schema.
export async function outbox(ownerUserId) {
  await requireOwner(ownerUserId);
  return [];
}

export default { createRequest, listPending, decide, outbox };
