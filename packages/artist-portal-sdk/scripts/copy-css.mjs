import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';

const srcRoot = resolve('src');
const distRoot = resolve('dist');

if (!existsSync(srcRoot)) process.exit(0);

function copyCssFiles(directory) {
  for (const entry of readdirSync(directory)) {
    const sourcePath = resolve(directory, entry);
    const stats = statSync(sourcePath);
    if (stats.isDirectory()) {
      copyCssFiles(sourcePath);
      continue;
    }
    if (!sourcePath.endsWith('.css')) continue;

    const relativePath = relative(srcRoot, sourcePath);
    const destinationPath = resolve(distRoot, relativePath);
    mkdirSync(dirname(destinationPath), { recursive: true });
    copyFileSync(sourcePath, destinationPath);
  }
}

copyCssFiles(srcRoot);
