import { gzipSync } from 'node:zlib';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const distDir = path.join(root, 'apps', 'api', 'dist');
const outputDir = path.join(root, 'build');

async function collectFiles(currentDir, baseDir = currentDir) {
  const entries = await readdir(currentDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(fullPath, baseDir));
    } else {
      files.push(path.relative(baseDir, fullPath));
    }
  }

  return files;
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

const files = await collectFiles(distDir);
const manifest = [];

for (const file of files) {
  const fullPath = path.join(distDir, file);
  const content = await readFile(fullPath);
  const details = await stat(fullPath);
  manifest.push({ file, size: details.size, body: content.toString('base64') });
}

const archivePath = path.join(outputDir, 'api-artifact.json.gz');
const archiveContent = gzipSync(Buffer.from(JSON.stringify({ createdAt: new Date().toISOString(), files: manifest })));
await writeFile(archivePath, archiveContent);

await writeFile(path.join(outputDir, 'README.txt'), 'Artifact payload stored as api-artifact.json.gz');
