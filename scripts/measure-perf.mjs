// Measures real page weight and Core Web Vitals against the budgets in
// CLAUDE.md §4.
//
//   npm run measure:perf
//
// Serves dist/ with gzip on text assets so the numbers are comparable to
// production, where LiteSpeed serves brotli (slightly better still) and leaves
// images uncompressed.
//
// Exits non-zero if a budget is exceeded, so increment 6 can gate on it.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const DIST = 'dist';
const PORT = 4400;
const BASE = `http://localhost:${PORT}`;
const PAGES = ['/', '/work/dexcom/', '/work/vmi/'];

// From CLAUDE.md §4. Set from measurements taken after increment 7, with ~25%
// headroom — enough to absorb an ordinary edit, tight enough that a regression
// trips it. The pre-increment-7 numbers in this file were guesses made before
// there was anything to measure, and had 4x headroom, which catches nothing.
const BUDGET = {
  totalBytes: 150 * 1024,
  largestImage: 60 * 1024,
  jsBytes: 5 * 1024,
  cssBytes: 10 * 1024,
  requests: 20,
  cls: 0.1,
  lcp: 1500
};

const TYPES = {
  '.html': ['text/html; charset=utf-8', true],
  '.css': ['text/css; charset=utf-8', true],
  '.js': ['text/javascript; charset=utf-8', true],
  '.json': ['application/json', true],
  '.webmanifest': ['application/manifest+json', true],
  '.svg': ['image/svg+xml', true],
  '.xml': ['application/xml', true],
  '.txt': ['text/plain; charset=utf-8', true],
  '.png': ['image/png', false],
  '.jpg': ['image/jpeg', false],
  '.avif': ['image/avif', false],
  '.webp': ['image/webp', false],
  '.ico': ['image/x-icon', false],
  '.woff2': ['font/woff2', false],
  '.pdf': ['application/pdf', false]
};

const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, BASE).pathname);
  if (path.endsWith('/')) path += 'index.html';
  const file = join(DIST, normalize(path).replace(/^(\.\.[/\\])+/, ''));
  const [type, compressible] = TYPES[extname(file)] ?? ['application/octet-stream', false];
  try {
    let body = await readFile(file);
    const headers = { 'Content-Type': type };
    if (compressible && (req.headers['accept-encoding'] ?? '').includes('gzip')) {
      body = gzipSync(body);
      headers['Content-Encoding'] = 'gzip';
    }
    headers['Content-Length'] = body.length;
    res.writeHead(200, headers);
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('not found');
  }
});
await new Promise((r) => server.listen(PORT, r));

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const browser = await chromium.launch();
let failures = 0;

for (const path of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  const byType = {};
  let total = 0;
  let largestImage = 0;
  let requests = 0;

  page.on('response', async (r) => {
    requests += 1;
    const len = Number(r.headers()['content-length'] ?? 0);
    const ct = (r.headers()['content-type'] ?? '').split(';')[0];
    const group = ct.startsWith('image/')
      ? 'image'
      : ct.startsWith('font/')
        ? 'font'
        : ct.includes('javascript')
          ? 'js'
          : ct.includes('css')
            ? 'css'
            : ct.includes('html')
              ? 'html'
              : 'other';
    byType[group] = (byType[group] ?? 0) + len;
    total += len;
    if (group === 'image' && len > largestImage) largestImage = len;
  });

  await page.goto(BASE + path, { waitUntil: 'networkidle' });

  const vitals = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let cls = 0;
        let lcp = 0;
        new PerformanceObserver((l) => {
          for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value;
        }).observe({ type: 'layout-shift', buffered: true });
        new PerformanceObserver((l) => {
          const e = l.getEntries().at(-1);
          if (e) lcp = e.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        setTimeout(() => resolve({ cls: Number(cls.toFixed(4)), lcp: Math.round(lcp) }), 1200);
      })
  );

  // Images not yet requested (below the fold, lazy) are excluded from `total` by
  // design — this is first-load weight, which is what the budget is about.
  const checks = [
    ['total transfer', total, BUDGET.totalBytes, kb],
    ['largest image', largestImage, BUDGET.largestImage, kb],
    ['javascript', byType.js ?? 0, BUDGET.jsBytes, kb],
    ['css', byType.css ?? 0, BUDGET.cssBytes, kb],
    ['requests', requests, BUDGET.requests, String],
    ['CLS', vitals.cls, BUDGET.cls, String],
    ['LCP (ms)', vitals.lcp, BUDGET.lcp, String]
  ];

  console.log(`\n${path}   LCP ${vitals.lcp} ms`);
  for (const [label, value, limit, fmt] of checks) {
    const ok = value <= limit;
    if (!ok) failures += 1;
    console.log(
      `  ${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(16)} ${fmt(value).padStart(10)}  budget ${fmt(limit)}`
    );
  }
  console.log(
    '        breakdown: ' +
      Object.entries(byType)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `${k} ${kb(v)}`)
        .join('  ')
  );

  await ctx.close();
}

await browser.close();
server.close();
console.log(`\n${failures === 0 ? 'ALL BUDGETS MET' : `${failures} BUDGET(S) EXCEEDED`}\n`);
process.exit(failures === 0 ? 0 : 1);
