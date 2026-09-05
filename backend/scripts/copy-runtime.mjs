import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function copyRuntime(source, destination) {
  const entries = await readdir(source, { withFileTypes: true });
  const names = new Set(entries.map((entry) => entry.name));
  await mkdir(destination, { recursive: true });

  for (const entry of entries) {
    const sourcePath = join(source, entry.name);
    const destinationPath = join(destination, entry.name);
    if (entry.isDirectory()) {
      await copyRuntime(sourcePath, destinationPath);
    } else if (entry.isFile() && ['.js', '.mjs', '.cjs', '.json'].includes(extname(entry.name))) {
      // TypeScript owns app.js, main.js, and foundation/app.js in the build.
      const typescriptExtension = { '.js': '.ts', '.mjs': '.mts', '.cjs': '.cts' }[
        extname(entry.name)
      ];
      if (
        typescriptExtension &&
        names.has(entry.name.slice(0, -extname(entry.name).length) + typescriptExtension)
      ) {
        continue;
      }
      await copyFile(sourcePath, destinationPath);
    }
  }
}

await copyRuntime(join(backendRoot, 'src'), join(backendRoot, 'dist'));
