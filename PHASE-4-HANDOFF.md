# Phase 4 — the dependency queue

Rewritten 2026-08-14 after the queue was actually triaged. The first version of
this document was written before any of it had been verified, and four of its
statements were wrong. They are corrected in §2 rather than quietly deleted,
because the programme's own rule is that a published error gets a dated
correction, not a silent edit.

**Read first:** [AUDIT-2026-08-14.md](AUDIT-2026-08-14.md) and
[NEEDS-REVIEW.md](NEEDS-REVIEW.md) here, and the same two files in
`~/Desktop/BeSight Build` and `~/Desktop/blinklab build/blinklab`.

Phases 1–3 are complete. Phase 4 is **in progress** — see §3.

---

## 1 · The queue as it stands

Eleven Dependabot PRs were open when triage started; the handoff knew about ten.
besight #8 opened two minutes after its advisory landed and postdates the
original document.

| Repo           | PR   | What                          | Disposition                                      |
| -------------- | ---- | ----------------------------- | ------------------------------------------------ |
| 2026-portfolio | #1   | typescript 5.9.3 → 7.0.2      | **CLOSED** — blocked upstream, see §4            |
| blinklab       | #240 | typescript 6.0.3 → 7.0.2      | **CLOSED** — blocked upstream twice over, see §4 |
| besight.io     | #8   | sharp 0.34.5 → 0.35.0         | **CLOSED** — superseded by #6, see §5            |
| blinklab       | #236 | upload-pages-artifact v3 → v5 | **MERGE FIRST** — this is an outage fix, see §3  |
| blinklab       | #235 | deploy-pages v4 → v5          | Open — safe, unexercised by PR checks            |
| blinklab       | #234 | setup-node v4 → v7            | Open — safe, the best-evidenced of the five      |
| blinklab       | #238 | setup-uv v5 → v9              | Open — safe, two caveats in §7                   |
| blinklab       | #237 | checkout v4 → v7              | Open — **merge LAST**, it is the conflict hub    |
| blinklab       | #239 | minor-and-patch ×3            | Open — safe; changes deployed bytes, §8          |
| besight.io     | #6   | sharp 0.34.5 → 0.35.3         | **HOLD** — does not fix the advisory alone, §5   |
| besight.io     | #7   | astro 5.18.2 → 7.2.0          | **FOUNDER RULING** — Q29, re-scoped, §6          |

Not Dependabot, already queued for the founder: blinklab **#244**
(build-commit meta tag, free) and besight **#11** (`contact.php` vs the privacy
policy, one deploy — the server-side salt file exists, so it is safe to merge).

## 2 · Corrections to the first version of this document

Each was reasoning presented as measurement — the exact failure mode §9 warns
about. All four were caught by re-running the commands.

**2.1 — the 23-vs-14 discrepancy. The stated hypothesis was wrong, and the
question is now closed.**

It is not "alerts counting the full graph where `pnpm audit` collapses
transitive dev paths." Dependabot files one alert per _(advisory × manifest
file)_ and scans both `package.json` and `pnpm-lock.yaml`. Only **direct**
dependencies get a `package.json` row in addition to the lockfile row.

```
gh api "repos/heshipstech/besight.io/dependabot/alerts?state=open&per_page=100" --paginate \
  --jq '.[].dependency.manifest_path' | sort | uniq -c
   9 package.json
  14 pnpm-lock.yaml
```

14 distinct GHSA IDs across all 23 rows. besight has exactly two direct
dependencies carrying advisories — astro (8) and sharp (1) — which is the 9
duplicates. 23 − 9 = 14, and those 14 are set-identical to what `pnpm audit`
reports, same IDs and same 5 high / 5 moderate / 4 low split. Nothing hides in
the 23 that `pnpm audit` misses.

**2.2 — "`pnpm audit --omit=dev` was 0 at last check." False. That command has
never run successfully.**

```
$ pnpm -C "$HOME/Desktop/BeSight Build" audit --omit=dev
[ERROR] Unknown option: 'omit'
```

`--omit` is an npm flag; pnpm uses `--prod`. The error exits non-zero and prints
no advisories, which is precisely how it got read as a clean pass. The real
production-scope figure is **10**, not 0:

```
$ pnpm -C "$HOME/Desktop/BeSight Build" audit --prod --json | jq -c '.metadata.vulnerabilities'
{"info":0,"low":3,"moderate":4,"high":3,"critical":0}
```

The reachability conclusion still holds, and it is the part worth keeping:
besight is `output: "static"`, and `dist/` is genuinely clean — 54 files, no
Astro runtime, no sharp, no libvips, no `.node` binaries. Those 10 are
build-machine and CI exposure, not live-site exposure. But "production scope is
clean" was never true.

