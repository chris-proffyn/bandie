import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targetDir = path.join(root, 'apps/web/.netlify');
const targetFile = path.join(targetDir, 'package.json');

await mkdir(targetDir, { recursive: true });
await writeFile(
  targetFile,
  `${JSON.stringify({ private: true, type: 'commonjs' }, null, 2)}\n`,
);

console.log('Ensured Netlify dev functions use CommonJS (apps/web/.netlify/package.json)');
