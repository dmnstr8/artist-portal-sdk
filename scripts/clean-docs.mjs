import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const docsDir = resolve(process.cwd(), 'docs');

try {
  await rm(docsDir, { recursive: true, force: true });
  console.log(`Removed ${docsDir}`);
} catch (error) {
  console.error('Failed to clean docs directory:', error);
  process.exitCode = 1;
}
