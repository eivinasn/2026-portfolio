// Generates the social share cards — one for the homepage and one per case
// study.
//
//   npm run generate:og
//
// Re-run when a title, tag or portrait changes; the output is committed.
//
// Rendered in a real browser rather than composited, so the cards use the
// site's own type, colour and imagery. Per-page rather than one shared card:
// four case studies sharing a single image means a link to any of them unfurls
// as the homepage, which is the whole thing a share card is for.
//
// Assets are inlined as data URIs so the render has no network dependency.
// Inter is loaded from a local file for the same reason — the previous version
// pulled it from Google Fonts, which meant this script could silently produce
// a fallback-face card whenever the network was unavailable.
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const W = 1200;
const H = 630;
// Facebook and LinkedIn both stop fetching well below this; a card that is too
// heavy simply does not unfurl, which is indistinguishable from having none.
const MAX_BYTES = 900 * 1024;

const dataUri = async (path, mime) =>
  `data:${mime};base64,${(await readFile(path)).toString('base64')}`;

const logo = await dataUri('public/logo-eivinas.svg', 'image/svg+xml');
const interLatin = await dataUri('public/fonts/inter-latin-var.woff2', 'font/woff2');
const interLatinExt = await dataUri('public/fonts/inter-latin-ext-var.woff2', 'font/woff2');

const CARDS = [
  {
    out: 'og-image.png',
    overline: 'Portfolio 2026',
    title: 'Design,<br><span class="dim">Ops &amp; Leadership.</span>',
    blurb: 'Over 12 years operating at scale. Currently focusing on company building.',
    image: 'src/assets/hero-portrait.png',
    position: 'center 22%'
  },
  {
    out: 'og-dexcom.png',
    overline: 'Case study · Global leadership',
    title: 'Establishing Dexcom’s European Product Design Studio from Zero',
    blurb: 'Leading an EU-based product design studio, collaborating across Europe and the US.',
    image: 'src/assets/thumb-dexcom.png'
  },
  {
    out: 'og-nfq.png',
    overline: 'Case study · Business unit',
    title: 'Scaling a Profitable, Financially Independent UX &amp; Design Unit',
    blurb:
      'Full P&amp;L ownership, resourcing, and commercial decision-making at NFQ Technologies.',
    image: 'src/assets/thumb-nfq.png'
  },
  {
    out: 'og-vinted.png',
    overline: 'Case study · Startup experience',
    title: 'Enabling Escrow Trading in Poland, a Freshly Monetized Market',
    blurb: 'Payments design at Vinted, enabling escrow-based payments for millions.',
    image: 'src/assets/thumb-vinted.png'
  },
  {
    out: 'og-vmi.png',
    overline: 'Case study · Public sector',
    title: 'Redesigning Income Tax Declaration for an Entire Country',
    blurb: 'A nationwide declaration wizard for the Lithuanian State Tax Inspectorate.',
    image: 'src/assets/thumb-vmi.png'
  }
];

const page = (card, portrait) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><style>
  @font-face { font-family:'Inter'; font-weight:300 700; font-display:block;
    src:url('${interLatin}') format('woff2');
    unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+2000-206F,U+20AC,U+2122; }
  @font-face { font-family:'Inter'; font-weight:300 700; font-display:block;
    src:url('${interLatinExt}') format('woff2');
    unicode-range:U+0100-02BA,U+1E00-1E9F,U+2C60-2C7F,U+A720-A7FF; }
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${W}px;height:${H}px;background:#050505;font-family:Inter,sans-serif;
    color:#EDEDED;display:flex;align-items:center;overflow:hidden;position:relative}
  .grid{position:absolute;inset:0;background-size:48px 48px;
    background-image:linear-gradient(to right,#ffffff08 1px,transparent 1px),
      linear-gradient(to bottom,#ffffff08 1px,transparent 1px);
    -webkit-mask-image:linear-gradient(115deg,black 30%,transparent 85%)}
  .text{position:relative;padding:0 0 0 72px;width:690px}
  .mark{display:flex;align-items:center;gap:14px;margin-bottom:40px}
  .mark img{width:36px;height:36px}
  .mark span{font-size:14px;font-weight:600;letter-spacing:.14em;
    text-transform:uppercase;color:#8a8a94}
  h1{font-size:${card.size ?? 54}px;font-weight:600;letter-spacing:-.03em;
    line-height:1.08;margin-bottom:24px}
  h1 .dim{color:#5b5b65}
  p{font-size:21px;line-height:1.45;color:#A1A1AA;max-width:600px}
  .name{margin-top:40px;padding-top:24px;border-top:1px solid #27272A;
    font-size:19px;font-weight:500}
  .name em{font-style:normal;color:#8a8a94}
  .photo{position:absolute;right:0;top:0;bottom:0;width:430px}
  .photo img{width:100%;height:100%;object-fit:cover;filter:grayscale(1);
    object-position:${card.position ?? 'center'}}
  .photo::after{content:'';position:absolute;inset:0;
    background:linear-gradient(to right,#050505 0%,transparent 45%)}
</style></head><body>
  <div class="grid"></div>
  <div class="text">
    <div class="mark"><img src="${logo}" alt=""><span>${card.overline}</span></div>
    <h1>${card.title}</h1>
    <p>${card.blurb}</p>
    <div class="name">Eivinas Norušaitis <em>· eivinasn.com</em></div>
  </div>
  <div class="photo"><img src="${portrait}" alt=""></div>
</body></html>`;

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });

let oversize = 0;
for (const card of CARDS) {
  const portrait = await dataUri(card.image, 'image/png');
  await tab.setContent(page(card, portrait), { waitUntil: 'load' });
  await tab.evaluate(() => document.fonts.ready);
  await tab.waitForTimeout(250);
  const buf = await tab.screenshot({ type: 'png' });
  await writeFile(`public/${card.out}`, buf);
  const over = buf.length > MAX_BYTES;
  if (over) oversize += 1;
  console.log(
    `  ${card.out.padEnd(16)} ${W}x${H}  ${buf.length.toLocaleString().padStart(9)} B${over ? '  *** OVER LIMIT ***' : ''}`
  );
}

await browser.close();

// A card nobody can fetch is worse than no card, and the failure is silent —
// the unfurl just comes back empty. Fail the build instead.
if (oversize) {
  console.error(`\n${oversize} card(s) exceed ${(MAX_BYTES / 1024).toFixed(0)} KB.`);
  process.exit(1);
}
console.log(
  `\nAll ${CARDS.length} cards generated, all under ${(MAX_BYTES / 1024).toFixed(0)} KB.`
);
