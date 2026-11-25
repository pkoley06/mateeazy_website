import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const dist = resolve(root, 'dist');
mkdirSync(dist, { recursive: true });

// Keep a stub main.js so deploy/mateeazy-site-deploy's sanity check passes
writeFileSync(resolve(dist, 'main.js'), '/* mateeazy */\n');

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
