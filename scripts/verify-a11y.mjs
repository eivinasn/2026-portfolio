// Accessibility verification for eivinasn.com.
//
//   npm run verify:a11y
//
// Builds nothing — run `npm run build` first. Starts `astro preview` itself,
// runs every check against a real browser, and exits non-zero on any failure.
// Increment 6 wires this into CI; it is runnable by hand today.
//
// Axe is the floor, not the ceiling. The checks below cover the things axe
// cannot see: content stranded invisible by a scroll jump, the skip link, the
// no-JS fallback, and reduced motion.
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
const PAGES = ['/', '/work/dexcom/', '/work/nfq/', '/work/vinted/', '/work/vmi/'];
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const VIEWPORT = { width: 1280, height: 900 };

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures += 1;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ' — ' + detail : ''}`);
};

// ---------------------------------------------------------------- preview server
let server = null;
async function waitForServer(url, attempts = 60) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const r = await fetch(url);
      if (r.ok) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

if (!process.env.BASE_URL) {
  server = spawn('npx', ['astro', 'preview'], { stdio: 'ignore', detached: true });
  if (!(await waitForServer(BASE))) {
    console.error(`Could not reach ${BASE}. Did you run \`npm run build\`?`);
    process.exit(1);
  }
}
const stopServer = () => {
  if (server?.pid) {
    try {
      process.kill(-server.pid);
    } catch {
      /* already gone */
    }
  }
};

const browser = await chromium.launch();

/** Reveal everything before auditing — axe must see the page as users do. */
const settle = async (page) => {
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(900);
};

const withPage = async (opts, fn) => {
  const ctx = await browser.newContext({ viewport: VIEWPORT, ...opts });
  const page = await ctx.newPage();
  try {
    return await fn(page);
  } finally {
    await ctx.close();
  }
};

try {
  // -------------------------------------------------------------- axe
  console.log('\n== axe (WCAG 2.0/2.1 A+AA, 2.2 AA) ==');
  for (const path of PAGES) {
    await withPage({}, async (page) => {
      await page.goto(BASE + path, { waitUntil: 'networkidle' });
      await settle(page);
      const { violations } = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
      check(path, violations.length === 0, `${violations.length} violation(s)`);
      for (const v of violations) {
        console.log(`        [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length})`);
        v.nodes.slice(0, 3).forEach((n) => console.log(`          ${n.target.join(' ')}`));
      }
    });
  }

  // -------------------------------------------------------------- console / network
  console.log('\n== zero console errors, zero failed requests ==');
  for (const path of PAGES) {
    await withPage({}, async (page) => {
      const errors = [];
      const failed = [];
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('requestfailed', (r) => failed.push(r.url()));
      const resp = await page.goto(BASE + path, { waitUntil: 'networkidle' });
      check(
        path,
        resp.status() === 200 && errors.length === 0 && failed.length === 0,
        `status=${resp.status()} errors=${errors.length} failed=${failed.length}`
      );
      errors.slice(0, 3).forEach((e) => console.log(`        ${e}`));
    });
  }

  // -------------------------------------------------------------- stranded content
  //
  // An IntersectionObserver never fires for an element that a jump skipped over.
  // Before increment 3, landing on /#competencies left 7 blocks invisible until
  // reload. Assert visibility, never presence — opacity:0 elements still have
  // textContent and still appear in the accessibility tree.
  console.log('\n== no content stranded invisible ==');
  const stranded = (page) =>
    page.evaluate(() => {
      const els = [...document.querySelectorAll('.reveal-on-scroll,.reveal-opacity-only')];
      return {
        total: els.length,
        visible: els.filter((e) => e.classList.contains('is-visible')).length,
        stranded: els.filter(
          (e) => getComputedStyle(e).opacity === '0' && e.getBoundingClientRect().bottom < 0
        ).length,
      };
    });

  for (const [label, top] of [
    ['instant jump past content', 4500],
    ['instant jump to bottom', 999999],
  ]) {
    await withPage({}, async (page) => {
      await page.goto(BASE + '/', { waitUntil: 'networkidle' });
      await page.evaluate((t) => {
        document.documentElement.style.scrollBehavior = 'auto';
        window.scrollTo({ top: t, behavior: 'instant' });
      }, top);
      await page.waitForTimeout(600);
      const r = await stranded(page);
      check(label, r.stranded === 0, `total=${r.total} visible=${r.visible} stranded=${r.stranded}`);
    });
  }

  await withPage({}, async (page) => {
    await page.goto(BASE + '/#competencies', { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
    const r = await stranded(page);
    check('landing on /#competencies', r.stranded === 0, `stranded=${r.stranded}`);
  });

  // -------------------------------------------------------------- structure
  console.log('\n== landmarks, skip link, accessible link names ==');
  for (const path of PAGES) {
    await withPage({}, async (page) => {
      await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
      const r = await page.evaluate(() => {
        const main = document.querySelector('main');
        const nameless = [...document.querySelectorAll('a[href]')]
          .filter(
            (a) =>
              !(a.textContent || '').trim() &&
              !a.getAttribute('aria-label') &&
              !a.getAttribute('title')
          )
          .map((a) => a.getAttribute('href'));
        return {
          mains: document.querySelectorAll('main').length,
          header: !!document.querySelector('header'),
          footerInMain: !!(main && main.querySelector('footer')),
          skip: !!document.querySelector('.skip-link[href="#main"]'),
          mainId: !!document.querySelector('#main'),
          nameless,
        };
      });
      check(
        path,
        r.mains === 1 && r.header && !r.footerInMain && r.skip && r.mainId && !r.nameless.length,
        `main=${r.mains} header=${r.header} footerInMain=${r.footerInMain} skip=${r.skip} nameless=${r.nameless.length}`
      );
      if (r.nameless.length) console.log('        nameless links:', r.nameless);
    });
  }

  // -------------------------------------------------------------- skip link
  //
  // Never assert this with keyboard.press('Tab') — Safari keeps links out of the
  // tab sequence unless Full Keyboard Access is on. Focus it directly.
  console.log('\n== skip link is offscreen until focused ==');
  await withPage({}, async (page) => {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    const before = await page.locator('.skip-link').boundingBox();
    await page.locator('.skip-link').focus();
    await page.waitForTimeout(300);
    const after = await page.locator('.skip-link').boundingBox();
    check(
      'hidden, then visible on focus',
      before.y < 0 && after.y >= 0,
      `y ${Math.round(before.y)} -> ${Math.round(after.y)}`
    );
  });

  // -------------------------------------------------------------- reduced motion
  console.log('\n== prefers-reduced-motion ==');
  await withPage({ reducedMotion: 'reduce' }, async (page) => {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    const r = await page.evaluate(() => {
      const els = [
        ...document.querySelectorAll('.reveal-on-scroll,.reveal-opacity-only,.animate-fade-up'),
      ];
      return { total: els.length, hidden: els.filter((e) => getComputedStyle(e).opacity === '0').length };
    });
    check('nothing hidden', r.hidden === 0, `total=${r.total} hidden=${r.hidden}`);
  });

  // -------------------------------------------------------------- no JavaScript
  console.log('\n== JavaScript disabled ==');
  await withPage({ viewport: { width: 390, height: 800 }, javaScriptEnabled: false }, async (page) => {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    const nav = await page.locator('#mobile-nav a').first().isVisible();
    const about = await page.locator('#about').isVisible();
    check('mobile nav and content still visible', nav && about, `nav=${nav} content=${about}`);
  });
} finally {
  await browser.close();
  stopServer();
}

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
