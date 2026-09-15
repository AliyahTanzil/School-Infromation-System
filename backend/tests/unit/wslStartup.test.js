import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const preload = new URL('../../scripts/tsx-windows-preload.cjs', import.meta.url);
const source = readFileSync(preload, 'utf8');
const directory = path.dirname(fileURLToPath(preload));

for (const timedOut of [false, true]) {
  test(`WSL preload reports readiness and bounds its probe (timeout: ${timedOut})`, () => {
    let destroyed = false;
    let options;
    const messages = [];
    const keeper = {
      on() {},
      unref() {},
      stdin: {
        on() {},
        unref() {},
        destroy() {
          destroyed = true;
        },
      },
    };
    const context = {
      __dirname: directory,
      console: { log: (message) => messages.push(message), error() {} },
      process: {
        platform: 'win32',
        env: { SAIS_WSL_DATABASE: 'Ubuntu' },
        argv: ['node', path.resolve(directory, '../src/main.ts')],
        once() {},
      },
      require(name) {
        if (name === 'node:path') return path;
        if (name === 'node:os') return { userInfo: () => ({}) };
        if (name === 'node:child_process')
          return {
            spawn: () => keeper,
            spawnSync(_command, args, suppliedOptions) {
              assert.deepEqual(Array.from(args), ['-d', 'Ubuntu', '--', 'pg_isready']);
              options = suppliedOptions;
              return timedOut ? { status: null, error: { code: 'ETIMEDOUT' } } : { status: 0 };
            },
          };
        throw new Error(`Unexpected module ${name}`);
      },
    };
    const run = () => vm.runInNewContext(source, context);
    if (timedOut) {
      assert.throws(run, /WSL check timed out after 30 seconds/);
      assert.equal(destroyed, true);
    } else {
      run();
      assert.equal(messages.at(-1), '[SAIS] WSL PostgreSQL is ready.');
      assert.equal(destroyed, false);
    }
    assert.equal(options.timeout, 30000);
    assert.equal(options.windowsHide, true);
  });
}
