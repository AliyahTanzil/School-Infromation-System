import roleRepository from '../../infrastructure/repositories/roleRepository.js';
import permissionRepository from '../../infrastructure/repositories/permissionRepository.js';
import auditRepository from '../../infrastructure/repositories/authorizationAuditRepository.js';
import authorizationService from './authorizationService.js';
import { ConflictError, NotFoundError } from '../../shared/errors/index.js';

const dto = (role) => ({
  id: role.id,
  code: role.code,
  name: role.name,
  description: role.description,
  isSystem: role.isSystem,
  isAssignable: role.isAssignable,
  permissions:
    role.permissions?.map(({ permission }) => ({
      id: permission.id,
      code: permission.code,
      name: permission.name,
    })) ?? [],
});

export async function list(input) {
  return (await roleRepository.list(input)).map(dto);
}
export async function get(id) {
  const role = await roleRepository.findById(id);
  if (!role) throw new NotFoundError('Role not found');
  return dto(role);
}
export async function create(input, actorId) {
  const existing = await roleRepository.findByCode(input.code);
  if (existing) throw new ConflictError('Role code already exists');
  const role = await roleRepository.create({ ...input, code: input.code.toUpperCase() });
  await auditRepository.record({
    userId: actorId,
    event: 'role.created',
    metadata: { roleId: role.id, after: input },
  });
  return get(role.id);
}
export async function update(id, input, actorId) {
  const role = await roleRepository.findById(id);
  if (!role) throw new NotFoundError('Role not found');
  if (role.isSystem && input.code && input.code !== role.code)
    throw new ConflictError('System role code cannot change');
  await roleRepository.update(id, input);
  authorizationService.invalidate();
  await auditRepository.record({
    userId: actorId,
    event: 'role.updated',
    metadata: { roleId: id, after: input },
  });
  return get(id);
}
export async function remove(id, actorId) {
  const role = await roleRepository.findById(id);
  if (!role) throw new NotFoundError('Role not found');
  if (role.isSystem) throw new ConflictError('ROLE_PROTECTED');
  await roleRepository.softDelete(id);
  authorizationService.invalidate();
  await auditRepository.record({
    userId: actorId,
    event: 'role.deleted',
    metadata: { roleId: id },
  });
}
export async function assignPermission(roleId, permissionId, actorId) {
  const [role, permission] = await Promise.all([
    roleRepository.findById(roleId),
    permissionRepository.findById(permissionId),
  ]);
  if (!role) throw new NotFoundError('Role not found');
  if (!permission) throw new NotFoundError('Permission not found');
  await roleRepository.assignPermission(roleId, permissionId, actorId);
  authorizationService.invalidate();
  await auditRepository.record({
    userId: actorId,
    event: 'permission.assigned',
    metadata: { roleId, permissionId },
  });
  return get(roleId);
}

export default { list, get, create, update, remove, assignPermission };
