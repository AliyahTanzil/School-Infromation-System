import prisma from '../../infrastructure/orm/prismaClient.js';
import repo from '../../infrastructure/repositories/schoolRepository.js';
import { ConflictError, NotFoundError } from '../../shared/errors/index.js';
const normalize = (v) => v.trim().toLowerCase();
const getUmbrellaTenantCode = () =>
  (process.env.SINGLE_SCHOOL_CODE || process.env.SINGLE_SCHOOL_UMBRELLA_CODE || 'UMBRELLA')
    .trim()
    .toUpperCase();
const getUmbrellaTenantName = () =>
  process.env.SINGLE_SCHOOL_NAME?.trim() ||
  process.env.SINGLE_SCHOOL_UMBRELLA_NAME?.trim() ||
  'Umbrella School';
const dto = (school) => school && { ...school, slug: school.code };
const schoolData = ({ name, slug, email, phone, website }) => ({
  ...(name !== undefined ? { name } : {}),
  ...(slug !== undefined ? { code: slug } : {}),
  ...(email !== undefined ? { email } : {}),
  ...(phone !== undefined ? { phone } : {}),
  ...(website !== undefined ? { website } : {}),
});
const ensure = async (id, tenantId, tx) => {
  const school = await repo.find(id, tenantId, tx);
  if (!school) throw new NotFoundError('School not found');
  return school;
};
const resolveTenantId = async (requestedTenantId, tx = prisma) => {
  if (requestedTenantId) return requestedTenantId;

  const code = getUmbrellaTenantCode();
  const tenant = await tx.tenant.findFirst({
    where: { code, deletedAt: null },
    select: { id: true },
  });

  if (tenant) return tenant.id;

  const created = await tx.tenant.create({
    data: {
      name: getUmbrellaTenantName(),
      code,
      timezone: process.env.SINGLE_SCHOOL_TIMEZONE || 'UTC',
      currency: process.env.SINGLE_SCHOOL_CURRENCY || 'USD',
      status: 'ACTIVE',
    },
    select: { id: true },
  });

  return created.id;
};
export async function list(input) {
  const result = await repo.list(input);
  return { ...result, items: result.items.map(dto) };
}
export async function get(id, tenantId) {
  return dto(await ensure(id, tenantId));
}
export async function create(input) {
  return prisma.$transaction(async (tx) => {
    const tenantId = await resolveTenantId(input.tenantId, tx);
    const data = { ...schoolData(input), tenantId };
    const existing = await tx.school.findFirst({
      where: {
        tenantId,
        OR: [{ code: input.slug }, { name: { equals: input.name, mode: 'insensitive' } }],
      },
    });
    if (existing) throw new ConflictError('School name or slug already exists');
    return dto(await repo.create(data, tx));
  });
}
export async function update(id, tenantId, input) {
  await ensure(id, tenantId);
  return dto(await repo.update(id, tenantId, schoolData(input)));
}
export async function remove(id, tenantId) {
  await ensure(id, tenantId);
  return dto(await repo.remove(id, tenantId));
}
export async function children(model, schoolId, tenantId) {
  await ensure(schoolId, tenantId);
  return repo.listChildren(model, schoolId);
}
export async function addChild(model, schoolId, tenantId, input) {
  await ensure(schoolId, tenantId);
  return repo.createChild(model, {
    ...input,
    tenantId,
    schoolId,
    normalizedName: normalize(input.name),
    ...(model === 'gradeLevel' && { displayOrder: input.displayOrder ?? 0 }),
  });
}
export async function updateChild(model, id, schoolId, tenantId, input) {
  await ensure(schoolId, tenantId);
  const result = await repo.updateChild(model, id, schoolId, {
    ...input,
    ...(input.name ? { normalizedName: normalize(input.name) } : {}),
  });
  if (!result.count) throw new NotFoundError('Resource not found');
  return repo.findChild(model, id, schoolId);
}
export async function deleteChild(model, id, schoolId, tenantId) {
  await ensure(schoolId, tenantId);
  const result = await repo.deleteChild(model, id, schoolId);
  if (!result.count) throw new NotFoundError('Resource not found');
  return { deleted: true };
}
export async function admins(schoolId, tenantId) {
  await ensure(schoolId, tenantId);
  return repo.listAdmins(schoolId);
}
export async function assignAdmin(schoolId, tenantId, input, assignedBy) {
  await ensure(schoolId, tenantId);
  return repo.assignAdmin({ ...input, schoolId, tenantId, assignedBy });
}
export async function revokeAdmin(schoolId, userId, tenantId) {
  await ensure(schoolId, tenantId);
  await repo.revokeAdmin(schoolId, userId);
  return { revoked: true };
}
export default {
  list,
  get,
  create,
  update,
  remove,
  children,
  addChild,
  updateChild,
  deleteChild,
  admins,
  assignAdmin,
  revokeAdmin,
};
