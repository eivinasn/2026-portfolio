# CLAUDE.md — standing rules for eivinasn.com

Read this before doing anything else in this repo.

Companion documents: [BACKLOG.md](BACKLOG.md) (what to work on next),
[QUESTIONS.md](QUESTIONS.md) (decisions and their rulings),
[COMPONENTS.md](COMPONENTS.md) (the component library),
[ORIENTATION.md](ORIENTATION.md) (the dated audit this programme is based on).

---

## 1 · What this is

A five-page personal portfolio for Eivinas Norušaitis, live at
https://eivinasn.com/. Static Astro, hosted on LiteSpeed/Hostinger.

**The content, design, photography, icons and copy are finished and approved
(founder, 2026-08-13). They are not to be redesigned, rewritten or "improved."**
Work in this repo is engineering: metadata, accessibility, performance,
security, CI and deploy. If a change would alter the visual design, it needs an
explicit reason, a recorded ruling in QUESTIONS.md, and a before/after the
founder can review.

## 2 · Stack

| | |
| --- | --- |
| Framework | Astro 4.16.19 — **pinned; see [Q3](QUESTIONS.md#q3)** |
| Styling | Tailwind 3.4.19 via `@astrojs/tailwind`, `applyBaseStyles: false` |
| Package manager | **npm.** Not pnpm, not yarn — see [Q4](QUESTIONS.md#q4) |
| Node | See `.nvmrc`. CI and local must match |
| Output | Static. `npm run build` → `dist/`. No SSR, no adapter, no server runtime |
| Host | LiteSpeed on Hostinger. `.htaccess` applies |

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

Set from measurements taken 2026-08-13, not from convention. Current numbers are
the ceiling — nothing may get worse.

| Metric | Baseline (2026-08-13) | Budget |
| --- | --- | --- |
| Homepage total transfer | 945 KB | **≤ 400 KB** after increment 7 |
| Largest single image | 284 KB | **≤ 150 KB** |
| Client JS | 894 B | **≤ 5 KB** |
| CSS | 24 KB | **≤ 35 KB** |
| Requests, first load | 18 | **≤ 15** |
| TTFB | ~150 ms | no regression |
| Axe violations | see BACKLOG | **0** |

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
- **The Tailwind tokens are decorative.** The palette in `tailwind.config.cjs`
  is referenced exactly twice in the whole codebase. Every real colour is a
  hardcoded arbitrary value (`text-[#A1A1AA]` ×143). Editing the config changes
  almost nothing — grep for the hex instead.
- **~20 homepage blocks are `opacity: 0` until JavaScript reveals them.**
  `.reveal-on-scroll` + an inline IntersectionObserver. Consequences: a
  `script-src 'self'` CSP blanks the page; Playwright `textContent` assertions
  pass while sighted users see nothing; there is no `<noscript>` fallback.
- **A strict CSP needs build-time hashes.** The reveal script is inline and a
  static host cannot generate a nonce.
- **`public/` is not processed by Astro.** Files there are copied byte-for-byte.
  Images must move to `src/assets/` to get the image pipeline.
- **The live server is not a mirror of this repo.** 13 of 38 `public/` files
  diverge, and for 3 images production is *ahead* of the repo. Never assume a
  `dist/` mirror is safe — see [Q8](QUESTIONS.md#q8).
- **Something configures the server that is not in this repo.** The 301s and the
  injected CSP header come from somewhere. Increment 5 must read before it
  writes — see [Q9](QUESTIONS.md#q9).
- **Hostinger bans the CI runner's IP** after roughly a dozen SSH deploys in a
  day. Deploy sparingly.
- **`npm audit` is red and mostly noise.** The advisories are build-time only for
  a static site — see [Q3](QUESTIONS.md#q3) before "fixing" them.
- **zsh: `status` is read-only.** Never use it as a loop variable.
- **Prettier renumbers markdown ordered lists.** QUESTIONS.md uses stable `Q<n>`
  anchors, never list numbering. Append; never renumber.
