// Serves dist/ with the real headers from dist/.htaccess and checks that
// nothing is blocked.
//
//   npm run verify:csp
//
// The plan's instruction is explicit: verify the CSP by serving the built
// output with the real header and checking for violations — do not assume it
// works. A CSP that blocks the reveal script leaves ~20 blocks of the homepage
// at opacity:0, and a CSP that blocks the inlined style block ships the case
// studies unstyled. Neither shows up in a build log.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const DIST = 'dist';
const PORT = 4399;
const BASE = `http://localhost:${PORT}`;
const PAGES = ['/', '/work/dexcom/', '/work/nfq/', '/work/vinted/', '/work/vmi/', '/404.html'];

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf'
};

// Pull the `Header always set NAME "VALUE"` lines straight out of the generated
// .htaccess, so this tests what will actually ship rather than a copy of it.
const htaccess = await readFile(join(DIST, '.htaccess'), 'utf8');
const headers = {};
// Only the unscoped headers. Anything inside a <FilesMatch> applies to a subset
// of responses, so hoisting it here would test a policy that never ships.
let depth = 0;
for (const line of htaccess.split('\n')) {
  if (/^\s*<FilesMatch/i.test(line)) depth += 1;
  else if (/^\s*<\/FilesMatch>/i.test(line)) depth -= 1;
  else if (depth === 0) {
    const m = line.match(/^\s*Header always set (\S+)\s+"([^"]*)"/);
    if (m) headers[m[1]] = m[2];
  }
}
if (!headers['Content-Security-Policy']) {
  console.error('No CSP found in dist/.htaccess — run `npm run generate:htaccess` first.');
  process.exit(1);
}
console.log('Headers being applied:');
for (const [k, v] of Object.entries(headers)) {
  console.log(`  ${k}: ${v.length > 110 ? v.slice(0, 110) + '…' : v}`);
}

const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, BASE).pathname);
  if (path.endsWith('/')) path += 'index.html';
  const file = join(DIST, normalize(path).replace(/^(\.\.[/\\])+/, ''));
  try {
    const body = await readFile(file);
    res.writeHead(200, {
      ...headers,
      'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream'
    });
    res.end(body);
  } catch {
    const body = await readFile(join(DIST, '404.html')).catch(() => 'Not found');
    res.writeHead(404, { ...headers, 'Content-Type': 'text/html; charset=utf-8' });
    res.end(body);
  }
});
await new Promise((r) => server.listen(PORT, r));

const browser = await chromium.launch();
let failures = 0;

console.log('\n== CSP violations, console errors, blocked requests ==');
for (const path of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const violations = [];
  const errors = [];
  const blocked = [];

  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__cspViolations.push(`${e.violatedDirective} blocked ${e.blockedURI || 'inline'}`);
    });
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('requestfailed', (r) => blocked.push(`${r.url()} — ${r.failure()?.errorText}`));

  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(900);

  violations.push(...(await page.evaluate(() => window.__cspViolations ?? [])));

  // The proof that the CSP did not break anything user-visible: JS still ran,
  // so nothing is stranded at opacity:0, and the stylesheet still applied.
  const state = await page.evaluate(() => {
    const els = [...document.querySelectorAll('.reveal-on-scroll,.reveal-opacity-only')];
    return {
      stranded: els.filter((e) => getComputedStyle(e).opacity === '0').length,
      styled: getComputedStyle(document.body).backgroundColor
    };
  });
  const stylesApplied = state.styled === 'rgb(5, 5, 5)';

  const ok =
    !violations.length && !errors.length && !blocked.length && !state.stranded && stylesApplied;
  if (!ok) failures += 1;
  console.log(
    `  ${ok ? 'PASS' : 'FAIL'}  ${path} — violations=${violations.length} errors=${errors.length} ` +
      `blocked=${blocked.length} stranded=${state.stranded} styled=${stylesApplied}`
  );
  violations.slice(0, 5).forEach((v) => console.log(`        CSP: ${v}`));
  errors.slice(0, 3).forEach((e) => console.log(`        ERR: ${e}`));
  blocked.slice(0, 3).forEach((b) => console.log(`        NET: ${b}`));
  await ctx.close();
}

await browser.close();
server.close();

console.log(
  `\n${failures === 0 ? 'CSP VERIFIED — nothing blocked' : `${failures} PAGE(S) FAILED`}\n`
);
process.exit(failures === 0 ? 0 : 1);
