# Increment 0 — Orientation

Audit of `heshipstech/2026-portfolio` (live at https://eivinasn.com/) against
`portfolio-uplift-plan.md`, performed **2026-08-13**.

Method: every claim below was measured — a command's real output, an HTTP
response observed today, or a `file:line` in this repo. Six independent audits
(build, SEO, accessibility, live-site, content, performance) were each
adversarially re-verified, then a completeness pass looked for what nobody
checked. Where the verification pass corrected a number, the corrected number is
the one recorded here. Anything that could not be measured is listed in §8
rather than asserted.

---

## 1 · Stack

| | |
| --- | --- |
| Framework | Astro **4.16.19** (`package.json` says `^4.10.0`; latest is **7.2.1**) |
| Styling | Tailwind **3.4.19** via `@astrojs/tailwind` 5.1.5, `applyBaseStyles: false` |
| Package manager | **npm** (`package-lock.json`, 221 KB). No `pnpm-lock.yaml` |
| Node | Built locally on **v26.5.0** / npm 11.17.0. No `engines`, no `.nvmrc`, no `.node-version`. README claims "18+" |
| Source | 1,488 lines: 5 pages, 2 layouts, 4 components, 2 stylesheets |
| Routes | `/`, `/work/dexcom`, `/work/nfq`, `/work/vinted`, `/work/vmi` |
| `public/` | 38 files, 3.63 MB — 28 PNG (3.69 MB, **96.9%**), 8 SVG, 1 PDF, 1 webmanifest |
| Client JS | 894 B inline on the homepage, 279 B on a case study. One CSS bundle (24 KB). No framework runtime |
| Repo | **Private**, no description, no homepage URL, no licence, 61 tracked files, single `main` branch |

`npm run build` **succeeds** and is deterministic: the built `dist/*.html` is
byte-identical to what the live server returns for all five pages.

### What does not exist

Verified absent by `ls`/`find`, not assumed: `.github/` (no CI of any kind), any
test runner, ESLint, Prettier, `tsconfig.json`, `@astrojs/check`, `.editorconfig`,
`LICENSE`, `CLAUDE.md`, `BACKLOG.md`, `QUESTIONS.md`, `COMPONENTS.md`,
`.htaccess`, `robots.txt`, `sitemap.xml`, `404.astro`, `og-image.jpg`, any
JSON-LD.

`.astro/` (Astro's build-state cache) **is** committed and should not be.

---

## 2 · Deploy method

This was the largest unknown at the start. Most of it is now established.

**What happened:** one manual bulk upload of build output on **2026-01-12 at
19:52:11 GMT** — 2 minutes 40 seconds after the final commit. Every live file
carries that same `Last-Modified`. Nothing has been deployed since; the project
has been **frozen for 212 days**.

**What it is not:** not a Hostinger Git checkout (`/package.json`,
`/astro.config.mjs`, `/src/pages/index.astro` all 404 — the server holds build
output only), and not layered over a previous site (13 probes for legacy
artefacts all return the stock 404).

**Host behaviour, measured:** LiteSpeed on Hostinger. TTFB ~150–165 ms, total
load 0.22 s. `http→https` 301 preserves paths. Brotli **and** gzip served with
correct `Vary`, PNGs correctly left uncompressed. 304 revalidation works.
Directory listing off. TLS 1.0/1.1 refused; cert covers apex and `www`.

**⚠ The deployed tree is not a mirror of this repo.** HTML matches exactly, but
**13 of 38 `public/` files diverge**:

- **8 files present in `dist/` return 404 on the server** — `case-image-dexcom-02…05`,
  `case-image-nfq-02…04`, and `dexcom case study.pdf`. All 8 are files nothing
  links to.
- **3 images on the server are different binaries** — smaller, re-encoded
  versions that exist nowhere in this repo. `hero-portrait.png` is 284,361 B live
  vs 522,545 B in the repo (palette reduced 256→99 colours);
  `case-image-dexcom-01.png` and `case-image-nfq-01.png` were converted RGBA →
  colormap.
- **2 text files differ only in line endings** (`favicon.svg`, `site.webmanifest`
  are CRLF live, LF in the repo).

Divergence correlates exactly with the introducing commit: 3-of-3 initial-commit
assets differ, 0-of-17 from the two middle commits, 10-of-18 from the final asset
commit. That is not transfer corruption — it is the signature of a **hand-curated
upload folder** in which optimised originals were never replaced by the repo's
versions and unreferenced extras were never uploaded.

**For those 3 images, production is ahead of the repo.** A naive `dist/` mirror
in increment 9 would be a **regression**, roughly doubling the hero image. The
correct first move is to pull the live assets down and commit them.

**Still unknown:** the transfer client (hPanel File Manager vs FTP/SFTP vs
ZIP-and-extract), and whether an `.htaccess` already sits in `public_html`. HTTP
cannot answer the second — the host 403s the `.htaccess` filename whether or not
the file exists. **Thirty seconds in hPanel → File Manager → `public_html` with
hidden files shown answers both**, and is the single highest-value founder action
before increment 9 is designed.

---

## 3 · What is already correct — do not rebuild

The plan implicitly treats some of this as work. It is done:

- **Titles.** All 5 are unique, 48–75 chars, no truncation risk.
- **Prose.** Every placeholder grep except `example.com` is clean — no lorem, no
  TODO, no FIXME, no dummy text. The copy is real and specific.
- **Compression and caching of static assets.** Brotli + gzip with correct `Vary`;
  `cache-control: public, max-age=604800` on statics. Increment 5 must **extend**
  this, not replace it.
- **HTTPS.** `http→https` 301 preserving paths; modern TLS only; valid cert on
  both hostnames.
- **Server speed.** ~150 ms TTFB. There is nothing to win on the server side.
- **Build determinism.** `dist/` HTML reproduces production byte-for-byte.
- **Internal links.** 33 of 33 path-shaped internal references resolve.
- **SVG accessibility.** Every decorative `role="img"` SVG already carries
  `aria-hidden`.

---

## 4 · The real gap list

224 raw findings, deduplicated below. Severity is post-verification.

### Increment 1 — Critical SEO repair

The plan says "fix the canonical." **That is under-scoped by a factor of five.**

| Gap | Sev |
| --- | --- |
| `rel=canonical` on the homepage is `https://example.com` — live right now, telling Google to attribute the page to a domain the owner does not control | **Critical** |
| `og:url` is also `https://example.com` — same literal, same line, so one edit fixes both | **Critical** |
| **The 4 case-study pages have no canonical at all.** `CaseStudyLayout.astro` is a separate document with its own `<head>` that shares nothing with `Layout.astro` | **Critical** |
| `astro.config.mjs:5` `site: 'https://example.com'` is currently **inert** (nothing reads `Astro.site`) — but `@astrojs/sitemap` in increment 4 will silently emit five `example.com` URLs | **Critical** |
| `og:image` / `twitter:image` → `/og-image.jpg`, which **does not exist** and 404s. Every homepage share unfurls blank | **Critical** |
| `www.eivinasn.com` returns **200 with byte-identical content and no redirect** — the site is duplicated across hostnames with no disambiguating signal. The plan never mentions host canonicalisation | **High** |
| `/index.html` and `/work/<slug>/index.html` also serve 200 — 10 indexable URLs for 5 pages | **Medium** |
| Any query string returns 200 with identical content and no canonical to collapse it — every UTM-tagged share mints a new URL | **High** |

The literal edit is small — **two occurrences** (`Layout.astro:7`,
`astro.config.mjs:5`) — but the *increment* is not, because
`CaseStudyLayout.astro` needs canonical support built from scratch, and
`index.astro:9` calls `<Layout>` with **zero props**, so the prop plumbing is
dead code that no caller overrides.

### Increment 2 — Process foundation

| Gap | Sev |
| --- | --- |
| **9 of 10 commit messages are the literal string `your message`.** Git history carries zero information about what changed or why | **High** |
| All 10 commits are authored by `sootheandseoul`; the repo is owned by `heshipstech`. Local git has **no `user.name`/`user.email` at all** — a commit cannot be made until this is decided | **Medium** |
| README documents Vercel/Netlify deploy; reality is Hostinger/LiteSpeed. `.gitignore` also carries `.vercel/`, `.netlify/` | **Medium** |
| No `COMPONENTS.md`, and the component library is 4 files with two independently-maintained layouts that duplicate the same bugs | **Medium** |

### Increment 3 — CI gates

Nobody had looked here. Two findings make the increment **unrunnable as written**:

| Gap | Sev |
| --- | --- |
| **The typecheck gate cannot run.** No `tsconfig.json` and `@astrojs/check` is not installed — `astro check` has neither config nor binary | **High** |
| **The dep-audit gate is red on day one.** `npm audit` reports **13 vulnerabilities (9 high)**. For `sharp`/`rollup`/`postcss` npm's remediation is `astro@7.2.1` — a **three-major-version upgrade** | **High** |
| **The axe gate will fail immediately** — `link-name` (4 nameless links) and `color-contrast` (≥58 elements) are guaranteed violations. The plan puts CI (3) *before* the a11y fix (6) | **High** |
| Playwright smoke tests will **not** catch the JS-gated-content bug: `opacity:0` elements remain in the DOM and the accessibility tree, so `textContent` assertions pass while sighted users see nothing | **High** |
| No Node version pinned anywhere — CI has no defined runtime and the build is not reproducible | **Medium** |
| **The repo is private**, so ten CI gates plus a weekly cron consume a metered Actions allowance. Lighthouse/Playwright/axe are the expensive kind. The ladder never prices this | **Medium** |

### Increment 4 — SEO completion

| Gap | Sev |
| --- | --- |
| 4 of 5 pages have **no meta description, no OG tags, no Twitter card** — 80% of the site, and the pages most likely to be landed on from search | **High** |
| No `robots.txt` (404), no `sitemap.xml` (404), `@astrojs/sitemap` not installed | **High** |
| No JSON-LD of any kind. Plan wants `Person`; `WebSite` + `CreativeWork` also apply | **High** |
| No `404.astro`. **The Hostinger fallback 404 loads Google Analytics (`G-9Q6H0QETRF`, `UA-26575989-46`), GTM and doubleclick.net under the `eivinasn.com` origin, with no consent banner** — third-party tracking that is not the owner's, live today | **High** |
| Once `/og-image.jpg` exists it still needs to be an **absolute** URL; and no source asset exists to build it from — the only candidates are a 896×1200 portrait and four 540×302 thumbs vs the 1200×630 required. This is a design task, not a wiring task | **High** |
| `/favicon.ico` 404s. `apple-touch-icon` points at an **SVG**, which iOS does not support. `site.webmanifest` declares one SVG icon; Android install needs 192px and 512px PNGs | **Medium** |
| `public/favicon.svg` exists but is **referenced by nothing** — both layouts use `/logo-eivinas.svg`. Two different marks are in play | **Medium** |
| `/work/` returns **403**, not 404 — a crawler or link checker walking the hierarchy upward hits a hard error | **High** |

### Increment 5 — Security hardening

| Gap | Sev |
| --- | --- |
| **Absent on every response:** HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`. The only CSP is Hostinger's `upgrade-insecure-requests`, which has no directives and restricts nothing | **High** |
| **⚠ A naive CSP will blank the homepage.** Astro emits the reveal logic as an **inline** `<script type="module">`. `script-src 'self'` blocks it, `.is-visible` is never added, and ~20 content blocks stay at `opacity: 0`. Needs build-time hashes (5 inline scripts across 2 distinct bodies; 4 inline styles across 1) | **Critical** |
| HTML responses carry **no `Cache-Control` at all** — browsers fall back to heuristic freshness against a 7-month-old `Last-Modified`. A fix could be deployed and not seen | **High** |
| No `.htaccess` exists in the repo, yet the server already does 301s and injects a CSP header. **Something is configured server-side that is not in version control** — increment 5 risks overwriting behaviour it cannot see | **High** |
| `.htaccess` is not a build output. An SFTP mirror of `dist/` will either fail to upload it or delete it | **Medium** |
| `/site.webmanifest` is served as `text/plain`, so browsers may reject it — and LiteSpeed's cache rule keys off content-type, so it also gets no caching | **Medium** |

### Increment 6 — Accessibility

| Gap | Sev |
| --- | --- |
| **The "Go back" link on all 4 case studies has no accessible name.** The anchor wraps only an SVG; the visible words are a `<span>` *outside* it. It is the only in-page route from a case study back to the site | **Critical** |
| **`#52525B` = 2.64:1** on `#050505` — fails AA and even the 3:1 large-text floor. 35 rendered elements + 29 `::marker` declarations. **This includes half the homepage `<h1>`** | **Critical** |
| **`#1d4ed8` = 3.04:1** — 22 text uses including "Read More", the primary path into every case study | **Critical** |
| `#71717A` = 4.22:1 — 23 elements, all at 10–14px, so no large-text exemption | **High** |
| **~20 homepage blocks are `opacity: 0` and revealed only by JS, with no `<noscript>` anywhere.** JS off → everything below the hero is invisible | **High** |
| **With JS off, mobile has no navigation at all** — the four destinations exist only inside the JS-toggled panel, and the desktop copies are `display:none` below 768px | **High** |
| `<footer>` is nested **inside `<main>`** on all 5 pages, so it is never exposed as a `contentinfo` landmark | **High** |
| No skip link on any page. No `<header>`/banner landmark — the fixed nav sits in a bare `<div>` | **High** |
| No `prefers-reduced-motion` guard anywhere — not on the animations, not on `scroll-behavior: smooth` | **High** |
| Mobile menu has no focus management: focus never enters the panel, never returns to the trigger on Escape | **High** |
| **WCAG 2.2 SC 2.4.11** fails — no `scroll-padding-top` on `<html>` while a fixed nav overlays the viewport, so focused controls can sit under the nav | **Medium** |
| Case-study pages have **only 2 links each**, one of them nameless and one `href="#"` | **Medium** |
| No `:focus-visible` styling anywhere (design gap; not an axe violation) | **Medium** |
| 4 identical context-free "Read More" links; 4 thumbnails whose `alt` duplicates the adjacent `<h3>`; 10 case-study images with generic `alt` | **Medium** |
| 20 case-study `<section>`s are labelled by a `<span>`, not a heading, so the Situation/Task/Action/Result structure is invisible to assistive tech | **Medium** |

**Note:** the Tailwind tokens are effectively unused — the 7 colours in
`tailwind.config.cjs` are referenced exactly twice, both on `global.css:8`.
Everything else is a hardcoded arbitrary value (143× `[#A1A1AA]`, 104×
`[#EDEDED]`, 62× `[#52525B]`). **The two worst contrast offenders are not in the
token list at all**, so fixing the tokens fixes nothing.

### Increment 7 — Performance

The plan says measure first. Measured:

| | |
| --- | --- |
| Homepage first load | **944,955 B (~923 KiB)** over **18 requests** to **3 origins** |
| Images | **797,882 B — 98.4%** of it |
| JavaScript | 894 B. There is no JS problem |
| Server | ~150 ms TTFB, 0.22 s total |

| Gap | Sev |
| --- | --- |
| Every photographic asset is PNG; 13 PNGs over 100 KB total 3.22 MB. AVIF q70 cuts the homepage raster payload **85.7%** (781,023 → 111,973 B) | **High** |
| **Zero responsive images** — 0 `srcset`, 0 `sizes`, 0 `<picture>` across 22 `<img>`. Images are simultaneously **over**-delivered at 1× and **under**-delivered at 2× — "just compress them" is not sufficient | **High** |
| **16 of 22 images have no width/height** and no aspect-ratio protection (6 are already protected) — direct CLS exposure | **High** |
| No `loading="lazy"` anywhere; 4 below-fold thumbnails (496 KB) load eagerly against the LCP hero | **High** |
| No `fetchpriority`/`preload` on the LCP image | **Medium** |
| Astro's image pipeline is **entirely unused** despite `sharp` already being installed — everything is raw `<img>` to `/public`, copied byte-for-byte | **High** |
| Google Fonts CDN: one render-blocking cross-origin stylesheet, two extra origins, visitor IPs to a third party. **Smaller than it looks** — Inter resolves to a single variable-font file | **Medium** |
| All 4 internal case-study links omit the trailing slash and eat a **301 on every click and every crawl** | **Medium** |

### Increments 8–10

| Gap | Sev |
| --- | --- |
| No analytics or monitoring — zero visibility into traffic, and **no RUM baseline to measure increment 7 against** | **Medium** |
| No ownership verification — no meta tag, no DNS TXT. Neither Search Console nor Bing has been started | **Medium** |
| **Increment 10 has no measured starting point.** Whether the 7-month-old off-domain canonical has already deindexed the site is unknown — and the plan schedules the damage assessment *last* | **Medium** |

### Not in the plan at all

| Gap | Sev |
| --- | --- |
| **15 of 38 `public/` files (1.27 MB, 34%) are referenced by nothing** and ship to production as dead weight | **Medium** |
| **Two case studies are visibly unfinished.** Dexcom ships 5 images and renders 1; NFQ ships 4 and renders 1. Vinted and VMI render all 4. The unused Dexcom assets are 446/383/380 KB — finished work, not stubs | **Medium** |
| `e.norusaitis@gmail.com` appears in plain unobfuscated HTML **4 times**, fully scrapeable | **Medium** |
| The 4 case studies have **no contact route at all** — no email, no footer, no booking link. A visitor from search can only convert by navigating back | **Medium** |
| `dexcom case study.pdf` is committed, built, linked from nothing, and 404s on live | **Medium** |

---

## 5 · Where the plan is wrong

1. **"Fix the canonical" is one line; increment 1 is not.** Four overlapping
   canonicalisation failures must be fixed together — canonical, `og:url`, the
   four pages with no canonical, and the `www`/apex/`index.html` duplication —
   or the fix is cosmetic.
2. **The live site is not this repo.** The plan assumes the repo is the source of
   truth. For three images, production is ahead of it.
3. **Increment 3 before increment 6 puts CI red on day one.** Axe will fail on
   `link-name` and `color-contrast` immediately. Either fix accessibility first,
   or land the gates with a documented baseline and burn it down.
4. **Increment 5's CSP will blank the homepage** unless inline-script hashes are
   computed at build time. A static SFTP deploy to LiteSpeed cannot generate a
   nonce.
5. **Increment 5 risks regressing the host.** Compression and static caching
   already work correctly. Extend, don't replace.
6. **The plan credits Hostinger with less than it does** (brotli, 304s, TLS
   policy, dotfile denylist) and with more elsewhere — the "AI-crawler decision"
   and "compression" line items are partly already answered.
7. **`pnpm audit` is specified; the repo is npm.** One of the two must change.
8. **The plan treats the project as active.** It has been frozen 212 days. If the
   real pattern is one burst every few months, front-load what survives neglect
   (canonical, robots/sitemap, headers) and defer machinery that decays or nags.

### ⚠ Ordering risk — the biggest one

**Increments 1–8 all produce repo changes, and the repo has no path to
production.** No CI, no deploy script, no deploy tooling; the only deploy in
project history was a manual upload 212 days ago. Increment 9 — the only
increment that creates a delivery path — is specified as *dormant until armed*.

**So the critical canonical fix in increment 1 does not reach eivinasn.com until
increment 9 runs.** Three ways out, and it is a founder call:

- move increment 9's build-and-upload half to position 2, or
- attach an explicit manual-deploy step to increment 1, or
- accept that `example.com` stays live for the duration of the programme.

---

## 6 · Founder decisions

These carry into QUESTIONS.md in increment 2. Ordered by what blocks soonest.

### Ruled — 2026-08-13

1. **Deploy-first or plan-order? → RULED: follow the plan as written.**
   The ladder runs 1→10 in order. Accepted consequence: `rel=canonical` continues
   to point at `https://example.com` on the live site until increment 9 completes,
   because no increment before 9 can reach production. Increments 1–8 are verified
   against the local build, not against eivinasn.com.
2. **Git identity? → RULED: `heshipstech <e.norusaitis@gmail.com>`.**
   Set repo-locally, not globally. History before 2026-08-13 remains authored by
   `sootheandseoul`; nothing is rewritten. This is also the account that will hold
   the deploy secrets in increment 9.
3. **`.htaccess` on the server → founder is checking hPanel** (File Manager →
   `public_html`, hidden files shown; plus the hPanel Git page for any configured
   auto-deploy). Increment 5 is blocked on the answer, or must be written
   read-before-write. Answer pending.

### Open

4. **Astro 4 → 7, or accept 9 high-severity advisories?** A three-major upgrade
   on a 1,488-line site is likely a day's work and would also unlock the image
   pipeline. Blocks increment 3's audit gate.
5. **npm or pnpm?** The plan says pnpm; the repo is npm.
6. **Which mark is the brand?** `favicon.svg` and `logo-eivinas.svg` are
   different designs. Blocks the favicon set in increment 4.
7. **Trailing slash convention.** Must be decided before the sitemap is
   generated, or sitemap URLs will disagree with the server's 301s.
8. **The 3 divergent live images** — is the optimised production version
   authoritative? If so, pull them down and commit them before increment 9.
9. **Finish or delete the unused case-study images?** Dexcom and NFQ each render
   one of their shipped set.
10. **The PDF** — wire it up, delete it, or keep it as an unlinked direct-share
    URL (which currently does not work, as it 404s).
11. **Expose the Gmail address, or route contact differently?**
12. **Analytics vendor** (plan recommends Cloudflare Web Analytics or Umami) —
    note that Hostinger's own GA already fires on 404s today.
13. **AI crawlers** — allow or block in robots.txt.
14. **Private repo CI budget** — ten gates plus a weekly cron on metered minutes.

---

## 7 · Ladder as it now stands

Deploy ordering was ruled on: **the plan runs 1→10 as written**. One ordering
recommendation remains open, and it is the only one still worth raising.

| # | Increment | Note |
| --- | --- | --- |
| 1 | Critical SEO repair | **Scope is all 5 pages**, not just `Layout.astro` — plus `astro.config.mjs`, `og:image`, and the `www`/`index.html` duplication. Verified against the local build; ships at increment 9 |
| 2 | Process foundation | + commit convention (history is 9× `your message`), + the rulings above |
| 3 | CI gates | **⚠ Cannot go green as specified.** Axe fails on day one; typecheck has no config or binary; dep-audit needs the Astro decision |
| 4 | SEO completion | unchanged |
| 5 | Security hardening | **Build-time CSP hashes required** or the homepage blanks. Extend the host's config, don't replace it. Blocked on the hPanel check |
| 6 | Accessibility pass | unchanged |
| 7–10 | as written | unchanged |

**Still open — increment 3 vs 6.** Landing the CI gates before the accessibility
fixes means axe goes red immediately on `link-name` and `color-contrast`. Either
swap 3 and 6, or land the gates with a documented baseline and burn it down. This
is a smaller call than the deploy ordering and can wait until increment 2.

---

## 8 · Not verified

Recorded so nobody assumes these were checked.

- Whether an `.htaccess` already exists in `public_html`. HTTP cannot answer it —
  the host 403s the filename regardless. Needs hPanel or SFTP.
- The exact transfer client used for the 2026-01-12 upload.
- Which side is authoritative for the 3 divergent images, and who produced the
  live variants.
- **Current index status of eivinasn.com** in Google or Bing, and whether the
  `example.com` canonical has already caused deindexing. The independent check was
  rate-limited; this needs Search Console.
- Whether GitHub Actions is enabled, its allowance, and whether branch protection
  exists.
- Whether each of the 13 npm advisories reaches the production build path or only
  build tooling. For a static site most are likely build-time only.
- **LCP and CLS were not measured** — headless measurement failed because the tab
  backgrounds and never paints. The image-weight and missing-dimension numbers are
  solid; the Core Web Vitals numbers are not yet real.
- Whether Astro copies `public/.htaccess` into `dist/`. Cheap to test and worth
  doing before increment 5.
