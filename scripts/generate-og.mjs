// Generates public/og-image.png — the 1200x630 social share card.
//
//   npm run generate:og
//
// Re-run only when the wording or portrait changes; the output is committed.
//
// Rendered in a real browser rather than composited, so it uses the site's
// actual type, colour and spacing. No suitable source asset existed: the only
// candidates were a 896x1200 portrait (wrong aspect) and 540x302 thumbnails
// (under half the required resolution).
//
// Assets are inlined as data URIs so the render has no network dependency
// beyond the webfont.
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const W = 1200;
const H = 630;

const dataUri = async (path, mime) =>
  `data:${mime};base64,${(await readFile(path)).toString('base64')}`;

const portrait = await dataUri('src/assets/hero-portrait.png', 'image/png');
const logo = await dataUri('public/logo-eivinas.svg', 'image/svg+xml');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${W}px; height: ${H}px;
    background: #050505;
    font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
    color: #EDEDED;
    display: flex; align-items: center;
    overflow: hidden; position: relative;
  }
  /* Same grid motif as the case-study pages. */
  .grid {
    position: absolute; inset: 0;
    background-size: 48px 48px;
    background-image:
      linear-gradient(to right, #ffffff08 1px, transparent 1px),
      linear-gradient(to bottom, #ffffff08 1px, transparent 1px);
    -webkit-mask-image: linear-gradient(115deg, black 30%, transparent 85%);
  }
  .text { position: relative; padding: 0 0 0 72px; width: 700px; }
  .mark { display: flex; align-items: center; gap: 14px; margin-bottom: 44px; }
  .mark img { width: 40px; height: 40px; }
  .mark span {
    font-size: 15px; font-weight: 600; letter-spacing: .14em;
    text-transform: uppercase; color: #8a8a94;
  }
  h1 {
    font-size: 74px; font-weight: 600; letter-spacing: -.035em;
    line-height: 1.02; margin-bottom: 26px;
  }
  h1 .dim { color: #5b5b65; }
  p { font-size: 25px; line-height: 1.45; color: #A1A1AA; max-width: 560px; }
  .name {
    margin-top: 46px; padding-top: 26px;
    border-top: 1px solid #27272A;
    font-size: 21px; font-weight: 500; color: #EDEDED;
  }
  .name em { font-style: normal; color: #8a8a94; }
  .photo { position: absolute; right: 0; top: 0; bottom: 0; width: 430px; }
  .photo img {
    width: 100%; height: 100%; object-fit: cover;
    filter: grayscale(1); object-position: center 22%;
  }
  .photo::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(to right, #050505 0%, transparent 45%);
  }
</style>
</head>
<body>
  <div class="grid"></div>
  <div class="text">
    <div class="mark"><img src="${logo}" alt=""><span>Portfolio 2026</span></div>
    <h1>Design,<br><span class="dim">Ops &amp; Leadership.</span></h1>
    <p>Over 12 years operating at scale. Currently shifting toward early-stage company building.</p>
    <div class="name">Eivinas Norušaitis <em>&middot; eivinasn.com</em></div>
  </div>
  <div class="photo"><img src="${portrait}" alt=""></div>
</body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
const buf = await page.screenshot({ type: 'png' });
await browser.close();

await writeFile('public/og-image.png', buf);
console.log(`Wrote public/og-image.png — ${W}x${H}, ${buf.length.toLocaleString()} B`);
