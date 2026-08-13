# BACKLOG.md — increment ladder and status

One commit per increment. Nothing starts before the previous increment's checks
pass. Source of the ladder: `portfolio-uplift-plan.md`; source of the gap list:
[ORIENTATION.md](ORIENTATION.md).

Status: ✅ done · 🔄 in progress · ⏸ blocked · ⬜ not started

| # | Increment | Status | Commit |
| --- | --- | --- | --- |
| 0 | Orientation | ✅ | `8337a49` |
| 1 | Critical SEO repair | ✅ | `28fd664` |
| 2 | Process foundation | ✅ | `ce2bdd9` |
| 3 | Accessibility pass | ✅ | `503ad52` *(swapped with CI — [Q15](QUESTIONS.md#q15))* |
| 4 | SEO completion | ✅ | `35b4e35` |
| 5 | Security hardening | ⏸ | blocked on [Q9](QUESTIONS.md#q9) |
| 6 | CI gates | ⬜ | *(swapped with accessibility)* |
| 7 | Performance budgets | ⬜ | |
| 8 | Analytics + monitoring | ⬜ | |
| 9 | Deploy pipeline | ⬜ | |
| 10 | Indexing | ⬜ | founder-only; needs Search Console access |

**Nothing reaches eivinasn.com until increment 9** — see
[Q1](QUESTIONS.md#q1). The `example.com` canonical is fixed in the repo and
still wrong in production.

---

## 0 · Orientation ✅

Six parallel audits, each adversarially verified, then a completeness pass. 224
raw findings. Stack, deploy method and the real gap list recorded in
[ORIENTATION.md](ORIENTATION.md).

## 1 · Critical SEO repair ✅

- `astro.config.mjs` `site` → `https://eivinasn.com`, `trailingSlash: 'always'`.
- New `BaseHead.astro` — one head for both layouts, which is why the canonical
  was previously wrong in one and absent in the other.
- All 5 pages self-canonical, derived from `Astro.site` + path.
- `og:image` was `/og-image.jpg`, a 404. Now absolute and pointing at a real file.
- Case studies gained description, OG and Twitter tags from their existing
  `summary`.
- Internal case-study links gained the trailing slash.

Verified: zero `example.com` in `dist/`; homepage diff vs live is exactly 16
lines; case-study `<body>` byte-identical to production.

## 2 · Process foundation ✅

`CLAUDE.md`, `BACKLOG.md`, `QUESTIONS.md`, `COMPONENTS.md`, `.nvmrc`, a real
`.gitignore` entry for `.astro/`, and the README corrected — it currently
documents a Vercel/Netlify deploy that has never existed.

## 3 · Accessibility pass ✅

Swapped ahead of CI ([Q15](QUESTIONS.md#q15)). **0 axe violations** on all 6
pages (WCAG 2.0/2.1 A+AA, 2.2 AA). Re-runnable: `npm run verify:a11y`.

Contrast raised per-usage to the threshold each size requires ([Q16](QUESTIONS.md#q16)),
preserving the dim-to-bright hierarchy. Nameless "Go back" link fixed; `<footer>`
lifted out of `<main>`; `<header>`, skip link and `#main` added;
`prefers-reduced-motion` honoured; `<noscript>` fallback added;
mobile-menu focus management; `scroll-padding-top` for SC 2.4.11; alt-text and
link-text quality.

Also fixed a live bug no audit found: an IntersectionObserver never fires for an
element a jump skipped, so landing on `/#competencies` left 7 of 20 blocks
invisible until reload. `RevealScript.astro` now sweeps by position and is shared
by both layouts. 7 stranded before, 0 after.

Side effect: hoisting the reveal logic left **zero inline scripts** in the
output, so increment 5's CSP needs no script hashes — only one for the
`<noscript>` style block.


## 4 · SEO completion ✅

- `robots.txt` — AI crawlers allowed ([Q7](QUESTIONS.md#q7)), with the opposite
  policy commented in place so reversing it is one edit.
- `sitemap-index.xml` + `sitemap-0.xml` via `@astrojs/sitemap`, 5 URLs, 404
  excluded. Pinned to **3.2.1** — 3.7.3 reads Astro 5's route shape and crashes
  the build on Astro 4 ([Q3](QUESTIONS.md#q3)).
- Custom `404.astro`, `noindex`, with recovery links. Replaces Hostinger's
  fallback page and the third-party tracking it loaded.
- Favicon set generated from `logo-eivinas.svg` ([Q5](QUESTIONS.md#q5)):
  multi-size `favicon.ico`, 180px apple-touch PNG, 192/512 PNGs, maskable 512.
  `npm run generate:icons`.
- OG image, 1200x630, rendered in a real browser from the site's own type and
  colour. `npm run generate:og`.
- `Person` + `WebSite` on the homepage; `Person` + `CreativeWork` on each case
  study, linked by `@id` so they read as one entity.
- OG completeness: `og:site_name`, `og:locale`, `og:image:width`/`height`/`type`,
  `og:image:alt`, `author`.
- Manifest rewritten with real PNG icons, `scope`, `lang`, `description`.

Still open here: `/work/` returns **403**, not 404 — server-side, so it belongs
to increment 5.


## 5 · Security hardening ⏸

**Blocked on [Q9](QUESTIONS.md#q9)** — whether an `.htaccess` already exists on
the server. Written defensively regardless.

- CSP. **Needs build-time hashes** — the reveal script is inline and a static
  host cannot generate a nonce. A naive `script-src 'self'` blanks the homepage.
- HSTS, `X-Content-Type-Options`, `X-Frame-Options`/`frame-ancestors 'none'`,
  `Referrer-Policy`, `Permissions-Policy` — all currently absent.
- `Cache-Control` on HTML documents — currently none at all, so browsers fall
  back to heuristic freshness against a 7-month-old `Last-Modified`.
- `/site.webmanifest` is served as `text/plain`.
- **Do not replace what works** — brotli, gzip, `Vary`, static caching and the
  TLS policy are all already correct. Extend.

## 6 · CI gates ⬜

Lean, per [Q14](QUESTIONS.md#q14) — private repo, metered minutes.

- Format, lint, typecheck, build, HTML validation, link check.
- Playwright smoke: zero console errors, zero failed requests. **Must assert
  visibility, not just presence** — `opacity: 0` elements pass `textContent`.
- Axe, Lighthouse budgets (§4 of CLAUDE.md).
- `npm audit` with the documented exception from [Q3](QUESTIONS.md#q3).
- Weekly scheduled run. SHA-pin every action.
- Needs `tsconfig.json` and `@astrojs/check`, neither of which exists.
- Lighthouse: set `maxAutodiscoverUrls` to 0 (defaults to 5 and silently drops
  pages) and exclude any search-engine verification `.html`.

## 7 · Performance budgets ⬜

Baseline measured 2026-08-13: homepage 945 KB over 18 requests to 3 origins;
images are 98.4% of it; client JS is 894 B. **There is no JavaScript problem and
no server problem — TTFB is ~150 ms.**

- Move images `public/` → `src/assets/` so Astro's pipeline applies at all.
  `sharp` is already installed and entirely unused.
- Modern formats. Measured: AVIF q70 cuts the homepage raster payload **85.7%**
  (781,023 → 111,973 B).
- `srcset`/`sizes` — currently zero across all 22 images. They are simultaneously
  over-delivered at 1× and under-delivered at 2×.
- Explicit `width`/`height` on the 16 unprotected images (6 are already
  aspect-ratio protected).
- `loading="lazy"` below the fold; `fetchpriority="high"` + preload on the LCP
  hero.
- Self-host Inter. Smaller win than it looks — it is a variable font resolving to
  one file — but it removes two origins from the critical path and narrows the
  CSP.
- Closes [Q8](QUESTIONS.md#q8) if the re-encoded output beats the live variants.

## 8 · Analytics + monitoring ⬜

- Cookieless analytics hook, **inert until a token is supplied**
  ([Q13](QUESTIONS.md#q13)). Claude does not create accounts.
- Free uptime monitor — founder task.
- No RUM baseline exists today, so increment 7's gains are currently unmeasurable
  in the field.

## 9 · Deploy pipeline ⬜

- Build → gate → mirror to Hostinger over SFTP → post-deploy smoke test against
  the live URL.
- **Dormant until armed by a repository variable.** Founder adds credentials as
  GitHub secrets; Claude never handles them.
- **Must not blind-mirror `dist/`.** 13 of 38 `public/` files diverge and for 3
  images production is ahead of the repo ([Q8](QUESTIONS.md#q8)). Must also
  refuse to clobber a server-side `.htaccess` it did not create
  ([Q9](QUESTIONS.md#q9)).
- Hostinger bans the runner IP after ~12 SSH deploys in a day. Deploy sparingly.
- **This is the increment that finally ships increment 1's canonical fix.**

## 10 · Indexing ⬜

Founder-only — needs Search Console and Bing Webmaster access.

- Verify both consoles; verification files live in `public/` so the deploy
  cannot delete them.
- Submit the sitemap; request indexing.
- **Establish whether the 7-month-old off-domain canonical caused deindexing.**
  This has never been measured — see ORIENTATION.md §8.

---

## Out of ladder

| Item | Owner | Note |
| --- | --- | --- |
| Astro 4 → 7 upgrade | Claude | Deferred past increment 10 ([Q3](QUESTIONS.md#q3)). Also unlocks the image pipeline properly |
| Unused case-study images | Founder | [Q10](QUESTIONS.md#q10) — 1.27 MB shipping unreferenced |
| `dexcom case study.pdf` | Founder | [Q11](QUESTIONS.md#q11) |
| Divergent live images | Founder | [Q8](QUESTIONS.md#q8) — may close automatically at increment 7 |
| `www` → apex redirect | Founder/host | Both hostnames serve 200 with no redirect. Canonical now disambiguates for search, but a host-level redirect is the real fix |
| Commit history | — | 9 of 10 pre-2026-08-13 commits say `your message`. Not rewritten |
