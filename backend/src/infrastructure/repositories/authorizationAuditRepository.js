import prisma from '../orm/prismaClient.js';

const db = (tx) => tx ?? prisma;

/** Uses AuditLogin until the dedicated authorization audit model is introduced. */
export function record({ userId, event, metadata }, tx) {
  return db(tx).auditLogin.create({
    data: {
      userId,
      event: 'SESSION_REVOKED',
      metadata: { authorizationEvent: event, ...metadata },
    },
  });
}

export default { record };