**2.3 — "Six advisories ride on [#7]." It is eight.**

All eight astro GHSAs have a `first_patched_version` at or below 7.2.0; the
highest is 7.1.0. Confirmed from both ends — `pnpm audit` on `main` prints 14
findings, on #7's head it prints 5, and astro is absent from the second table
entirely. The delta is **nine**: the eight astro advisories plus
`esbuild GHSA-g7r4-m6w7-qqqr`, closed as a side effect of the transitive
vite 6.4.3 → 8.2.1 bump. The same "six" figure appears in besight's own
NEEDS-REVIEW.md §7 and is wrong there too.

**2.4 — "#6 disproves what an earlier audit note claimed (that Astro 5 pinned
sharp below 0.35). That note is already corrected." Backwards. The note was
right; the correction is the error.** Full detail in §5.

## 3 · blinklab's Pages deploy is broken, and #236 is the fix

Discovered during triage, not previously recorded. The last two pushes to `main`
failed:

```
2026-08-14T18:53:35Z [push] 43e04f64 -> failure
2026-08-14T18:13:57Z [push] 23ed1df0 -> failure
2026-08-14T14:47:50Z [push] 77867d02 -> success
```

Both die at `Set up job`, before any step runs:

> `The action actions/upload-artifact@v4 is not allowed in heshipstech/blinklab because all actions must be pinned to a full-length commit SHA.`

`gh api repos/heshipstech/blinklab/actions/permissions` reports
`sha_pinning_required: true`. It was switched on between 14:47Z and 18:13Z
today. Nothing in the repo changed — `compare/e186692...43e04f6` is seven
markdown files — so the policy moved, not the workflow.

The violation is transitive. `upload-pages-artifact@v3.0.1`'s own `action.yml`
line 77 reads `uses: actions/upload-artifact@v4` — floating. At the v5.0.0 SHA
this PR adopts, line 84 reads
`uses: actions/upload-artifact@bbbca2ddaa5d8feaa63e36b76fdaad77386f024f # v7.0.0`.
Nothing else in `deploy.yml` still trips the policy: `deploy-pages@v4.0.5` is a
plain node action with no nested `uses:` at all. So **#236 alone restores
publishing.**

The two unpublished commits are documentation, so no visible content is missing
from the live site — but the next real change would not have shipped either.

The original handoff called these five "the safest merges in the queue" and
separately noted that `sha_pinning_required` is now enforced. It did not connect
the two.

## 4 · The two TypeScript PRs — closed, blocked upstream

Neither is a judgement about TypeScript 7. Both are the same shape: TS 7 is
ahead of its ecosystem.

**portfolio #1.** `@astrojs/check@0.9.10` is simultaneously the pinned version
and the latest published, and its peer range is `typescript "^5.0.0 || ^6.0.0"`.
CI run 31784180330: `npm error ERESOLVE … Conflicting peer dependency:
typescript@6.0.3`. The workarounds — `--force`, `--legacy-peer-deps`, an
`overrides` entry — all suppress the check rather than satisfy it, and
`@astrojs/check` is the tool that typechecks `.astro` files here.

**blinklab #240.** Broken twice. Dependabot bumped the lockfile but not the
manifest, so run 31792720219 fails `npm ci` with
`EUSAGE … Invalid: lock file's typescript@7.0.2 does not satisfy
typescript@6.0.3`. And repairing that would only expose the second block:
`@typescript-eslint/eslint-plugin@8.67.0`, the latest, still peers
`typescript ">=4.8.4 <6.1.0"`. The `<6.1.0` pin in `package.json` mirrors that
range deliberately.

**Reopen condition** for both: the respective upstream publishes a release whose
`peerDependencies.typescript` admits `^7`.

**Known consequence.** Closing a Dependabot PR suppresses that _release_, not
the dependency. Dependabot's own reply says so: "I won't notify you again about
this release, but will get in touch when a new version is available." TypeScript
7.0.3 will therefore open two fresh PRs that fail identically. The durable fix
is an `ignore` condition for the TS major in both `dependabot.yml` files —
**not done**, because it is a judgement about queue noise rather than
housekeeping.

## 5 · sharp — neither PR fixes the advisory, and a recorded correction needs reverting

The central finding of this phase, and the one that changed the plan.

`GHSA-f88m-g3jw-g9cj` (high, `sharp < 0.35.0`, first patched 0.35.0) reaches
besight by two paths, which is why it produced two alerts with apparently
contradictory scopes — alert #9 `package.json` / `development`, alert #22
`pnpm-lock.yaml` / `runtime`. Both are correct: sharp is a direct
devDependency **and** a transitive optional dependency of astro, which is a prod
dependency.

