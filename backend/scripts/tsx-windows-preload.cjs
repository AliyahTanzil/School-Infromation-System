const os = require('node:os');
const path = require('node:path');

// Opt-in for a local PostgreSQL installation in WSL. Systemd services alone
// do not keep WSL alive; hold stdin open while this development backend runs.
if (
  process.platform === 'win32' &&
  process.env.SAIS_WSL_DATABASE &&
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__dirname, '../src/main.ts')
) {
  const { spawn, spawnSync } = require('node:child_process');
  const distribution = process.env.SAIS_WSL_DATABASE;
  console.log(`[SAIS] Checking PostgreSQL in WSL distribution ${distribution}...`);
  const keeper = spawn('wsl.exe', ['-d', distribution, '--', 'cat'], {
    stdio: ['pipe', 'ignore', 'inherit'],
    windowsHide: true,
  });
  keeper.on('error', (error) =>
    console.error('[SAIS] WSL database startup failed:', error.message)
  );
  keeper.stdin.on('error', () => {});
  keeper.stdin.unref();
  keeper.unref();
  process.once('exit', () => keeper.stdin.destroy());
  const check = spawnSync('wsl.exe', ['-d', distribution, '--', 'pg_isready'], {
    stdio: 'ignore',
    timeout: 30000,
    windowsHide: true,
  });
  if (check.status !== 0) {
    keeper.stdin.destroy();
    throw new Error(
      'Local WSL PostgreSQL is not ready' +
        (check.error?.code === 'ETIMEDOUT' ? ' (WSL check timed out after 30 seconds)' : '') +
        '. Start PostgreSQL in the configured WSL distribution and retry. See docs/RUNBOOK.md, step 5.'
    );
  }
  console.log('[SAIS] WSL PostgreSQL is ready.');
}

try {
  os.userInfo();
} catch (error) {
  if (process.platform !== 'win32' || error?.code !== 'ERR_SYSTEM_ERROR') throw error;

  const username = process.env.USERNAME || 'sais-runner';
  os.userInfo = () => ({
    uid: -1,
    gid: -1,
    username,
    homedir: process.env.USERPROFILE || os.tmpdir(),
    shell: null,
  });
}
