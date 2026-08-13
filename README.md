# eivinasn.com — Portfolio 2026

Personal portfolio for Eivinas Norušaitis. Static Astro site: a landing page and
four case studies sharing a layout.

**Live:** https://eivinasn.com/

## Working in this repo

Read [CLAUDE.md](CLAUDE.md) first — it holds the standing rules, constraints and
definition of done. Then:

| File | What it is for |
| --- | --- |
| [BACKLOG.md](BACKLOG.md) | The increment ladder and current status |
| [QUESTIONS.md](QUESTIONS.md) | Every decision, its ruling, and the date |
| [COMPONENTS.md](COMPONENTS.md) | The component library and the real colour palette |
| [ORIENTATION.md](ORIENTATION.md) | The dated audit this work is based on |

## Tech stack

- **Astro 4** — static output, no SSR, no adapter
- **Tailwind CSS 3** via `@astrojs/tailwind`
- **npm** — not pnpm ([Q4](QUESTIONS.md#q4))
- **Node** — see `.nvmrc` (22 LTS). `engines` requires ≥20.3.0

## Local development

```bash
npm install
```

```bash
npm run dev
```

Then open the printed URL, usually http://localhost:4321.

Note: URLs require a trailing slash (`/work/dexcom/`). A slashless URL 404s
locally by design — production redirects it, and the strictness surfaces bad
links early ([Q6](QUESTIONS.md#q6)).

## Build and preview

```bash
npm run build && npm run preview
```

Output goes to `dist/`.

## Deployment

**Hosted on LiteSpeed / Hostinger**, not Vercel or Netlify.

The only deploy in project history was a **manual bulk upload on 2026-01-12**.
There is no automated pipeline yet — increment 9 builds one, and it stays dormant
until armed by a repository variable. Credentials are added by the founder as
GitHub secrets and are never handled by Claude.

Two things to know before deploying anything:

- **The live server is not a mirror of this repo.** 13 of 38 files in `public/`
  diverge, and for three images production is *ahead* of the repo. A naive
  `dist/` mirror would regress them. See [Q8](QUESTIONS.md#q8).
- **Something configures the server that is not in version control** — the 301s
  and an injected CSP header come from somewhere. See [Q9](QUESTIONS.md#q9).