```
$ npm view astro@5.18.2 optionalDependencies --json
{ "sharp": "^0.34.0" }
$ npm view astro@7.2.0 optionalDependencies --json
{ "sharp": "^0.34.0 || ^0.35.0" }
```

`^0.34.0` cannot resolve to any 0.35.x. So while besight stays on Astro 5, a
vulnerable sharp node is in the lockfile no matter what the direct dependency
says. Verified in PR #6's own head lockfile (`2eb0de3`): `sharp@0.34.5` at line
3713 alongside the new `sharp@0.35.3` at 3717, with the transitive edge at line
5884 inside the `astro@5.18.2(…)` snapshot that begins at 5818. The `@img/*`
binary entries go **50 → 102** — a second complete sharp + libvips set
installed alongside the first, on every CI and deploy run, rather than replacing
it.

So merging #6 closes alert #9, leaves alert #22 open, and doubles the binary
payload. **#7 alone does not fix it either** — the direct pin stays 0.34.5 and
pnpm dedupes onto it. Only **#7 and #6 together** remove sharp < 0.35 from the
lockfile. That last step is a reasoned inference from the version ranges and is
**UNVERIFIED**: proving it needs an install, which a read-only triage cannot run.

**The correction that needs reverting.** besight commit `4a40923` struck through
NEEDS-REVIEW.md §7's line "sharp cannot be upgraded while Astro 5 is pinned" and
replaced it with "the upgrade is available and needs an ordinary review, not a
`pnpm.overrides` workaround." The struck-through text was substantially right.
`4a40923`'s reasoning — that #6 "passes CI", so the optional-dependency range
must not constrain a direct devDependency — is true in its narrow claim and
wrong in its conclusion: the direct dependency was never the binding constraint,
the transitive astro edge is, and neither PR moves it. The "passes CI" half is
not evidence at all, because `ci.yml` never exercises sharp 0.35.x — astro loads
its own bundled 0.34.5, and `scripts/icons.mjs`, the only consumer of the direct
dependency, is invoked by no workflow, no hook, and neither the `build` nor the
`verify` script.

**Why #8 was closed rather than #6.** #8 was a Dependabot _security_ update,
which bypasses group config and always targets the minimum patched version
(0.35.0); #6 is the scheduled group update to 0.35.3, the current latest. They
conflict, so only one can land, and #6 is strictly the better. The duplicate was
not a `dependabot.yml` misconfiguration — besight's config has one group and no
ignore rules, and 0.34.5 → 0.35.3 is correctly a semver minor.

## 6 · besight #7, Astro 5 → 7 — the founder ruling, re-scoped

