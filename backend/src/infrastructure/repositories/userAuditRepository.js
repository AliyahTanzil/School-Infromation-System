import prisma from '../orm/prismaClient.js';

export function create(data, tx) {
  return (tx ?? prisma).userAudit.create({ data });
}
export function listForSubject(subjectId, take = 50, tx) {
  return (tx ?? prisma).userAudit.findMany({
    where: { subjectId },
    orderBy: { createdAt: 'desc' },
    take,
  });
}
export default { create, listForSubject };
