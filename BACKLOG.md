# BACKLOG.md — increment ladder and status

One commit per increment. Nothing starts before the previous increment's checks
pass. Source of the ladder: `portfolio-uplift-plan.md`; source of the gap list:
[ORIENTATION.md](ORIENTATION.md).

Status: ✅ done · 🔄 in progress · ⏸ blocked · ⬜ not started

| # | Increment | Status | Commit |
| --- | --- | --- | --- |
| 0 | Orientation | ✅ | `8337a49` |
| 1 | Critical SEO repair | ✅ | `28fd664` |
| 2 | Process foundation | 🔄 | — |
| 3 | Accessibility pass | ✅ | `pending` *(swapped with CI — [Q15](QUESTIONS.md#q15))* |
| 4 | SEO completion | ⬜ | |
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

## 2 · Process foundation 🔄

`CLAUDE.md`, `BACKLOG.md`, `QUESTIONS.md`, `COMPONENTS.md`, `.nvmrc`, a real
`.gitignore` entry for `.astro/`, and the README corrected — it currently
documents a Vercel/Netlify deploy that has never existed.

## 3 · Accessibility pass ⬜

Swapped ahead of CI so the gates can go green on arrival ([Q15](QUESTIONS.md#q15)).

Ordered by severity:

- **`link-name`** — the "Go back" link on all 4 case studies has no accessible
  name. The anchor wraps only an SVG; the visible words are a `<span>` outside
  it. It is the only in-page route from a case study back to the site.
- **Contrast** — `#52525B` 2.64:1 (35 elements + 29 `::marker`, includes half the
  `<h1>`), `#1d4ed8` 3.04:1 (22 uses, including every "Read More"), `#71717A`
  4.22:1 (23 uses, all ≤14px). Approach ruled in [Q16](QUESTIONS.md#q16).
- **`<noscript>` fallback** — ~20 homepage blocks are `opacity: 0` until JS
  reveals them; mobile has no navigation at all without JS.
- **Landmarks** — `<footer>` is nested inside `<main>` on all 5 pages, so it is
  never exposed as `contentinfo`. No `<header>`/banner anywhere.
- **Skip link** — absent on all pages.
- **`prefers-reduced-motion`** — not honoured anywhere, including
  `scroll-behavior: smooth`.
- **Mobile menu focus management** — focus never enters the panel, never returns
  to the trigger on Escape.
- **`scroll-padding-top`** — absent while a fixed nav overlays the viewport
  (WCAG 2.2 SC 2.4.11).
- Alt-text quality; 4 identical "Read More" links; 20 case-study `<section>`s
  labelled by a `<span>` rather than a heading.

## 4 · SEO completion ⬜

- `robots.txt` — AI crawlers allowed ([Q7](QUESTIONS.md#q7)).
- `sitemap.xml` via `@astrojs/sitemap`. **Only safe now that `site` is correct.**
- Custom `404.astro`. Also removes the Hostinger fallback page, which currently
  fires Google Analytics, GTM and doubleclick.net under this origin
  ([Q13](QUESTIONS.md#q13)).
- Favicon set generated from `logo-eivinas.svg` ([Q5](QUESTIONS.md#q5)):
  `favicon.ico`, 180×180 apple-touch PNG (the current tag points at an SVG, which
  iOS does not support), 192/512 PNGs for the manifest.
- OG image, 1200×630, generated from a real page render. **A design task — no
  suitable asset exists.**
- `Person` structured data; `WebSite` on the homepage.
- OG completeness: `og:site_name`, `og:locale`, `og:image:width`/`height`.
- `/work/` currently returns **403**, not 404 — a crawler walking the hierarchy
  upward hits a hard error.

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
