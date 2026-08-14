# CLAUDE.md — standing rules for eivinasn.com

Read this before doing anything else in this repo.

Companion documents: [BACKLOG.md](BACKLOG.md) (what to work on next),
[QUESTIONS.md](QUESTIONS.md) (decisions and their rulings),
[COMPONENTS.md](COMPONENTS.md) (the component library),
[ORIENTATION.md](ORIENTATION.md) (the dated audit this programme is based on).

---

## 1 · What this is

A personal portfolio for Eivinas Norušaitis, live at https://eivinasn.com/.
Static Astro, hosted on LiteSpeed/Hostinger. Six pages in the sitemap — the
landing page, four case studies and the privacy notice — plus a custom 404.

**The content, design, photography, icons and copy are finished and approved
(founder, 2026-08-13). They are not to be redesigned, rewritten or "improved."**
Work in this repo is engineering: metadata, accessibility, performance,
security, CI and deploy. If a change would alter the visual design, it needs an
explicit reason, a recorded ruling in QUESTIONS.md, and a before/after the
founder can review.

## 2 · Stack

|                 |                                                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------------------------------- |
| Framework       | Astro **7.2.1** — upgraded from 4.16.19 in `223f308`; [Q3](QUESTIONS.md#q3) reversed                                 |
| Styling         | Tailwind **4.3.3** via `@tailwindcss/postcss`. No `tailwind.config.cjs`, no `@astrojs/tailwind`                      |
| Package manager | **npm.** Not pnpm, not yarn — see [Q4](QUESTIONS.md#q4)                                                              |
| Node            | See `.nvmrc` (22). CI reads it via `node-version-file`; run `nvm use` locally before quoting any measurement         |
| Version policy  | `package.json` uses caret ranges; reproducibility comes from `package-lock.json` and `npm ci`, not from the manifest |
| Output          | Static. `npm run build` → `dist/`. No SSR, no adapter, no server runtime                                             |
| Host            | LiteSpeed on Hostinger. `.htaccess` applies                                                                          |

## 3 · Hard constraints

- **Static only.** No SSR, no API routes, no server-side anything. The host
  serves files.
- **No client-side framework.** Current client JS is under 1 KB. Keep it that
  way; prefer zero JS to a little JS.
- **No third-party runtime dependencies in the page** without a recorded ruling.
  Every external origin costs DNS + TLS and widens the CSP.
- **`site` in `astro.config.mjs` must always be the real production origin.**
  A placeholder there silently poisons canonicals and the sitemap.
- **Trailing slash is the canonical URL form** (`/work/dexcom/`). It matches the
  301 the server already performs. Internal links must include it.

## 4 · Budgets

Measured, never guessed. Enforced by `npm run measure:perf`.

The budgets are the real post-increment-7 measurements plus roughly 25%
headroom: enough to absorb an ordinary edit, tight enough that a regression
trips them. The first version of this table was written before increment 7 and
was mostly invention — a 400 KB budget against a 109 KB page catches nothing.

Desktop, homepage. The `Now` column was re-measured on 2026-08-14 from
`npm run measure:perf` on `e6703a6`; the previous values predated the Astro 7
upgrade and five of the eight had drifted.

| Metric               | Before (2026-08-13) | Now          | Budget    |
| -------------------- | ------------------- | ------------ | --------- |
| Homepage transfer    | 945 KB              | **107.8 KB** | ≤ 150 KB  |
| Largest single image | 284 KB              | 13.3 KB      | ≤ 60 KB   |
| Client JS            | 894 B               | 1.3 KB       | ≤ 5 KB    |
| CSS                  | 24 KB               | 7.2 KB       | ≤ 10 KB   |
| Requests, first load | 18                  | 15           | ≤ 20      |
| CLS                  | unmeasured          | **0**        | ≤ 0.1     |
| LCP                  | unmeasured          | 32 ms        | ≤ 1500 ms |
| Axe violations       | 58+ predicted       | **0**        | 0         |

Mobile is measured separately, at 390px with 4× CPU throttling on a slow-4G
profile, and judged against Core Web Vitals rather than the desktop numbers.
Added in `0622399`, after a 320px horizontal overflow between 768 and 1087px
reached production precisely because everything here had been measured at one
desktop width.

| Metric (mobile)   | Now       | Budget    |
| ----------------- | --------- | --------- |
| Homepage transfer | 107.7 KB  | ≤ 150 KB  |
| Homepage LCP      | 656 ms    | ≤ 2500 ms |
| Case-study LCP    | 780 ms    | ≤ 2500 ms |
| CLS               | 0 on both | ≤ 0.1     |

Client JS is measured as **inline module bytes**, not as JS responses — Astro 7
inlines every script this site has, so counting responses measured a constant
zero until `e6703a6`. Axe violations are gated by `npm run verify:a11y`, not by
`measure:perf`.

Request count is deliberately loose. Six of the fifteen are small company-logo
SVGs on an HTTP/2 connection; multiplexing makes that cost close to nothing, and
inlining them would put an approved design at risk to save milliseconds. Bytes,
CLS and LCP are the budgets that matter here.

## 5 · Definition of done

An increment is done when **all** of these hold:

1. `npm run build` succeeds with no new warnings.
2. Every claim in the commit message was **measured**, not reasoned about. Cite
   the command and its real output.
3. The change is scoped to one increment. No opportunistic edits riding along.
4. The diff was inspected against the previous build — you know exactly which
   lines changed and why. An unexplained line is a bug.
5. Anything that could not be verified is stated as unverified, in the commit
   message and in BACKLOG.md.
6. One commit, with a real message. Never `your message`.
7. Once CI exists (increment 3): all gates green, verified **by commit SHA**,
   never by trusting a watcher's exit code.

## 6 · Working agreements

- **Small verified increments.** One commit each. Nothing starts before the
  previous increment's checks pass.
- **Measure, don't reason.** "This should work" is not verification. Run it.
- **Flag interpretations as interpretations.** Do not present a judgement call
  as a fact.
- **When the founder's screenshot disagrees with a measurement, the screenshot
  is right.** Verify in pixels, not coordinates.
- **Every founder decision goes in QUESTIONS.md** with the ruling and the date,
  so no decision has to be remembered.
- **Never handle credentials.** Deploy secrets are added by the founder as
  GitHub secrets and are never read, echoed, or committed.

## 7 · Traps in this specific codebase

Learned the hard way. Do not rediscover these.

- **Two layouts, one head.** `Layout.astro` and `CaseStudyLayout.astro` are
  separate HTML documents. They share `BaseHead.astro` and nothing else. A
  `<body>`-level change must be made in both, deliberately.
- **There is no Tailwind config file.** Tailwind 4 is configured by `@import` in
  `src/styles/global.css`; `tailwind.config.cjs` was deleted by the upgrade in
  `248811b`. Every real colour is a hardcoded arbitrary value
  (`text-[#A1A1AA]` ×146). Grep for the hex — there is no config to edit.
- **~20 homepage blocks are `opacity: 0` until JavaScript reveals them.**
  `.reveal-on-scroll`, driven by `RevealScript.astro`. Still true, and still the
  highest-risk thing here. **Assert visibility, never presence** — an
  `opacity: 0` element still has `textContent` and still appears in the
  accessibility tree, so a naive Playwright assertion passes while sighted users
  see nothing. A `<noscript>` fallback and a reduced-motion override now cover
  the degraded cases.
  An IntersectionObserver alone was not enough: it never fires for an element a
  jump skips over, so landing on `/#competencies` stranded 7 blocks invisible.
  `RevealScript` sweeps by position for exactly this reason — do not "simplify"
  it back to a bare observer.
- **CSP hashes are generated, not written — for `script-src` as well as
  `style-src`.** `scripts/generate-htaccess.mjs` computes both from `dist/` on
  every build. A hand-maintained list goes stale silently and the failure mode
  is an unstyled page or a dead reveal script. This entry said `script-src`
  needed no hashes until 2026-08-14: true under Astro 4, which hoisted every
  script to an external module, **false under Astro 7, which inlines the small
  ones.** The current build carries 2 script hashes and 2 style hashes. A
  `script-src 'self'` with no hashes leaves ~20 homepage blocks at `opacity: 0`.
- **Never use an inline `style="…"` attribute.** A CSP cannot hash one, so a
  single inline style forces `style-src-attr 'unsafe-inline'` site-wide. Use a
  class; `.anim-delay-1..6` already exist for animation stagger.
- **`public/` is not processed by Astro.** Files there are copied byte-for-byte.
  Images live in `src/assets/` and go through `<Picture>`; icons, fonts, logos,
  the OG cards and the search-engine verification tokens remain in `public/`.
  Seven files there are referenced by nothing and still ship —
  `favicon.svg` and six `logo-*.png` twins of SVGs that are the ones actually
  used (5,709 B, all live on the server). They survived the [Q10](QUESTIONS.md#q10)
  sweep. Deleting them was blocked by the tooling on 2026-08-14; see
  [AUDIT-2026-08-14.md](AUDIT-2026-08-14.md) Phase 5.
- **The fonts are subsetted to the glyphs actually in use.** If the copy gains a
  character outside Latin-1, re-run `npm run generate:fonts` after a build or it
  will render in the fallback face.
- **The live server is not a mirror of this repo.** 13 of 38 `public/` files
  diverge, and for 3 images production is _ahead_ of the repo. Never assume a
  `dist/` mirror is safe — see [Q8](QUESTIONS.md#q8).
- **Something configures the server that is not in this repo.** The 301s and the
  injected CSP header come from somewhere. Increment 5 must read before it
  writes — see [Q9](QUESTIONS.md#q9).
- **Hostinger bans the CI runner's IP** after roughly a dozen SSH deploys in a
  day. Deploy sparingly.
- **This repo is PUBLIC** (since `3b24b5a`, and in fact since the day it was
  created — see [NEEDS-REVIEW.md](NEEDS-REVIEW.md) §1). Anything committed here
  is published, including docs. Several older notes still reason from "private
  repo"; treat that premise as dead wherever you meet it.
- **A force-push does not delete anything from GitHub.** Unreferenced objects
  stay fetchable by SHA, and GitHub publishes every pre-rewrite SHA on its own
  public events feed. Verifying a purge "from a fresh clone" cannot detect this,
  because a clone only walks refs. See [NEEDS-REVIEW.md](NEEDS-REVIEW.md) §1.
- **`npm audit` is clean** as of 2026-08-14 — the Astro 4 advisories were
  resolved by the Astro 7 upgrade in `223f308`, which reversed [Q3](QUESTIONS.md#q3).
  If it goes red again, judge reachability first: this is a static build, so
  Astro never runs at request time and the exposure is the build machine and CI.
- **zsh: `status` is read-only.** Never use it as a loop variable.
- **Prettier renumbers markdown ordered lists.** QUESTIONS.md uses stable `Q<n>`
  anchors, never list numbering. Append; never renumber.
