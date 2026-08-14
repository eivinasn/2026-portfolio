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
const PAGES = ['/', '/work/dexcom/', '/work/vmi/', '/privacy/'];

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

// Mobile is measured separately and judged against Core Web Vitals thresholds
// rather than the desktop numbers. Everything in this repo was measured at one
// desktop width until now, which is how a 320px horizontal overflow between
// 768 and 1087px reached production. Measured on this build: LCP 644 ms on the
// homepage and 764 ms on a case study, so 2500 ms leaves real headroom while
// still catching a regression that matters.
const MOBILE = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  cpuThrottle: 4,
  // Slow 4G, the profile Lighthouse uses by default.
  latencyMs: 150,
  downloadBps: (1.6 * 1024 * 1024) / 8,
  uploadBps: (750 * 1024) / 8,
  budget: { totalBytes: 150 * 1024, lcp: 2500, cls: 0.1 }
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

  // The js budget was dead. It read only from responses whose content-type is
  // javascript, and Astro 7 inlines every script this site has, so nothing ever
  // arrived as a JS response and the budget printed a constant 0.0 KB — a
  // budget that cannot fail is not a budget. Count the inline modules too.
  // These bytes are gzipped inside the HTML on the wire, so counting them raw
  // over-states them slightly; that errs toward failing the budget, not passing
  // it. `application/ld+json` is data, not script, and stays excluded.
  const inlineJsBytes = await page.evaluate(() =>
    [...document.querySelectorAll('script:not([src])')]
      .filter((s) => !s.type || s.type === 'module' || s.type.includes('javascript'))
      .reduce((n, s) => n + new TextEncoder().encode(s.textContent ?? '').length, 0)
  );
  byType.js = (byType.js ?? 0) + inlineJsBytes;

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

// ---------------------------------------------------------------- mobile
console.log('\n== mobile: 390px, 4x CPU throttle, slow 4G ==');
for (const path of PAGES.slice(0, 2)) {
  const ctx = await browser.newContext({
    viewport: MOBILE.viewport,
    deviceScaleFactor: MOBILE.deviceScaleFactor,
    isMobile: true,
    hasTouch: true
  });
  const page = await ctx.newPage();

  // CPU and network throttling are not exposed by Playwright's API; they come
  // from CDP directly.
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: MOBILE.latencyMs,
    downloadThroughput: MOBILE.downloadBps,
    uploadThroughput: MOBILE.uploadBps
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: MOBILE.cpuThrottle });

  let total = 0;
  page.on('response', (r) => (total += Number(r.headers()['content-length'] ?? 0)));
  await page.goto(BASE + path, { waitUntil: 'load' });

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
        setTimeout(() => resolve({ cls: Number(cls.toFixed(4)), lcp: Math.round(lcp) }), 2500);
      })
  );

  console.log(`\n${path}`);
  for (const [label, value, limit, fmt] of [
    ['total transfer', total, MOBILE.budget.totalBytes, kb],
    ['LCP (ms)', vitals.lcp, MOBILE.budget.lcp, String],
    ['CLS', vitals.cls, MOBILE.budget.cls, String]
  ]) {
    const ok = value <= limit;
    if (!ok) failures += 1;
    console.log(
      `  ${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(16)} ${fmt(value).padStart(10)}  budget ${fmt(limit)}`
    );
  }
  await ctx.close();
}

await browser.close();
server.close();
console.log(`\n${failures === 0 ? 'ALL BUDGETS MET' : `${failures} BUDGET(S) EXCEEDED`}\n`);
process.exit(failures === 0 ? 0 : 1);
