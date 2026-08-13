// Link checker for the built output.
//
//   npm run check:links
//
// Serves dist/ on a fixed port and rewrites absolute https://eivinasn.com URLs
// to that server, so self-references (og:image, canonical, sitemap) are checked
// against the build rather than against production — which, until increment 9
// runs, is still the old deploy. Without the rewrite this reports five false
// 404s for an og:image that exists in dist/ and simply has not shipped yet.
//
// External links are checked for real. Set SKIP_EXTERNAL=1 to stay local.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { LinkChecker } from 'linkinator';

const DIST = 'dist';
const PORT = 4402;
const BASE = `http://localhost:${PORT}`;
const SITE = 'https://eivinasn.com';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf'
};

const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, BASE).pathname);
  if (path.endsWith('/')) path += 'index.html';
  const file = join(DIST, normalize(path).replace(/^(\.\.[/\\])+/, ''));
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('not found');
  }
});
await new Promise((r) => server.listen(PORT, r));

const checker = new LinkChecker();
const result = await checker.check({
  path: `${BASE}/`,
  recurse: true,
  timeout: 15000,
  concurrency: 20,
  linksToSkip: process.env.SKIP_EXTERNAL
    ? [`^(?!${BASE})`]
    : [
        // LinkedIn serves HTTP 999 to anything that looks automated. The link is
        // checked by hand; failing CI on someone else's bot policy is noise.
        '^https://(www\\.)?linkedin\\.com'
      ],
  urlRewriteExpressions: [{ pattern: new RegExp(SITE.replace('.', '\\.'), 'g'), replacement: BASE }]
});

server.close();

const broken = result.links.filter((l) => l.state === 'BROKEN');
const skipped = result.links.filter((l) => l.state === 'SKIPPED');
console.log(
  `Checked ${result.links.length} links — ${broken.length} broken, ${skipped.length} skipped`
);
for (const l of broken) {
  console.log(`  [${l.status ?? 'ERR'}] ${l.url}`);
  if (l.parent) console.log(`          on ${l.parent}`);
}
console.log(`\n${broken.length === 0 ? 'ALL LINKS OK' : `${broken.length} BROKEN LINK(S)`}\n`);
process.exit(broken.length === 0 ? 0 : 1);
