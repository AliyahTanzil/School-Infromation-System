const os = require('node:os');

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
