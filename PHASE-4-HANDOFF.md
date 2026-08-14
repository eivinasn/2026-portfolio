# Phase 4 handoff — the dependency queue

Written 2026-08-14 at the end of the close-out audit session, so the next
session starts from a position rather than from ten open PRs.

**Read first:** [AUDIT-2026-08-14.md](AUDIT-2026-08-14.md) and
[NEEDS-REVIEW.md](NEEDS-REVIEW.md) here, and the same two files in
`~/Desktop/BeSight Build` and `~/Desktop/blinklab build/blinklab`.

Phases 1–3 are complete. Phase 4 has **not started**.

---

## What Phase 4 is

Ten open Dependabot PRs across three repos, plus one unexplained discrepancy.
**Triage before merging anything.**

### Known-broken — close with a reason, do not merge

| Repo           | PR   | Why                                                                                                                                                                              |
| -------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-portfolio | #1   | TypeScript 5.9.3 → 7.0.2. Fails `npm ci` in ~10 s: `@astrojs/check@0.9.10` declares peer `typescript ^5.0.0 \|\| ^6.0.0`. Blocked upstream until that package ships TS 7 support |
| blinklab       | #240 | TypeScript 6 → 7. Bumped the lockfile but not `package.json`; also needs a typescript-eslint compatibility check                                                                 |

### Safest merges in the queue

blinklab has **five green GitHub Actions major bumps** (#234–#238). They are
SHA-pinned by convention and `sha_pinning_required` is now enforced, so
Dependabot maintains both the SHA and its trailing version comment. Merging
them also closes an open issue. Pages deploy only — free.

### Need a founder ruling, not a merge

| Repo       | PR  | Decision                                                                                                                                                      |
| ---------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| besight.io | #7  | Astro 5 → 7. **Green.** But `CLAUDE.md` C1 pins Astro 5 and QUESTIONS 29 is the open ruling. Six advisories ride on it                                        |
| besight.io | #6  | sharp 0.34.5 → 0.35.3. **Green** — and it disproves what an earlier audit note claimed (that Astro 5 pinned sharp below 0.35). That note is already corrected |

### The discrepancy to explain before acting

besight's newly-enabled Dependabot alerts report **23 vulnerabilities** (8
high, 9 moderate, 6 low). `pnpm audit` reports **14**. The gap is probably
alerts counting the full graph where `pnpm audit` collapses transitive dev
paths — **but that is a hypothesis, not a finding.** Verify it, because the
answer decides which of the 23 actually matter. `pnpm audit --omit=dev` was 0
at last check, and `dist/` contains no Astro runtime, no sharp and no libvips.

---

## Constraints that shape how Phase 4 is executed

- **Hostinger bans the CI runner IP after roughly a dozen SSH deploys a day.**
  Five were spent on 2026-08-14. **besight deploys on every merge to `main`**,
  so batch its merges. blinklab uses GitHub Pages (free). The portfolio
  deploys only by manual dispatch.
- **`main` is protected on besight and blinklab** — changes need PRs. The
  portfolio accepts direct pushes (force-push and deletion are blocked).
- **besight's deploy is now gated on CI**, so a red build cannot publish.

## Already queued for the founder, unrelated to Phase 4

- blinklab **#244** — build-commit meta tag. Free to merge.
- besight **#11** — `contact.php` vs the privacy policy. The server-side salt
  file **has been created**, so it is safe to merge; costs one deploy.
- A drafted privacy-policy clause about the automated confirmation email,
  in #11's description. Copy is the founder's; `legal.json` is untouched.

## Verification habits this audit had to learn the hard way

1. **A successful command is not a changed setting.** Read the state back from
   an endpoint that actually reports the field.
2. **Every verification loop needs a control that should fail.** A probe once
   reported a clean pass because zsh did not word-split an unquoted variable
   and the loop ran once with five SHAs concatenated.
3. **`git cherry` and `git branch --no-merged` misreport squash merges**, and
   `git diff main <branch>` is not a substitute once `main` has moved. Use the
   PR state.
4. **Do not present reasoning as measurement.** Four claims published during
   this audit were wrong for exactly that reason and needed correcting.
