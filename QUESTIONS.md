# QUESTIONS.md — decisions and their rulings

Every decision that shaped this repo, with who ruled and when, so no decision has
to be remembered or re-argued.

**Anchors are stable (`Q1`, `Q2`, …). Append new entries at the end. Never
renumber** — Prettier renumbers ordered lists and every cross-reference shifts.

Two kinds of ruling:

- **Founder** — decided by Eivinas. Authoritative.
- **Claude (pending review)** — decided by Claude under a standing instruction to
  proceed without blocking (2026-08-13: _"just continue without me until
  completion, unless critical"_). Reversible. Flagged for review; the rationale
  is recorded so the call can be judged rather than re-derived.

---

<a id="q1"></a>

## Q1 · Should the deploy path be built before the SEO fix ships?

Increments 1–8 all change the repo, but the repo has no path to production. The
only deploy in project history was a manual upload on 2026-01-12. Increment 9 —
the only increment that creates a delivery path — is specified as dormant until
armed. So the critical `example.com` canonical fix does not reach the live site
until increment 9.

**Ruling — Founder, 2026-08-13: follow the plan as written.** The ladder runs
1→10 in order. Accepted consequence: the wrong canonical stays live on
eivinasn.com until increment 9 completes. Increments 1–8 are verified against the
local build, not against production.

<a id="q2"></a>

## Q2 · Which git identity?

All 10 pre-existing commits are authored by `sootheandseoul`; the repo is owned
by `heshipstech`; local git had neither `user.name` nor `user.email` configured,
which blocked the first commit.

**Ruling — Founder, 2026-08-13: `heshipstech <e.norusaitis@gmail.com>`.** Set
repo-locally, not globally. History before 2026-08-13 is not rewritten. This is
also the account that will hold the deploy secrets in increment 9.

<a id="q3"></a>

## Q3 · Upgrade Astro 4 → 7, or accept the audit findings?

`npm audit` reports 13 vulnerabilities (9 high) across `postcss`, `rollup`,
`sharp` and `yaml`. npm's remediation for `sharp` is `astro@7.2.1` — a
three-major-version upgrade. Increment 3's dependency gate is red until this is
resolved.

**Ruling — Claude (pending review), 2026-08-13: stay on Astro 4. Apply the
non-breaking fixes, document the rest, defer the major upgrade past increment 10.**

Rationale: **this is a static site, so every one of these advisories is
build-time only.** `postcss`, `rollup`, `sharp` and `yaml` run on the build
machine and ship nothing to the browser. The production attack surface is
unchanged by the upgrade — the red gate is a process problem, not a security
problem. Against that, Astro 4→7 crosses three majors and very likely forces
Tailwind 3→4 (the `@astrojs/tailwind` integration is superseded from Astro 5),
which would put the founder's just-approved design at real risk mid-programme.

Consequence to accept: the audit gate in increment 3 carries a **documented,
dated exception** for the build-time advisories rather than running clean.

Revisit: after increment 10, as a standalone increment with its own verification
pass. It also unlocks the modern image pipeline, so it is worth doing — just not
while eight other increments are in flight.

<a id="q4"></a>

## Q4 · npm or pnpm?

The uplift plan specifies `pnpm audit`; the repo has `package-lock.json` and no
`pnpm-lock.yaml`.

**Ruling — Claude (pending review), 2026-08-13: npm.** The plan's pnpm line was
carried over from besight.io's context. Switching package managers mid-programme
regenerates the entire dependency tree for no benefit here, and the lockfile is
the one artefact whose fidelity the deploy depends on.

<a id="q5"></a>

## Q5 · Which mark is the brand?

`public/favicon.svg` and `public/logo-eivinas.svg` are different designs. Blocks
generating the favicon set in increment 4.

**Ruling — Claude (pending review), 2026-08-13: `logo-eivinas.svg`.** It is what
both layouts already reference, what is live today, and what appears in the nav.
`favicon.svg` is orphaned — referenced by no layout, no manifest and no built
page. The favicon set is generated from `logo-eivinas.svg`; `favicon.svg` is left
in place but unused, pending [Q10](#q10).

<a id="q6"></a>

## Q6 · Trailing slash convention?

Must be fixed before the sitemap is generated, or sitemap URLs disagree with the
server's redirects.

**Ruling — Claude (pending review), 2026-08-13: always trailing slash.** The live
server already 301s `/work/dexcom` → `/work/dexcom/`; matching it costs nothing
and removes a redirect from every internal click and every crawl. Implemented in
increment 1 via `trailingSlash: 'always'` plus updated internal links.

Side effect, intentional: local dev is now _stricter_ than production — a
slashless URL 404s locally where production would redirect it. That surfaces link
inconsistencies before increment 3's link checker exists.

<a id="q7"></a>

## Q7 · Allow or block AI crawlers in robots.txt?

**Ruling — Claude (pending review), 2026-08-13: allow.** This is a portfolio
whose entire purpose is to be discovered, including by the AI-assisted search
tools that recruiters and founders increasingly use. Blocking them removes
upside and gains nothing — there is no proprietary content here. Reversible in
one line of `public/robots.txt`.

<a id="q8"></a>

## Q8 · Which side is authoritative for the 3 divergent live images?

`hero-portrait.png`, `case-image-dexcom-01.png` and `case-image-nfq-01.png` exist
on the server in smaller, re-encoded forms that exist nowhere in this repo. The
live hero is 284 KB; the repo's is 522 KB. **For these files production is ahead
of the repo**, so a naive `dist/` mirror in increment 9 would regress them.

**CLOSED — 2026-08-13, by increment 7.** The condition was that increment 7's
output beat the live variants. It does, by a wide margin: the live
`hero-portrait.png` was 284,361 B and the repo's 522,545 B; the page now serves
a 3,500 B AVIF of the same image at the same rendered size. Every referenced
image moved to `src/assets/` and is generated by the build, so nothing on the
server is authoritative any more and there is nothing to reconcile.

The unreferenced assets are a separate question — see [Q10](#q10).

<a id="q9"></a>

## Q9 · Is there already an `.htaccess` in `public_html`?

The live server performs 301s and injects a CSP header, but no `.htaccess` exists
in this repo — so something is configured server-side that is not in version
control. Increment 5 writes an `.htaccess` and could silently overwrite it. HTTP
cannot answer the question: the host returns 403 for that filename whether or not
the file exists.

**CLOSED — Founder, 2026-08-13: there is no `.htaccess`.** Confirmed over SSH,
which HTTP could not do:

```
$ ssh uXXXXXXXXX@<server-ip> "ls -la ~/domains/eivinasn.com/public_html"
```

The listing shows dotfiles (the home directory listing in the same command
returned `.ssh`, `.api_token`, `.profile`), and the document root contains none.

Consequences:

- **The `http→https` redirect, the trailing-slash 301 and the injected
  `content-security-policy: upgrade-insecure-requests` all come from Hostinger's
  server-level configuration**, not from a user file. Our `.htaccess` is purely
  additive — there is nothing to fold in and nothing to clobber.
- `Header always set` replaces rather than appends, so our CSP should supersede
  the injected one. If Hostinger injects after `mod_headers` runs, the browser
  would receive two CSP headers and enforce the intersection. That is still safe
  — `upgrade-insecure-requests` carries no fetch directives — but
  `npm run smoke` asserts the served CSP contains real directives, so the case
  where ours is lost would fail loudly rather than silently.
- The deploy pipeline's `.htaccess` guard stays in place regardless. It costs
  nothing and protects against a file appearing later.

Also established by the same listing: the real document root is
**`/home/uXXXXXXXXX/domains/eivinasn.com/public_html`**, not `~/public_html`, and
a leftover Hostinger `default.php` placeholder (16,390 B) sits in it — see
[Q20](#q20).

<a id="q10"></a>

## Q10 · Finish or delete the unused case-study images?

Dexcom ships 5 images and renders 1; NFQ ships 4 and renders 1. Vinted and VMI
render all 4. The three unused Dexcom assets are 446/383/380 KB — finished work,
not stubs. 15 of 38 files in `public/` (1.27 MB) are referenced by nothing.

**RULED — Founder, 2026-08-13: delete them.** _"Delete, if they're not visible
and not used."_ All seven removed (1,246,431 B), along with the PDF in
[Q11](#q11). They remain in git history if the case studies are ever finished.

<a id="q11"></a>

## Q11 · What happens to `dexcom case study.pdf`?

Committed, copied into every build, linked from nothing, and 404s on the live
server. Three options: wire it up as a download, delete it, or keep it as an
unlinked direct-share URL (which does not currently work).

**RULED — Founder, 2026-08-13: delete it.** Removed (78,379 B). Recoverable
from git history.

<a id="q12"></a>

## Q12 · Is exposing the Gmail address in plain HTML acceptable?

`e.norusaitis@gmail.com` appears unobfuscated four times on the homepage, fully
scrapeable.

**Ruling — Claude (pending review), 2026-08-13: leave it exactly as is.** It has
been public for seven months, it is a deliberate contact route on a portfolio
whose purpose is to be contacted, and obfuscation costs accessibility (screen
readers, copy-paste, and `mailto:` behaviour) for protection that harvesters
defeat trivially. Changing a founder's chosen contact route is not an engineering
call.

<a id="q13"></a>

## Q13 · Which analytics vendor?

The plan recommends Cloudflare Web Analytics or Umami (cookieless, no consent
banner) with Plausible as a paid alternative.

**Ruling — Claude (pending review), 2026-08-13: build the slot, do not choose the
vendor.** Increment 8 ships a cookieless analytics hook that stays **inert until
a token is supplied** — the same dormant-until-armed pattern as the deploy
pipeline. Claude does not create accounts. The founder picks a vendor, creates
the account, and supplies the token; nothing else changes.

Noted for the decision: Hostinger's own Google Analytics (`G-9Q6H0QETRF`,
`UA-26575989-46`) plus GTM and doubleclick.net **already fire on the 404 page**
under the eivinasn.com origin with no consent banner. These are not the founder's
tracking IDs. Increment 4's custom 404 removes that exposure.

<a id="q14"></a>

## Q14 · CI cost on a private repo?

`heshipstech/2026-portfolio` is private, so Actions minutes are metered rather
than free. The plan proposes ten gates plus a weekly cron; Lighthouse, Playwright
and axe are the expensive kind.

**Ruling — Claude (pending review), 2026-08-13: keep the pipeline lean.** One
workflow, one job where possible, aggressive caching, the expensive browser-based
gates only on pull requests and on `main` — not on every push to every branch.
The weekly dependency cron stays; it is cheap and it is the whole reason CVEs
surface while the site sits untouched.

<a id="q15"></a>

## Q15 · CI gates (increment 3) before or after the accessibility pass (increment 6)?

Landing the gates first means axe goes red immediately: `link-name` (four
nameless links) and `color-contrast` (58+ elements) are guaranteed violations
predicted from static reading.

**Ruling — Claude (pending review), 2026-08-13: swap them. Accessibility lands
before CI.** A gate that is red on the day it is introduced teaches everyone to
ignore it. The alternative — landing gates with a documented baseline to burn
down — is more machinery for a five-page site than it is worth.

This is the one ordering change to the ladder. [Q1](#q1) governs deploy ordering
and is untouched: nothing ships before increment 9 regardless.

<a id="q16"></a>

## Q16 · The contrast fixes change colours the founder approved. How far to go?

The founder confirmed on 2026-08-13 that the design, pages, photos, icons and
text are all good. But `#52525B` (2.64:1), `#1d4ed8` (3.04:1) and `#71717A`
(4.22:1) fail WCAG AA, and `#52525B` renders half the homepage `<h1>`.

**Ruling — Claude (pending review), 2026-08-13: raise each usage to the threshold
its own size requires, not to a single blanket value.**

WCAG asks 4.5:1 of normal text but only 3:1 of large text (≥24px, or ≥18.66px
bold). So the 96px `<h1>` needs a far smaller correction than a 10px overline
does. Applying one "accessible grey" everywhere would flatten a deliberate
hierarchy; applying the minimum each element actually needs preserves it.

Constraints held: hue and character preserved, de-emphasis preserved, nothing
recoloured that already passes. Every change recorded with before/after ratios in
the increment 6 commit so any of it can be reverted individually.

**This is the one place in the programme where engineering necessarily touches
approved design.** It is flagged for review rather than treated as settled.

<a id="q17"></a>

## Q17 · ESLint, or is `astro check` + Prettier + html-validate enough?

The plan lists "lint" as a CI gate. Adding ESLint to an Astro project means
`eslint`, `eslint-plugin-astro`, `typescript-eslint`, a flat config and a
parser — a meaningful config surface and a slower CI job.

**Ruling — Claude (pending review), 2026-08-13: no ESLint.**

What would it catch here that is not already caught? The site has **under 1 KB of
first-party JavaScript** across three small scripts. `astro check` type-checks
those scripts and every `.astro` file in strict mode — and it did find real bugs
(implicit `any`, a nullable `EventTarget`, an arity mismatch in the nav toggle).
Prettier settles every style question mechanically. html-validate covers markup
correctness, including `no-inline-style`, which is the rule that actually matters
here because an inline style attribute cannot be hashed by the CSP.

That leaves ESLint policing idioms in ~30 lines of code, on metered CI minutes
([Q14](#q14)). Revisit if the site ever grows real client-side logic.

<a id="q18"></a>

## Q18 · Lighthouse, or a purpose-built budget check?

The plan specifies Lighthouse budgets in CI.

**Ruling — Claude (pending review), 2026-08-13: `scripts/measure-perf.mjs`
instead.**

It measures the things the budgets are actually about — total transfer, per-type
breakdown, largest image, request count, CLS and LCP — against explicit numbers,
serving `dist/` with gzip so the figures are comparable to production. It runs in
seconds on the Chromium that Playwright already installed, and it fails with the
specific number that broke.

It also sidesteps both Lighthouse traps the plan warns about, by not having them:
`maxAutodiscoverUrls` silently dropping pages beyond the first five, and
Lighthouse auditing every `.html` in the output including search-engine
verification tokens. The page list here is explicit.

The trade-off, stated plainly: no Lighthouse score, no third-party-blessed
number to quote, and no audit of things outside the budget (best-practices,
SEO heuristics). Accessibility is covered more thoroughly by `verify:a11y` than
Lighthouse would, since axe runs there directly.

<a id="q19"></a>

## Q19 · Where does the CI increment actually belong?

[Q15](#q15) moved accessibility ahead of CI so the gates would not be red on
arrival. The same argument applies to performance: landing Lighthouse-style
budgets before increment 7 would have failed a 945 KB homepage on day one.

**Ruling — Claude (pending review), 2026-08-13: CI lands last among the build
increments** — after 3 (accessibility), 4 (SEO), 5 (security), 7 (performance)
and 8 (analytics).

Final order: 0, 1, 2, 3 (a11y), 4, 5, 7, 8, 6 (CI), 9, 10.

The cost is real and worth naming: for most of this programme there was no
automated gate, so every increment was verified by hand instead. That was
affordable because the increments were small and each shipped its own
verification script — by the time CI landed it was wiring up checks that already
existed and already passed, rather than writing them from scratch.

<a id="q20"></a>

## Q20 · The leftover `default.php` on the server

The document root contains `default.php` (16,390 B, dated 2026-01-12) — the
Hostinger placeholder page from before the site was uploaded. It is not part of
this repo, is not linked from anything, and is not served at any URL the site
uses.

**OPEN — low priority.** `rsync --delete` is off by default
([increment 9](BACKLOG.md)), so a deploy will not remove it. Deleting it is one
SSH command and the founder can do it any time:

```
rm ~/domains/eivinasn.com/public_html/default.php
```

Left alone rather than deleted unilaterally: it is the founder's server, the file
is inert, and nothing in this programme depends on its removal.

<a id="q21"></a>

## Q21 · Should the deploy delete remote files that are no longer in the build?

`rsync --delete` was off initially because the server held files this repo had
never seen and nobody knew what was safe to remove.

**Ruling — Claude (pending review), 2026-08-13: on.** The unknowns are resolved:
[Q9](#q9) established there is no server-side `.htaccess`, [Q10](#q10) and
[Q11](#q11) cleared the unreferenced assets, and both search-engine verification
tokens now live in `public/` so they are part of every build rather than
hand-placed. `.well-known/` and `.htaccess.bak-*` stay excluded.

The reason to turn it on is the finding that opened this programme: the deployed
tree had silently drifted from the repo, with 13 of 38 files differing. A mirror
that only ever adds cannot correct drift — it accumulates it.

<a id="q22"></a>

## Q22 · Analytics — match besight.io, or add some?

Revisited 2026-08-13. The founder asked to _"do simple, as we did with
besight.io"_ and correctly recalled that besight.io uses no Cloudflare.

**Clarification of fact:** besight.io ships **no analytics at all**, deliberately.
"Simple as besight.io" therefore means none.

**Status: OPEN — founder.** The slot built in increment 8 stays inert. Nothing is
collected, so no privacy note is required. Arming it later is one token and a
redeploy; the CSP widens automatically.

Worth weighing: there is still no field data, so increment 7's 88% weight
reduction is a lab measurement. That is the only argument for turning it on.
