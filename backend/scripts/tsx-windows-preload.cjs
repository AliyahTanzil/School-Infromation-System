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
    timeout: 60000,
    windowsHide: true,
  });
  if (check.status !== 0) {
    throw new Error('Local WSL PostgreSQL is not ready. Start its postgresql service and retry.');
  }
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
