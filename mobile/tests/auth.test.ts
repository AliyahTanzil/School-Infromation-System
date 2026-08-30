import { rolePath } from '../services/auth/state';

const roleTests: Array<[string, string]> = [
  ['owner', '/administrator'],
  ['tenant', '/administrator'],
  ['administrator', '/administrator'],
  ['staff', '/staff'],
];

for (const [role, expectedPath] of roleTests) {
  if (rolePath(role) !== expectedPath) throw new Error(`Unexpected role path for ${role}`);
}
