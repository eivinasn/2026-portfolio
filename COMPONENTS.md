# COMPONENTS.md — the component library

Six pages plus a 404, two layouts, five components, two stylesheets. Small
enough to hold in your head — this file exists so you do not have to.

**The design is approved and frozen** (founder, 2026-08-13). This documents what
exists; it is not a redesign brief.

> **Amended 2026-08-14 — read this before the "Known defects" blocks below.**
> This file was written during increment 2, before the accessibility pass, and
> its defect blocks are a snapshot of that moment rather than a current bug
> list. **Every defect it names was fixed in increment 3 (`efca621`)** and is
> verified by `npm run verify:a11y`, which reports 0 axe violations across all
> 7 pages: the "Go back" link now has an accessible name, `<footer>` sits
> outside `<main>`, "Back to top" targets `#main`, the mobile panel manages
> focus and has a `<noscript>` fallback, and the animation utilities are
> guarded by `prefers-reduced-motion`. The blocks are left as written rather
> than deleted, because the reasoning behind each fix is still useful — but
> read them as history, not as a to-do list.
>
> Two other corrections: `tailwind.config.cjs` **no longer exists** — Tailwind 4
> is configured by `@import` in `src/styles/global.css` — and the palette counts
> below were re-run on 2026-08-14 (the old numbers predated increment 3's
> contrast work).

---

## Layouts

The two layouts are **separate, complete HTML documents**. They share
`BaseHead.astro` and `global.css` and nothing else. A `<body>`-level change made
in one is not made in the other — check both, deliberately.

### `Layout.astro` — the homepage only

```astro
<Layout title?={string} description?={string} image?={string} />
```

All props optional; the defaults are the real homepage values. `index.astro`
currently passes none. Renders `<html>`, `<head>` (via `BaseHead`), `<body>`, a
`<slot />`, and the inline IntersectionObserver that drives `.reveal-on-scroll`.

### `CaseStudyLayout.astro` — the four case studies

```astro
<CaseStudyLayout title={string} also becomes "<title>
  - Case Study" and og:title summary={string} // also becomes the meta description
  and og:description role?={string}
  timeline?={string}
  platform?={string}
  ></CaseStudyLayout
>
```

Renders its own nav ("Go back"), the `<h1>`/summary/meta block, a `<slot />` for
the STAR sections, and its own footer. Imports `CaseStudyLayout.css` for
`.fade-in` and `.bg-grid`.

**Known defects** — see [BACKLOG.md](BACKLOG.md) §3:

- The "Go back" link has **no accessible name**. The `<a>` wraps only an SVG; the
  visible words are a `<span>` outside it.
- `<footer>` is nested inside `<main>`, so it is never a `contentinfo` landmark.
- "Back to top" is `href="#"` — it scrolls but does not move focus.

## Components

### `BaseHead.astro`

```astro
<BaseHead
  title={string}
  description?={string}
  image?={string}
  type?={'website' | 'article'}
/>
```

**Single source of truth for document metadata.** Added in increment 1, because
the two layouts previously carried separately hand-written `<head>` blocks —
which is exactly why the canonical placeholder was wrong in one and absent in the
other.

Derives canonical and `og:url` from `Astro.site` + the current path, normalised
to a trailing slash. They cannot drift out of sync with the page again, and no
caller can pass a wrong one.

`image` defaults to `/hero-portrait.png` — an interim, replaced in increment 4 by
a purpose-built 1200×630 render.

### `Nav.astro`

```astro
<Nav showCta?={boolean} /> // default FALSE since 2026-08-13
```

Homepage only. Fixed glass pill. Desktop centre links + LinkedIn/email/CTA;
below `md`, a hamburger toggling `#mobile-nav`. ~30 lines of inline JS handle
toggle, outside-click and Escape.

**Known defects:** no focus management (focus never enters the panel, never
returns to the trigger on Escape); the panel is not adjacent to its trigger in
tab order; in-page links leave it open; **with JS off there is no mobile
navigation at all** — the desktop copies are `display:none` below `md`.

### `CaseStudyCard.astro`

```astro
<CaseStudyCard
  href={string}
  tag={string}
  title={string}
  description={string}
  imageUrl={string}
  delay?={'delay-100' | 'delay-200' | 'delay-300'}
/>
```

