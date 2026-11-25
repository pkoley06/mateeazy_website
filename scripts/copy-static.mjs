import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const dist = resolve(root, 'dist');
mkdirSync(dist, { recursive: true });

const entries = [
  '.well-known',
  'assets',
  'favicon.svg',
  'robots.txt',
  'sitemap.xml',
];

for (const entry of entries) {
  const src = resolve(root, entry);
  const dest = resolve(dist, entry);
  if (existsSync(src)) {
    cpSync(src, dest, { recursive: true });
  }
}

console.log('Copied static assets to dist/');
