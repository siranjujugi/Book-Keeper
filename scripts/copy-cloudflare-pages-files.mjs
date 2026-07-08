import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = ['_headers', '_redirects', 'favicon.svg', 'favicon.png', 'favicon-64.png', 'favicon-180.png', 'favicon-192.png', 'logo.svg'];
const distDir = path.join(root, 'expo-app', 'dist');

for (const file of files) {
  const source = path.join(root, 'expo-app', 'public', file);
  const target = path.join(distDir, file);

  if (!fs.existsSync(source)) {
    throw new Error(`Missing web asset: ${source}`);
  }

  if (!fs.existsSync(path.dirname(target))) {
    throw new Error(`Build output does not exist: ${path.dirname(target)}`);
  }

  fs.copyFileSync(source, target);
}

const indexPath = path.join(distDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  throw new Error(`Build output does not include index.html: ${indexPath}`);
}

const faviconMarkup = [
  '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />',
  '<link rel="icon" type="image/png" sizes="64x64" href="/favicon-64.png" />',
  '<link rel="apple-touch-icon" sizes="180x180" href="/favicon-180.png" />',
  '<link rel="shortcut icon" href="/favicon.png" />'
].join('\n    ');

const html = fs.readFileSync(indexPath, 'utf8');
if (!html.includes('href="/favicon.svg"')) {
  fs.writeFileSync(indexPath, html.replace('</head>', `    ${faviconMarkup}\n  </head>`));
}

console.log(`Prepared web distribution files: ${files.join(', ')}`);
