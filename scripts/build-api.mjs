import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiRoot = path.join(root, 'apps', 'api');
const outdir = path.join(apiRoot, 'dist');

await mkdir(outdir, { recursive: true });

await build({
  entryPoints: {
    uploads: path.join(apiRoot, 'src', 'handlers', 'uploads.ts'),
    'reviews-create': path.join(apiRoot, 'src', 'handlers', 'reviews-create.ts'),
    'reviews-get': path.join(apiRoot, 'src', 'handlers', 'reviews-get.ts'),
    'review-worker': path.join(apiRoot, 'src', 'handlers', 'review-worker.ts'),
    'review-synthesizer': path.join(apiRoot, 'src', 'handlers', 'review-synthesizer.ts')
  },
  bundle: true,
  format: 'esm',
  outdir,
  platform: 'node',
  target: 'node20',
  sourcemap: true,
  packages: 'bundle',
  outExtension: {
    '.js': '.mjs'
  }
});

await cp(path.join(root, 'prompts'), path.join(outdir, 'prompts'), {
  recursive: true
});
