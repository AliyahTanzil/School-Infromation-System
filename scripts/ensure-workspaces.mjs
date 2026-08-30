import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const thisFile = fileURLToPath(import.meta.url);
const root = resolve(dirname(thisFile), '..');
const backend = resolve(root, 'backend');

function canResolveFrom(directory, specifier) {
  try {
    const require = createRequire(resolve(directory, 'package.json'));
    require.resolve(specifier);
    return true;
  } catch {
    return false;
  }
}

function workspaceIsReady() {
  const requiredBackendPackages = ['express', 'cookie-parser', 'tsx', '@prisma/client'];

  const packagesReady = requiredBackendPackages.every((pkg) => canResolveFrom(backend, pkg));

  const backendWorkspaceReady = existsSync(
    resolve(root, 'node_modules', 'sais-backend', 'package.json')
  );

  return packagesReady && backendWorkspaceReady;
}

export function ensureWorkspaceDependencies() {
  if (workspaceIsReady()) {
    return;
  }

  console.warn(
    '[sais] Backend workspace dependencies are incomplete. Repairing monorepo installation...'
  );

  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npmCommand, ['install', '--workspaces', '--include-workspace-root'], {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error(`[sais] Workspace repair failed with exit code ${result.status ?? 'unknown'}.`);
  }

  if (!workspaceIsReady()) {
    throw new Error(
      '[sais] Workspace installation completed but required backend dependencies are still unavailable.'
    );
  }

  console.log('[sais] Workspace dependencies repaired.');
}

if (process.argv[1] && resolve(process.argv[1]) === thisFile) {
  try {
    ensureWorkspaceDependencies();
    console.log('[sais] Workspace dependencies ready.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
