# BACKLOG.md — increment ladder and status

One commit per increment. Nothing starts before the previous increment's checks
pass. Source of the ladder: `portfolio-uplift-plan.md`; source of the gap list:
[ORIENTATION.md](ORIENTATION.md).

Status: ✅ done · 🔄 in progress · ⏸ blocked · ⬜ not started

| #   | Increment              | Status | Commit                                                  |
| --- | ---------------------- | ------ | ------------------------------------------------------- |
| 0   | Orientation            | ✅     | `8337a49`                                               |
| 1   | Critical SEO repair    | ✅     | `28fd664`                                               |
| 2   | Process foundation     | ✅     | `ce2bdd9`                                               |
| 3   | Accessibility pass     | ✅     | `503ad52` _(swapped with CI — [Q15](QUESTIONS.md#q15))_ |
| 4   | SEO completion         | ✅     | `35b4e35`                                               |
| 5   | Security hardening     | ✅     | `ca2912e` · _deploy_ gated on [Q9](QUESTIONS.md#q9)     |
| 6   | CI gates               | ⬜     | _(swapped with accessibility)_                          |
| 7   | Performance budgets    | ✅     | `b90007a`                                               |
| 8   | Analytics + monitoring | ✅     | `83fd43c` · founder must arm                            |
| 9   | Deploy pipeline        | ⬜     |                                                         |
| 10  | Indexing               | ⬜     | founder-only; needs Search Console access               |

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

## 5 · Security hardening ✅

Built and verified. **Deploying it is still gated on [Q9](QUESTIONS.md#q9)** —
whether an `.htaccess` already exists on the server — but nothing deploys before
increment 9 anyway, so this was never a build-time blocker.

- `config/htaccess.template` → `dist/.htaccess`, generated at build time by
  `npm run generate:htaccess` so the CSP hashes always match the build that was
  produced. A hand-maintained hash list goes stale silently, and a stale
  `style-src` hash ships the case studies unstyled.
- CSP is strict: `default-src 'none'`, `script-src 'self'` with **no hashes and
  no `unsafe-inline`** — hoisting the scripts in increment 3 removed every
  inline script. `style-src` carries exactly 2 hashes plus Google Fonts.
- HSTS (no `preload` — one-way door, founder's call), `nosniff`, `X-Frame-Options:
DENY` + `frame-ancestors 'none'`, `Referrer-Policy`, `Permissions-Policy`,
  COOP/CORP.
- `Cache-Control: no-cache` on HTML — documents previously had none at all — and
  `immutable` on content-hashed `/_astro/`.
- `application/manifest+json` for `.webmanifest`, which was served as
  `text/plain`.
- `/work/` 403 → 404 via rewrite.
- **Compression and static caching deliberately omitted.** The host already does
  brotli + gzip with correct `Vary` and leaves PNGs alone. Re-declaring it risks
  replacing something that works.

`npm run verify:csp` serves `dist/` with the real headers and asserts zero CSP
violations, zero console errors, nothing stranded and styles applied. It caught
a real failure: 25 inline `style="animation-delay: …"` attributes cannot be
hashed, and would have forced `style-src-attr 'unsafe-inline'` site-wide. They
are now CSS classes and the policy needs no relaxation. It also confirmed
empirically that `<script type="application/ld+json">` is a data block and is
not subject to `script-src`.

## 6 · CI gates ✅

Lean, per [Q14](QUESTIONS.md#q14) — private repo, metered minutes. One
workflow, two jobs, Chromium cached, **every action pinned to a commit SHA**.

`npm run verify` runs the whole suite locally, in the same order CI does:

| Gate            | Command                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| Format          | `format:check` (Prettier)                                                |
| Typecheck       | `typecheck` (`astro check`, strict)                                      |
| Build           | `build`                                                                  |
| HTML validation | `validate:html` (html-validate)                                          |
| Link check      | `check:links`                                                            |
| Accessibility   | `verify:a11y` (axe + skip link, reduced motion, no-JS, stranded content) |
| CSP             | `verify:csp`                                                             |
| Performance     | `measure:perf`                                                           |
| Dependencies    | `audit` (separate job, also weekly)                                      |

Everything green on the commit that introduced it — the point of
[Q19](QUESTIONS.md#q19).

Not included, with reasons recorded: **ESLint** ([Q17](QUESTIONS.md#q17) — under
1 KB of first-party JS, and `astro check` already found the real bugs) and
**Lighthouse** ([Q18](QUESTIONS.md#q18) — `measure:perf` checks the same budgets
directly and avoids both Lighthouse traps the plan warns about).

The dependency job gates on **critical** only and prints the accepted
high-severity advisories to the run summary on every run, so the
[Q3](QUESTIONS.md#q3) exception stays visible instead of becoming folklore.

Typecheck found real defects on first run: implicit `any` in the reveal sweep, a
nullable `EventTarget` and an arity mismatch in the nav toggle. HTML validation
found a `<button>` with no `type` and two `<nav>` landmarks sharing no
distinguishable name on the 404 page.

## 7 · Performance budgets ✅

**Homepage 945 KB -> 109 KB (-88%). CLS 0. LCP 84 ms.** Enforced by
`npm run measure:perf`; budgets in CLAUDE.md §4 are now measured rather than
guessed.

|                     | Before                        | After                  |
| ------------------- | ----------------------------- | ---------------------- |
| Homepage transfer   | 945 KB                        | **109 KB**             |
| Case study transfer | ~800 KB                       | **71-88 KB**           |
| Largest image       | 284 KB                        | 43 KB                  |
| Fonts               | 134 KB, 2 third-party origins | **34 KB, self-hosted** |
| CLS / LCP           | unmeasured                    | **0** / 84 ms          |

- 15 referenced images moved `public/` -> `src/assets/` and rendered through
  `<Picture>` with AVIF + WebP + PNG fallback, `widths`/`sizes`, explicit
  dimensions, `loading="lazy"` below the fold and `fetchpriority="high"` on the
  LCP hero. Astro's pipeline was previously unused despite `sharp` being
  installed.
- Inter self-hosted, removing two origins from the critical path and every
  visitor's IP from a third party — and letting the CSP drop to `'self'` for
  both `style-src` and `font-src`.
- Fonts subsetted to the glyphs actually used: latin-ext went 85,272 B -> 1,812 B
  (**-97.9%**). It existed to carry one character, the š in "Norušaitis".

Closes [Q8](QUESTIONS.md#q8).

## 8 · Analytics + monitoring ✅

Built as a slot, not a choice ([Q13](QUESTIONS.md#q13)). `Analytics.astro`
renders **nothing** unless `PUBLIC_ANALYTICS_PROVIDER` and `PUBLIC_ANALYTICS_ID`
are both set at build time. Supports Cloudflare Web Analytics, Plausible and
Umami — all cookieless, none needing a consent banner.

The CSP is derived from the same environment variables, so arming analytics
widens `script-src`/`connect-src` automatically. A hand-edited CSP would
silently block the very script it was armed for.

Verified in all four states: disarmed (nothing emitted, CSP unchanged), armed
Cloudflare, armed self-hosted Umami (host flows into both the script URL and the
CSP), and incomplete config (warns loudly, emits nothing).

**Founder tasks, none of which Claude can do:**

- Pick a vendor and create the account. Cloudflare Web Analytics is free and
  needs only a beacon token.
- Set the variables — see `.env.example`.
- Add a free uptime monitor.
- Add a short privacy note **only once analytics is armed**. Today the site
  collects nothing, so a privacy page would be inaccurate.

Note: there is still no RUM baseline, so increment 7's gains are measured in the
lab only. That is the main argument for arming analytics.

## 9 · Deploy pipeline ✅

`.github/workflows/deploy.yml`. **Dormant** — every step is gated on the
repository variable `DEPLOY_ENABLED`, so until the founder sets it the workflow
runs, skips everything and reports success.

Build → all gates → protect `.htaccess` → rsync `dist/` → smoke test the live
URL. Manual dispatch only, defaulting to a dry run: Hostinger bans the runner IP
after roughly a dozen SSH connections in a day.

- **Refuses to clobber an `.htaccess` it did not create** ([Q9](QUESTIONS.md#q9)).
  The generated file carries a `GENERATED FILE` marker; if the remote one lacks
  it, the deploy stops with instructions rather than replacing working config.
  An override exists and takes a timestamped backup first.
- **`--delete` is off by default.** The server holds files this repo has never
  seen, and search-console verification files must survive a deploy.
- Zero third-party actions; both `actions/*` pinned to commit SHAs.
- Secrets are referenced, never echoed, and the key is removed in an `always()`
  step.

`npm run smoke` verifies production directly: all 5 pages self-canonical with no
placeholder domain, every asset the metadata promises, all six security headers
with a CSP that has real directives, slashless redirect, custom 404 with no
third-party tracking, `/work/` returning 404 not 403, and every sitemap URL
resolving.

Run against production today it reports **22 failures** — exactly the audit
findings. That is the correct answer, and it is the measure of what increment 9
will fix the moment it is armed.

**This is the increment that finally ships increment 1's canonical fix.**

## 10 · Indexing ⬜

Founder-only — needs Search Console and Bing Webmaster access.

- Verify both consoles; verification files live in `public/` so the deploy
  cannot delete them.
- Submit the sitemap; request indexing.
- **Establish whether the 7-month-old off-domain canonical caused deindexing.**
  This has never been measured — see ORIENTATION.md §8.

---

## Out of ladder

| Item                     | Owner        | Note                                                                                                                         |
| ------------------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Astro 4 → 7 upgrade      | Claude       | Deferred past increment 10 ([Q3](QUESTIONS.md#q3)). Also unlocks the image pipeline properly                                 |
| Unused case-study images | Founder      | [Q10](QUESTIONS.md#q10) — 1.27 MB shipping unreferenced                                                                      |
| `dexcom case study.pdf`  | Founder      | [Q11](QUESTIONS.md#q11)                                                                                                      |
| Divergent live images    | Founder      | [Q8](QUESTIONS.md#q8) — may close automatically at increment 7                                                               |
| `www` → apex redirect    | Founder/host | Both hostnames serve 200 with no redirect. Canonical now disambiguates for search, but a host-level redirect is the real fix |
| Commit history           | —            | 9 of 10 pre-2026-08-13 commits say `your message`. Not rewritten                                                             |
