// Subsets the self-hosted Inter files down to the glyphs this site actually
// uses.
//
//   npm run generate:fonts
//
// Re-run if the copy gains characters outside the current set — the script
// scans dist/ and tells you if anything it needs is missing, so run a build
// first.
//
// Why this exists: Google's latin-ext subset is 85 KB and this site uses
// exactly one character from it, the š in "Norušaitis". Shipping 85 KB for one
// glyph was the single largest remaining item on a case-study page.
//
// Requires fonttools + brotli: python3 -m pip install --user fonttools brotli
import { readFile, writeFile, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { glob } from 'node:fs/promises';

const run = promisify(execFile);
const SRC = {
  latin: 'public/fonts/inter-latin-var.woff2',
  'latin-ext': 'public/fonts/inter-latin-ext-var.woff2'
};

// Scan the built output for every character that actually appears in text.
const used = new Set();
for await (const file of glob('dist/**/*.html')) {
  const html = await readFile(file, 'utf8');
  const text = html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ');
  for (const ch of text) used.add(ch.codePointAt(0));
}

// Keep the printable ASCII + Latin-1 range whole regardless of what today's
// copy happens to contain, so ordinary edits do not require regenerating.
for (let c = 0x20; c <= 0xff; c += 1) used.add(c);

const extras = [...used].filter((c) => c > 0xff).sort((a, b) => a - b);
console.log(
  `Characters above U+00FF in use: ${extras.map((c) => 'U+' + c.toString(16).toUpperCase().padStart(4, '0')).join(' ') || 'none'}`
);

const unicodes = [...used]
  .sort((a, b) => a - b)
  .map((c) => 'U+' + c.toString(16).toUpperCase().padStart(4, '0'))
  .join(',');

for (const [name, src] of Object.entries(SRC)) {
  const before = (await stat(src)).size;
  const out = src.replace('.woff2', '.subset.woff2');
  await run('python3', [
    '-m',
    'fontTools.subset',
    src,
    `--unicodes=${unicodes}`,
    '--layout-features=kern,liga,calt,ccmp,locl,mark,mkmk',
    '--flavor=woff2',
    '--with-zopfli',
    '--desubroutinize',
    `--output-file=${out}`
  ]);
  const after = (await stat(out)).size;
  // Replace the original so the CSS URL stays stable.
  await writeFile(src, await readFile(out));
  await run('rm', [out]);
  const saved = (((before - after) / before) * 100).toFixed(1);
  console.log(
    `  ${name.padEnd(10)} ${before.toLocaleString()} B -> ${after.toLocaleString()} B  (-${saved}%)`
  );
}
