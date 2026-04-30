import { access, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, '.env.example');
const targetPath = path.join(root, '.env');

try {
  await access(targetPath);
  console.log('.env already exists. No changes made.');
  process.exit(0);
} catch {
  await copyFile(sourcePath, targetPath);
  console.log('Created .env from .env.example');
  console.log('Review .env before starting local services.');
}
