# Changelog

Notable changes to eivinasn.com. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project does not
use semantic versioning, because it is a site rather than a package — commits
and dates are the units that matter.

Every entry below was reconstructed from the commit history and cross-checked
against [BACKLOG.md](BACKLOG.md) on 2026-08-14. Note that the SHAs changed once:
`3b24b5a` rewrote all 34 commits, so identifiers from before that date do not
resolve.

## [Unreleased]

### Changed

- Documentation truthed up against the code after the Astro 7 upgrade: the stack
  table, the CSP traps, the budget numbers and the README all described a
  codebase that no longer existed.

## 2026-08-14

### Added

- Per-page Open Graph cards — one per case study, generated with the self-hosted
  Inter subset rather than fetched from Google Fonts, with a 900 KB ceiling that
  fails the build (`0622399`)
- A mobile performance gate: 390px, 4× CPU throttling, slow-4G profile, judged
  against Core Web Vitals (`0622399`)
- Secret scanning in CI over the full history, using the MIT gitleaks binary
  (`8752d05`)
- A third-party marks and non-endorsement disclaimer under the logo strip
  (`8752d05`)
- `SECURITY.md`, `CONTRIBUTING.md`, this changelog, and a Dependabot
  configuration
- `/privacy/` added to the axe, CSP and performance gates — it had shipped
  ungated since `16feb16` (`e6703a6`)

### Fixed

- Three accessibility defects: a single-link "Breadcrumb" landmark, a mobile menu
  button whose accessible name did not track `aria-expanded`, and `will-change`
  declared permanently on ~25 elements (`0622399`)
- The `javascript` performance budget could never fail — it counted only external
  JS responses, and Astro 7 inlines every script this site has (`e6703a6`)
- The privacy notice now names Lithuania as the country of establishment and the
  State Data Protection Inspectorate as the supervisory authority (`21c620b`)
- Eight dead commit SHAs in the BACKLOG ladder table, left behind by the history
  purge (`b82977e`)

### Security

- Deploy identifiers and the audit trail recorded in `QUESTIONS.md` Q23; see
  [NEEDS-REVIEW.md](NEEDS-REVIEW.md) for what that audit missed and what is still
  outstanding

## 2026-08-13

### Added

- The site went live. `npm run smoke` against production went from 22 failures to
  0, and the `example.com` canonical was gone from eivinasn.com after seven
  months (`df534c4`)
- Privacy notice (`16feb16`)
- Search Console and Bing verification tokens, in `public/` so a deploy cannot
  delete them (`b19769f`, `cf47a74`)
- IndexNow, so Bing recrawls on demand (`1eae07f`)
- CI gates (`c1fcec1`), deploy pipeline (`b3231c7`), indexing handoff (`1c3f39c`)
- Analytics slot, deliberately inert (`8c255e9`)

### Changed

- Astro 4 → 7 and Tailwind 3 → 4; the CTA removed, seven unused images and the
  case-study PDF deleted (`223f308`)
- `www` now 301s to the apex (`b14290b`)
- Case-study `<title>` tags shortened for search results (`aa1a953`)
- History purged with `git filter-repo` and the repository published (`3b24b5a`)

### Fixed

- Three live defects found by diffing against a sibling site (`dc5d192`)
- An orphaned nav divider, hero copy, and redacted server details (`0250ecd`)
- Homepage weight 945 KB → 107.8 KB, LCP 32 ms, CLS 0 (`7370839`)
- Zero axe violations across every page, plus the reveal-script fix for content
  stranded invisible by a scroll jump (`efca621`)
- The `example.com` canonical, `og:url` and a 404ing `og:image` (`fe3f057`)

## 2026-01-11 – 2026-01-12

Initial build: ten commits, nine of which carry the message `your message`. The
site was live but shipped a placeholder canonical pointing at `example.com`, no
`robots.txt`, no `sitemap.xml`, no favicon and no security headers.
