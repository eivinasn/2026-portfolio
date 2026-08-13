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
const scripts = new Set();
for (const file of files) {
  const html = await readFile(file, 'utf8');
  for (const [, body] of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) styles.add(sha(body));

  // Astro 4 hoisted every script to an external module, so script-src needed no
  // hashes. Astro 7 inlines small ones instead — which silently broke a
  // `script-src 'self'` policy and left 20 homepage blocks at opacity:0. Hash
  // whatever is actually inline rather than assuming either behaviour.
  //
  // `type="application/ld+json"` is a data block the browser never executes and
  // is not subject to script-src; verify-csp.mjs proves it.
  // Note the leading comma: matchAll yields [fullMatch, group1, group2].
  for (const [, tag, body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/\ssrc=/.test(tag)) continue;
    const type = tag.match(/type=["']([^"']+)["']/)?.[1] ?? '';
    if (type && !/^(module|text\/javascript|application\/javascript)$/.test(type)) continue;
    if (body.trim()) scripts.add(sha(body));
  }
}

// Analytics is inert unless armed (QUESTIONS.md Q13). When it is armed the CSP
// has to allow its origin, so the two are derived from the same env vars — a
// hand-edited CSP would silently block the very script it was armed for.
const ANALYTICS_ORIGINS = {
  cloudflare: {
    script: ['https://static.cloudflareinsights.com'],
    connect: ['https://cloudflareinsights.com']
  },
  plausible: { script: ['https://plausible.io'], connect: ['https://plausible.io'] },
  umami: { script: [], connect: [] } // self-hosted: origin comes from PUBLIC_ANALYTICS_HOST
};

const provider = process.env.PUBLIC_ANALYTICS_PROVIDER?.trim();
const host = process.env.PUBLIC_ANALYTICS_HOST?.trim();
const armed = Boolean(
  provider && process.env.PUBLIC_ANALYTICS_ID?.trim() && ANALYTICS_ORIGINS[provider]
);

const extraScript = armed ? [...ANALYTICS_ORIGINS[provider].script, ...(host ? [host] : [])] : [];
const extraConnect = armed ? [...ANALYTICS_ORIGINS[provider].connect, ...(host ? [host] : [])] : [];

// script-src needs no hashes: every executable script in the output is an
// external module (Astro hoists them), and `<script type="application/ld+json">`
// is a data block the browser never executes. verify-csp.mjs proves both.
const csp = [
  `default-src 'none'`,
  `base-uri 'self'`,
  `form-action 'none'`,
  `frame-ancestors 'none'`,
  [`script-src 'self'`, ...extraScript, ...[...scripts].sort()].join(' '),
  `style-src 'self' ${[...styles].sort().join(' ')}`,
  `font-src 'self'`,
  `img-src 'self' data:`,
  [`connect-src 'self'`, ...extraConnect].join(' '),
  `manifest-src 'self'`,
  `upgrade-insecure-requests`
].join('; ');

const template = await readFile(TEMPLATE, 'utf8');
if (!template.includes('__CSP__')) {
  console.error(`${TEMPLATE} has no __CSP__ placeholder.`);
  process.exit(1);
}
await writeFile(OUT, template.replace('__CSP__', csp));

console.log(`Wrote ${OUT}`);
console.log(`  scanned ${files.length} HTML file(s)`);
console.log(`  script-src hashes: ${scripts.size}`);
console.log(`  style-src hashes: ${styles.size}`);
console.log(`  analytics: ${armed ? `${provider} (CSP widened)` : 'not armed'}`);
[...styles].sort().forEach((h) => console.log(`    ${h}`));
