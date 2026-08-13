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

|                 |                                                                          |
| --------------- | ------------------------------------------------------------------------ |
| Framework       | Astro 4.16.19 — **pinned; see [Q3](QUESTIONS.md#q3)**                    |
| Styling         | Tailwind 3.4.19 via `@astrojs/tailwind`, `applyBaseStyles: false`        |
| Package manager | **npm.** Not pnpm, not yarn — see [Q4](QUESTIONS.md#q4)                  |
| Node            | See `.nvmrc`. CI and local must match                                    |
| Output          | Static. `npm run build` → `dist/`. No SSR, no adapter, no server runtime |
| Host            | LiteSpeed on Hostinger. `.htaccess` applies                              |

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

The first version of this table was written before increment 7 and was mostly
invention — a 400 KB budget against a 109 KB page catches nothing. These numbers
are the real post-increment-7 measurements plus roughly 25% headroom: enough to
absorb an ordinary edit, tight enough that a regression trips them.

| Metric               | Before (2026-08-13) | Now        | Budget    |
| -------------------- | ------------------- | ---------- | --------- |
| Homepage transfer    | 945 KB              | **109 KB** | ≤ 150 KB  |
| Largest single image | 284 KB              | 43 KB      | ≤ 60 KB   |
| Client JS            | 894 B               | 0.8 KB     | ≤ 5 KB    |
| CSS                  | 24 KB               | 5.8 KB     | ≤ 10 KB   |
| Requests, first load | 18                  | 17         | ≤ 20      |
| CLS                  | unmeasured          | **0**      | ≤ 0.1     |
| LCP                  | unmeasured          | 84 ms      | ≤ 1500 ms |
| Axe violations       | 58+ predicted       | **0**      | 0         |

Request count is deliberately loose. Seven of the seventeen are small
company-logo SVGs on an HTTP/2 connection; multiplexing makes that cost close to
nothing, and inlining them would put an approved design at risk to save
milliseconds. Bytes, CLS and LCP are the budgets that matter here.

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
- **CSP hashes are generated, not written.** `scripts/generate-htaccess.mjs`
  computes `style-src` hashes from `dist/` on every build. A hand-maintained list
  goes stale silently and the failure mode is an unstyled page. `script-src`
  needs no hashes — Astro hoists every script to an external module.
- **Never use an inline `style="…"` attribute.** A CSP cannot hash one, so a
  single inline style forces `style-src-attr 'unsafe-inline'` site-wide. Use a
  class; `.anim-delay-1..6` already exist for animation stagger.
- **`public/` is not processed by Astro.** Files there are copied byte-for-byte.
  Images live in `src/assets/` and go through `<Picture>`; only icons, fonts,
  logos, the OG image and the unreferenced assets from [Q10](QUESTIONS.md#q10)
  remain in `public/`.
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
- **`npm audit` is red and mostly noise.** The advisories are build-time only for
  a static site — see [Q3](QUESTIONS.md#q3) before "fixing" them.
- **zsh: `status` is read-only.** Never use it as a loop variable.
- **Prettier renumbers markdown ordered lists.** QUESTIONS.md uses stable `Q<n>`
  anchors, never list numbering. Append; never renumber.
