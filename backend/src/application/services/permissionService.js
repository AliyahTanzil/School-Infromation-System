import permissionRepository from '../../infrastructure/repositories/permissionRepository.js';

const dto = (permission) => ({
  id: permission.id,
  code: permission.code,
  name: permission.name,
  description: permission.description,
  effect: permission.effect,
  isSystem: permission.isSystem,
  group: permission.permissionGroup
    ? { key: permission.permissionGroup.key, name: permission.permissionGroup.name }
    : undefined,
});
export async function list(input) {
  return (await permissionRepository.list(input)).map(dto);
}
export async function getCatalog(input) {
  return list(input);
}
export default { list, getCatalog };