The only component with a typed `Props` interface. `href` must include the
trailing slash ([Q6](QUESTIONS.md#q6)).

**Known defects:** the "Read More" link is `#1d4ed8` at 3.04:1 (fails AA) and its
text is identical across all four cards; the thumbnail's `alt` duplicates the
adjacent `<h3>`; no `width`/`height`/`loading`.

### `SectionHeading.astro`

```astro
<SectionHeading overline={string} title={string} />
```

Used once (`index.astro`, the Case Studies section). Wraps itself in
`.reveal-on-scroll`, so it is part of the JS-gated content set.

### `Footer.astro`

Homepage only — `id="contact"`, the target of the hero's "Get in Touch". Not used
by case studies, which is why **a case-study page has no contact route at all**.

## Styles

### `global.css`

Tailwind directives, `color-scheme: dark`, base body type, and the animation
utilities.

> **There is no Tailwind config file.** `tailwind.config.cjs` was deleted by the
> Tailwind 4 upgrade in `248811b`; Tailwind is now configured by `@import` in
> this stylesheet, and the two `@apply` colour uses that referenced its tokens
> were inlined. Every real colour is a hardcoded arbitrary value —
> `text-[#A1A1AA]` ×146, `text-[#EDEDED]` ×105 as of 2026-08-14. **There is no
> config to edit. Grep for the hex.**

Animation classes. All are **guarded by `prefers-reduced-motion`** since
increment 3 — the guard is the last block in `global.css`; this table said
"unguarded" until 2026-08-14.

| Class                  | Effect                                                  |
| ---------------------- | ------------------------------------------------------- |
| `.animate-fade-up`     | one-shot entrance; hero only                            |
| `.reveal-on-scroll`    | `opacity: 0` → revealed by `RevealScript`               |
| `.reveal-opacity-only` | as above, opacity only                                  |
| `.delay-100/200/300`   | `transition-delay` — **Tailwind's own utilities** since |
|                        | 2026-08-14; the hand-written duplicates were removed    |
| `.anim-delay-1..6`     | `animation-delay` stagger; no Tailwind equivalent       |
| `.fade-in`             | case-study entrance (in `CaseStudyLayout.css`)          |
| `.glass-panel`         | nav backdrop blur                                       |
| `.bg-grid`             | case-study background grid                              |

> **`.reveal-on-scroll` is still the highest-risk thing in this codebase.** ~20
> homepage blocks ship at `opacity: 0` and become visible only when JS adds
> `.is-visible`. A naive CSP blanks the page, and Playwright `textContent`
> assertions pass while sighted users see nothing — assert **visibility**, never
> presence. Since increment 3 there **is** a `<noscript>` fallback and a
> reduced-motion override, and `verify:a11y` asserts zero stranded blocks
> including after a jump to `/#competencies`; the "no fallback" sentence here
> was true when written and is not now.

## The colour palette actually in use

Grep results, not the config. Contrast measured against `#050505`.

Counts re-run 2026-08-14 (`grep -ro "\[#hex\]" src/ | wc -l`); the "was" column
is the increment-2 figure, kept because the delta _is_ the contrast work. The
ratios are unchanged — a hex has the ratio it has. What changed is where each
one is used, and the evidence that no failing combination survives on text is
`npm run verify:a11y`: **0 axe violations, including `color-contrast`, on all
7 pages.** Ratios below are still worth reading before reaching for a grey.

| Hex                                           | Uses (was)  | Ratio  | Verdict                                    |
| --------------------------------------------- | ----------- | ------ | ------------------------------------------ |
| `#EDEDED`                                     | 105 (104)   | 15.9:1 | pass                                       |
| `#A1A1AA`                                     | 146 (143)   | 8.6:1  | pass                                       |
| `#71717A`                                     | **0** (23)  | 4.22:1 | eliminated in increment 3                  |
| `#52525B`                                     | **4** (62)  | 2.64:1 | 58 uses raised in increment 3              |
| `#1d4ed8`                                     | **15** (22) | 3.04:1 | 7 uses raised, including every "Read More" |
| `#27272A`                                     | 41 (40)     | —      | borders                                    |
| `#0A0A0A` / `#121212` / `#18181B` / `#1F1F22` | —           | —      | surfaces                                   |

Remediation approach ruled in [Q16](QUESTIONS.md#q16): raise each usage to the
threshold its own size requires, preserving hierarchy — not one blanket grey.