**The governance blocker is real and is not mine to clear.** besight's
`CLAUDE.md` line 22 is `C1 Astro 5, …`, and line 3 calls the file "the standing
law of the repo." QUESTIONS item 29 is `**Astro 6 upgrade** — OPEN, founder
decision (C1 change)` and says in terms: "C1 pins Astro 5, and CLAUDE.md is
standing law, so I will not upgrade without your instruction."

**Q29 as written no longer describes the decision.** It is titled "Astro **6**
upgrade" and scopes the benefit to two advisories. The PR is Astro 5 → **7**,
and nine findings ride on it. Ruling on Q29 unamended would understate both the
jump and the benefit by roughly a factor of four. _(Interpretation, not a
measurement.)_

**The engineering case is strong.** Every gate ran on the exact head SHA and
passed: build, `astro check`, eslint, prettier, `gate:src`, `gate:dist`,
html-validate, linkinator, `verify:csp`, Playwright across chromium/webkit/
firefox (84 passed) including axe at every impact level, and Lighthouse CI
against the C8 assertions. `verify:csp` printed `VERIFIED — nothing blocked`
with all six pages styled, so the generated CSP hashes still match under Astro 7. Build output got smaller: 46.4 → 44.9 KB gzip JS, 855.4 → 846.3 KB page
weight.

**The engineering case is also incomplete, and this is the part to weigh.** Two
documented breaking changes demonstrably apply to this site, and no gate in the
repo can see either:

- **The v6 image-upscaling ban.** `hero-poster.jpg` is a 720×720 source that
  `Hero.astro:19` requests at `width: 960`, and the Astro 5 build emits a
  960×960 webp — a 1.33× upscale, used as the `<video poster>`, i.e. the LCP
  image for reduced-motion and mobile visitors. `founder-portrait.png` upscales
  1.07× the same way. Under Astro 6+ neither is produced; both silently drop to
  source resolution.
- **The v7 `compressHTML` default flip**, `true` → `'jsx'`. besight sets it
  nowhere, so the default moved under it. Across seventeen inline-heavy sections
  this can shift rendered spacing.

`CLAUDE.md` C11 sets a 2px desktop parity tolerance and **nothing in CI enforces
it** — there is no screenshot comparison or pixel diff anywhere in the repo.
`gate:dist` only asserts weight is _under_ budget, and it went down.

**Operational note.** The green run is 4 commits stale; main has since gained
`src/components/Head.astro +11 −3`, which has never been built by Astro 7. And
`deploy.yml` fires on `workflow_run` after a green CI on main, so a merge
publishes to Hostinger with no human looking at a pixel in between.

**Recommended path if ruled yes:** amend C1 in the same commit, rebase #7 onto
current main, run a C11 pixel-parity pass over the seventeen sections, then
merge. Also queued: Astro 7 deprecates the `z` re-export from `astro:content`,
producing **330** new `ts(6385)` hints against `src/content.config.ts` (0 on
main). `astro check` exits 0 on hints so no gate fails, but Astro 8 could break
that file.

## 7 · The five blinklab Actions bumps

All five SHA pins were verified against the upstream tag refs — both the
incoming SHA and the outgoing one, so the trailing version comments are
trustworthy in both directions. Every finding then went to an adversarial
verifier; three reviews were refuted on evidence, none on outcome.

**Merge order matters, and there are two conflict pairs, not one.** #234 + #237
collide in `deploy.yml` (checkout at line 27, setup-node at line 28) and
**#237 + #238 collide in `ci.yml`** (checkout at line 91, setup-uv at line 92,
in the `analysis` job) — the second pair was not previously recorded. #237 is
the hub of both. Measured by real sequential merges in a scratch clone,
**putting #237 last costs exactly one conflict event** instead of two. A naive
conflict-marker strip is wrong there: the region contains both actions on both
sides, so stripping duplicates four lines.

Also corrected: only #234 and #237 edit both workflow files. #235 and #236 edit
`deploy.yml` only; #238 edits `ci.yml` only.

**Nothing unsticks itself.** blinklab's `main` protection is `strict: true` with
required contexts `checks`, `analysis`, `Secret scan`, and `enforce_admins:
true`. `allow_auto_merge` is **false** on both blinklab and besight, and neither
`dependabot.yml` sets `rebase-strategy` — the documented default rebases on
_conflict_, not on merely being BEHIND. Every one of these needs a manual
"Update branch" click. besight, by contrast, has protection but **no required
status checks** (`…/protection/required_status_checks` → 404) and
`enforce_admins: false`. Neither repo has any ruleset.

**Caveats worth carrying into the merges:**

- **#235 and #236 are not exercised by their own green checks.** All three
  checks come from `ci.yml` on `pull_request`; `deploy.yml` runs only on push to
  main and `workflow_dispatch`, and `ci.yml` does not contain the string
  `deploy-pages` at all. The changed lines' first real execution is the
  post-merge deploy. Watch that run rather than trusting the ticks.
- **#235 will add log noise.** Two open upstream issues (actions/deploy-pages
  #413 and #434) report a Node `DEP0040` punycode deprecation warning on
  _successful_ v5 deployments — v5 declares node24 while bundling
  `@actions/artifact` 2.1.8, the pre-node24 line. Expect it; it is not a
  failure. Also: the claim that the v4→v5 delta is "one line of `action.yml`"
  is false — `dist/index.js`, the only code the runner executes, changes by
  +266,865 bytes. The reviewer who said otherwise had read `src/`, which the
  runner never loads.
- **#238 does not clear the Node 20 deprecation warning**, contrary to an
  intuitive reading. `actions/checkout@11d5960a` is itself `using: node20`, so
  the warning is halved (4 occurrences → 2), not removed. Separately, setup-uv
  downloads the `uv` binary **without checksum verification** whenever the
  version is absent from `KNOWN_CHECKSUMS` — v9.0.0's table tops out at uv
  0.11.30 and the runs install 0.12.4 — and since v7.6.0 it resolves versions
  from a mutable branch ref. This is pre-existing rather than introduced, but it
  is the same risk class `ci.yml` already reasons about for the gitleaks
  download. Upstream's remedy is v10.0.1's `version: latest-known`.
- **#237 crosses fewer breaking changes than it appears to.** The v7 fork-PR
  gate is already present in the outgoing v4.4.0 pin, whose own release body
  reads "[BREAKING] backport `allow-unsafe-pr-checkout` to v4". The real
  manifest delta between the two SHAs is exactly `using: node20` → `node24`.
- **#234 is the best-evidenced of the five.** It edits `ci.yml` as well as
  `deploy.yml`, so its green check genuinely executed the changed line — the job
  log shows the new SHA downloaded and run. None of the four majors' breaking
  changes reach this repo: both call sites pass an explicit `cache: npm`, the
  package has no `packageManager` or `devEngines` field, `always-auth` is unused
  and no output is consumed.

Runner floors are all cleared: a real blinklab job log reports
`Current runner version: '2.336.0'` on `ubuntu-24.04`, above every documented
minimum (2.327.1, 2.329.0) and past node24 enforcement.

## 8 · blinklab #239

Not mentioned in the original handoff and never examined. Safe to merge.

Three packages: `@mediapipe/tasks-vision` ^1.0.0 → ^1.0.1 (the repo's **only**
prod dependency), `globals` ^17.8.0 → ^17.9.0 and `typescript-eslint` ^8.65.0 →
^8.67.0 (both lint-only). Unlike #240 the lockfile and manifest move in
lockstep, and this is measured rather than inferred — the `checks` job's
`npm ci` step ran and succeeded on the PR head. The checks genuinely exercise
all three: eslint imports `globals` and `tseslint` directly, and the e2e suite
drives the real built app against the freshly copied MediaPipe wasm with four of
six specs never stubbing it.

**Two things to know before merging.** It changes deployed bytes — the wasm is
regenerated from `node_modules` on every build and pinned nowhere in the repo,
and 1.0.1 is +598,589 bytes unpacked. And it is the one package with no upstream
changelog: Google publishes `@mediapipe/tasks-vision` on a daily internal
cadence and there is no v1.0.1 release on the GitHub repo at all. The only
output-changing package in the PR is the only one whose change is undocumented.

Merging #239 does **not** unblock #240 — see §4.

## 9 · Constraints that shape execution

- **Hostinger bans the CI runner IP after roughly a dozen SSH deploys a day.**
  **Six** were spent on 2026-08-14, not five: five besight deploys (09:41,
  10:31, 17:37, 18:02, 18:23 — the last three via `workflow_run`, the first two
  via `push`, before the trigger changed) plus the portfolio's 11:53
  `workflow_dispatch`, the deploy-key rotation dry run. A dry run still opens a
  session.
- **besight deploys on every merge to `main`.** `DEPLOY_ENABLED` is `true`,
  `deploy.yml` fires on `workflow_run` after a green CI, and its concurrency
  group is `cancel-in-progress: false` — so N merges produce N real SFTP
  sessions, none skipped. Batch them.
- **blinklab is free.** GitHub Pages, no SSH path anywhere in the repo, public
  so Actions minutes cost nothing. Its Pages concurrency _does_ cancel in
  flight, so rapid merges collapse to one deploy.
- **The portfolio deploys only by manual dispatch.**
- **`main` is protected on besight and blinklab**; the portfolio accepts direct
  pushes with force-push and deletion blocked.
- **All three repos now have Dependabot alerts enabled** —
  `/vulnerability-alerts` returns 204 on each, against a control that 404s.
  blinklab reports **0 open**, and its NEEDS-REVIEW.md §4 line saying alerts are
  disabled is stale. portfolio also 0. besight is the only one with findings.

## 10 · Verification habits, extended

The first four were learned during the close-out audit. The fifth and sixth were
learned during this phase.

1. **A successful command is not a changed setting.** Read the state back from
   an endpoint that actually reports the field.
2. **Every verification loop needs a control that should fail.** A probe once
   reported a clean pass because zsh did not word-split an unquoted variable and
   the loop ran once with five SHAs concatenated. The same trap recurred in this
   phase, in the same shape, in the first `gh pr view` sweep.
3. **`git cherry` and `git branch --no-merged` misreport squash merges**, and
   `git diff main <branch>` is not a substitute once `main` has moved. Use the
   PR state.
4. **Do not present reasoning as measurement.** Four claims published during the
   audit were wrong for exactly that reason. Four more in the first version of
   this document were wrong for the same reason. It is the dominant failure mode
   of this programme, and it survives careful writing — every one of those eight
   was written confidently.
5. **A green check is not a green change. Ask which workflow file it came
   from.** Three of the five Actions PRs carry three green ticks that could not
   possibly have executed the line they change, because `deploy.yml` does not
   run on `pull_request`. "Green" and "verified" are different claims.
6. **Read the artefact the runtime actually loads.** A reviewer concluded the
   `deploy-pages` v4→v5 delta was one line by diffing `src/`. The runner loads
   `dist/index.js`, which changed by 266 KB. The conclusion happened to survive;
   the method would not have.
