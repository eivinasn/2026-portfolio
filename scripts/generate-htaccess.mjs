// Writes dist/.htaccess from config/htaccess.template, injecting a CSP whose
// hashes match the build that was actually produced.
//
//   npm run generate:htaccess     (runs automatically after `npm run build`)
//
// Astro inlines a small CSS block whose contents change whenever the source CSS
// changes, so a hand-maintained hash list goes stale silently — and a stale
// style-src hash means the page ships unstyled. Computing it from dist/ is the
// only way it stays correct.
//
// Run `npm run verify:csp` afterwards. Do not assume a CSP works.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { glob } from 'node:fs/promises';

const TEMPLATE = 'config/htaccess.template';
const OUT = 'dist/.htaccess';

const files = [];
for await (const f of glob('dist/**/*.html')) files.push(f);
files.sort();

const sha = (s) => `'sha256-${createHash('sha256').update(s, 'utf8').digest('base64')}'`;

const styles = new Set();
for (const file of files) {
  const html = await readFile(file, 'utf8');
  for (const [, body] of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) styles.add(sha(body));
}

// script-src needs no hashes: every executable script in the output is an
// external module (Astro hoists them), and `<script type="application/ld+json">`
// is a data block the browser never executes. verify-csp.mjs proves both.
const csp = [
  `default-src 'none'`,
  `base-uri 'self'`,
  `form-action 'none'`,
  `frame-ancestors 'none'`,
  `script-src 'self'`,
  `style-src 'self' https://fonts.googleapis.com ${[...styles].sort().join(' ')}`,
  `font-src 'self' https://fonts.gstatic.com`,
  `img-src 'self' data:`,
  `connect-src 'self'`,
  `manifest-src 'self'`,
  `upgrade-insecure-requests`,
].join('; ');

const template = await readFile(TEMPLATE, 'utf8');
if (!template.includes('__CSP__')) {
  console.error(`${TEMPLATE} has no __CSP__ placeholder.`);
  process.exit(1);
}
await writeFile(OUT, template.replace('__CSP__', csp));

console.log(`Wrote ${OUT}`);
console.log(`  scanned ${files.length} HTML file(s)`);
console.log(`  style-src hashes: ${styles.size}`);
[...styles].sort().forEach((h) => console.log(`    ${h}`));
