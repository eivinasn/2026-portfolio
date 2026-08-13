// Generates the favicon set from public/logo-eivinas.svg (the brand mark, Q5).
//
//   npm run generate:icons
//
// Re-run only when the mark changes; the output is committed.
//
// The source mark is white on transparent and sits off-centre in its 50x50
// viewBox, so it is rendered large, trimmed to its own bounds, then centred on
// an opaque #050505 plate. Without the plate the icon is invisible against
// light browser chrome; without the trim it sits noticeably off-centre.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const SRC = 'public/logo-eivinas.svg';
const OUT = 'public';
const BG = { r: 5, g: 5, b: 5, alpha: 1 };

const svg = await readFile(SRC);

// Render once at high resolution, then trim the transparent margin away.
const mark = await sharp(svg, { density: 1200 })
  .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .trim()
  .png()
  .toBuffer();

/**
 * @param size   output edge length in px
 * @param inset  fraction of the edge left as padding around the mark.
 *               Maskable icons need a generous safe zone because Android crops
 *               to a circle; plain icons can run closer to the edge.
 */
async function plate(size, inset) {
  const inner = Math.round(size * (1 - inset * 2));
  const resized = await sharp(mark)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: resized, gravity: 'center' }])
    .png()
    .toBuffer();
}

await mkdir(OUT, { recursive: true });

const written = [];
const write = async (name, buf) => {
  await writeFile(`${OUT}/${name}`, buf);
  written.push(`${name} (${buf.length.toLocaleString()} B)`);
};

// Browser tab / bookmarks. Multi-size .ico so Windows and older browsers pick
// the resolution they want rather than downscaling one bitmap badly.
const icoSizes = await Promise.all([16, 32, 48].map((s) => plate(s, 0.14)));
await write('favicon.ico', await pngToIco(icoSizes));

// iOS home screen. Must be PNG — iOS does not support SVG here, which is why
// the previous <link rel="apple-touch-icon" href="...svg"> did nothing.
await write('apple-touch-icon.png', await plate(180, 0.16));

// Android / PWA install.
await write('icon-192.png', await plate(192, 0.14));
await write('icon-512.png', await plate(512, 0.14));
await write('icon-maskable-512.png', await plate(512, 0.25));

console.log('Generated from ' + SRC + ':');
written.forEach((w) => console.log('  ' + w));
