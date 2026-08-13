// Pushes the sitemap's URLs to IndexNow so Bing (and Yandex, Seznam, Naver)
// recrawl immediately instead of waiting for their own schedule.
//
//   npm run ping:indexnow
//
// Why this exists: after the first deploy, Bing's reports were built from
// crawls dated 23 Feb 2026 and "01 Jan 2006" (its placeholder for never). The
// pages were correct; Bing simply had not been back. IndexNow is the supported
// way to say "look again now" rather than re-requesting URLs by hand.
//
// Google does NOT participate in IndexNow. It uses the sitemap and its own
// scheduling; Search Console's Request Indexing is the equivalent there.
import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { basename } from 'node:path';

const HOST = 'eivinasn.com';
const ENDPOINT = 'https://api.indexnow.org/indexnow';

// The key is the name of the file in public/ — no secret involved. IndexNow
// uses it only to prove control of the host, and it is public by design.
let key = null;
for await (const f of glob('public/*.txt')) {
  const name = basename(f, '.txt');
  if (/^[a-f0-9]{16,128}$/i.test(name)) key = name;
}
if (!key) {
  console.error('No IndexNow key file found in public/ (expected a hex-named .txt).');
  process.exit(1);
}

const xml = await readFile('dist/sitemap-0.xml', 'utf8');
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!urlList.length) {
  console.error('No URLs in dist/sitemap-0.xml — run `npm run build` first.');
  process.exit(1);
}

const body = { host: HOST, key, keyLocation: `https://${HOST}/${key}.txt`, urlList };
console.log(`Submitting ${urlList.length} URLs to IndexNow as ${key.slice(0, 8)}…`);
urlList.forEach((u) => console.log(`  ${u}`));

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body)
});

// 200 accepted, 202 accepted but key still validating. Both are success.
const ok = res.status === 200 || res.status === 202;
console.log(`\n${ok ? 'ACCEPTED' : 'FAILED'} — HTTP ${res.status} ${res.statusText}`);
if (!ok) console.log(await res.text());
process.exit(ok ? 0 : 1);
