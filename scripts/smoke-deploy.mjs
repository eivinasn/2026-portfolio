// Post-deploy smoke test against the live site.
//
//   npm run smoke                      # https://eivinasn.com
//   SMOKE_URL=https://staging… npm run smoke
//
// Runs after a deploy and fails the job if production does not look like what
// was built. Everything here is a real HTTP response — this is the one check in
// the repo that talks to the actual server rather than to dist/.
//
// It deliberately re-checks the increment-1 bug by name. The whole programme
// exists because a placeholder canonical shipped and nobody noticed for seven
// months.
const BASE = (process.env.SMOKE_URL ?? 'https://eivinasn.com').replace(/\/$/, '');

const PAGES = ['/', '/work/dexcom/', '/work/nfq/', '/work/vinted/', '/work/vmi/'];
const ASSETS = [
  '/robots.txt',
  '/sitemap-index.xml',
  '/sitemap-0.xml',
  '/og-image.png',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/site.webmanifest',
  '/fonts/inter-latin-var.woff2'
];
const REQUIRED_HEADERS = [
  'strict-transport-security',
  'content-security-policy',
  'x-content-type-options',
  'x-frame-options',
  'referrer-policy',
  'permissions-policy'
];

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures += 1;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ' — ' + detail : ''}`);
};

const get = async (path, opts = {}) => {
  const res = await fetch(BASE + path, { redirect: 'manual', ...opts });
  return res;
};

console.log(`Smoke testing ${BASE}\n`);

// ---------------------------------------------------------------- pages
console.log('== pages respond and are self-canonical ==');
for (const path of PAGES) {
  try {
    const res = await get(path);
    const html = await res.text();
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    const expected = `${BASE}${path}`;
    const placeholder = /example\.com/.test(html);

    check(
      path,
      res.status === 200 && canonical === expected && !placeholder,
      `status=${res.status} canonical=${canonical ?? 'MISSING'}${placeholder ? ' PLACEHOLDER PRESENT' : ''}`
    );
  } catch (err) {
    check(path, false, String(err));
  }
}

// ---------------------------------------------------------------- assets
console.log('\n== assets the metadata promises actually exist ==');
for (const path of ASSETS) {
  try {
    const res = await get(path, { method: 'HEAD' });
    check(path, res.status === 200, `status=${res.status}`);
  } catch (err) {
    check(path, false, String(err));
  }
}

// ---------------------------------------------------------------- headers
console.log('\n== security headers ==');
try {
  const res = await get('/');
  for (const header of REQUIRED_HEADERS) {
    const value = res.headers.get(header);
    check(header, Boolean(value), value ? value.slice(0, 60) : 'ABSENT');
  }
  // The pre-existing header was a directive-less CSP that restricted nothing.
  const csp = res.headers.get('content-security-policy') ?? '';
  check(
    'CSP has real directives',
    csp.includes('default-src') && csp.includes('frame-ancestors'),
    csp.slice(0, 70)
  );
} catch (err) {
  check('header fetch', false, String(err));
}

// ---------------------------------------------------------------- behaviour
console.log('\n== redirects and error handling ==');
try {
  const noSlash = await get('/work/dexcom');
  check(
    'slashless URL redirects',
    [301, 308].includes(noSlash.status),
    `status=${noSlash.status} -> ${noSlash.headers.get('location') ?? '?'}`
  );

  const missing = await get('/this-page-does-not-exist-smoke-test');
  const missingBody = await missing.text();
  check(
    'unknown path serves the custom 404',
    missing.status === 404 && missingBody.includes('This page'),
    `status=${missing.status}`
  );
  // Hostinger's stock error page loads Google Analytics, GTM and doubleclick
  // under this origin. The custom 404 exists partly to remove that.
  check(
    '404 carries no third-party tracking',
    !/googletagmanager|doubleclick|google-analytics|gtag/i.test(missingBody),
    ''
  );

  const workDir = await get('/work/');
  check('/work/ is 404, not 403', workDir.status === 404, `status=${workDir.status}`);

  // www and the apex both served 200 with identical bytes until increment 11.
  const host = new URL(BASE).host;
  if (!host.startsWith('www.') && !host.startsWith('localhost')) {
    const www = await fetch(`https://www.${host}/work/vmi/`, { redirect: 'manual' });
    const target = www.headers.get('location') ?? '';
    check(
      'www 301s to the apex, preserving the path',
      [301, 308].includes(www.status) && target === `https://${host}/work/vmi/`,
      `status=${www.status} -> ${target || 'no Location'}`
    );
  }
} catch (err) {
  check('behaviour checks', false, String(err));
}

// ---------------------------------------------------------------- sitemap
console.log('\n== sitemap points at real pages ==');
try {
  const xml = await (await get('/sitemap-0.xml')).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  check('sitemap lists 5 URLs', locs.length === 5, `found ${locs.length}`);
  check(
    'no placeholder domain in sitemap',
    !locs.some((u) => u.includes('example.com')),
    locs[0] ?? ''
  );
  for (const loc of locs) {
    const res = await fetch(loc, { method: 'HEAD', redirect: 'manual' });
    check(`  ${new URL(loc).pathname}`, res.status === 200, `status=${res.status}`);
  }
} catch (err) {
  check('sitemap', false, String(err));
}

console.log(`\n${failures === 0 ? 'SMOKE TEST PASSED' : `${failures} SMOKE CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
