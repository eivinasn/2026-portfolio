# Phase 6 — truth-in-publishing: investigation, not conclusions

Written 2026-08-15 overnight, while the founder was away, on the instruction to
complete what did not need a ruling. **Phase 6 is decisions, so almost nothing
here is actionable by me.** What ran was the research those decisions need.

**Read this warning before using anything below.** Seven briefs were produced by
parallel investigators and every one went to an adversarial verifier. **Six of
the seven were refuted on specifics** — not on their headline conclusions, which
mostly survived, but on their evidence. The defects found include a **fabricated
verbatim quotation**, a false production measurement, cited line numbers that do
not say what was claimed, and a recommendation that would have inserted a
falsehood into a correct document. That is this programme's signature failure
mode appearing in a new domain, and it is the reason this file records _status_
rather than _findings_.

**Nothing from the briefs has been written into any repo.** No copy, no design,
no decision log. The only repo change made overnight from this work is the
correction in §4, which is to my own earlier claim and was verified directly.

---

## 1 · What was investigated

| Item                                        | Headline            | Refuted?              |
| ------------------------------------------- | ------------------- | --------------------- |
| besight §1 — AI-generated photography       | still true (partly) | yes, on evidence      |
| besight §2 — two contradicting claim pairs  | still true          | **no** — strengthened |
| besight §3 — five unsourced figures         | still true          | yes, decisively       |
| blinklab §1 — dataset licence contradiction | still true          | yes, decisively       |
| blinklab §2 — two human-data artefacts      | still true (partly) | yes                   |
| blinklab §3 — DROZY reproducibility         | still true (partly) | yes                   |
| portfolio — og:image:alt, LICENSE, consent  | partly              | yes                   |

The one brief that survived adversarial review intact is **besight §2**, the
contradicting site claims. Its verifier re-ran every load-bearing check and
could not break it — and found the problem is _wider_ than the audit recorded.

## 2 · The single finding I would act on first

**besight §2, pair A — the retention contradiction — is a data-protection
representation, not a marketing inconsistency.** The site's own published privacy
text and its homepage checklist disagree about whether raw eye recordings ever
exist off the worker's device. A careful reader finds that gap without needing
the FAQ.

Both the brief and its verifier agree the audit _understated_ the spread: the
contradiction touches more surfaces than NEEDS-REVIEW §2 names. The exact list
needs re-deriving (see the warning above), but the direction is confirmed.

The founder decision is two factual questions, and no copy should be drafted
before they are answered, because the right edit depends on which answer is true:

1. In a paid engagement as it runs today, does any raw eye recording exist
   anywhere off the worker's device, even briefly — and is the answer the same
   for an assessment as for continuous monitoring?
2. Does BeSight supply the goggles, or instrument eyewear the customer already
   owns?

If the cheap answers are the true ones, both fixes are a single noun and a
single card.

## 3 · What the refutations killed

Recorded so the next session does not resurrect them.

- **The "25 hrs" figure is NOT unsupported.** A brief recommended parking it as
  unsourceable; its verifier read the primary source and found it supports the
  figure. The brief's recommendation inverted.
- **A verbatim quotation in one brief appears to be fabricated.** Treat every
  quoted source string in this material as unverified until re-fetched.
- **A "correct the two small factual errors" instruction was itself wrong** — it
  had counted a different file from the one the sentence describes, and acting
  on it would have inserted a falsehood into two correct sentences.
- **A draft sentence written for publication in a public repo contained a false
  statement** about the provenance of a data fixture.

None of that invalidates the _questions_. It invalidates the evidence, which is
exactly the distinction this programme keeps having to relearn.

## 4 · A correction to my own Phase 4 claim, and a new standing fact

In `PHASE-4-HANDOFF.md` §11 I wrote that the old asset URLs return **404**,
offered as proof the cache-bust worked. **That was a single sample and it is not
reliably true.** Twelve fetches of the old poster URL returned 200 nine times and
404 three times.

The reason is a standing fact about besight's hosting that no document in any of
the three repos records:

```
$ dig +short besight.io
91.108.123.2
92.112.183.178
$ curl -sI https://besight.io/_astro/climbing-unit.Coy6tPLb_M2fpz.webp
server: hcdn
cache-control: public, max-age=2592000
last-modified: Thu, 13 Aug 2026 08:36:04 GMT   etag "e8a6-…"   age: 1419
… and on other requests …
last-modified: Fri, 14 Aug 2026 22:32:51 GMT   etag "e952-…"   age: 599
```

**Hostinger serves besight.io through a CDN (`server: hcdn`) across at least two
edges, with a 30-day `max-age`.** After a deploy the edges hold different
generations, so the same URL returns different bytes depending on which edge
answers. Twelve fetches of `climbing-unit` returned the pre-upgrade encode four
times and the post-upgrade encode eight times.

**What survives, and it is the part that mattered:** the two images whose
_content_ changed were given new URLs, and those new URLs serve consistently —
12 of 12 fetches, correct bytes. The homepage references the new poster on every
request. **No visitor can receive a wrong hero poster.** The lingering old file
is a cached object nothing references.

**What this changes going forward:**

- The URL-hash fix was more necessary than I argued, not less. With a 30-day
  edge TTL, an image changed behind a stable URL would have been served stale
  for up to a month.
- The 11 encoder-drift files I deliberately left alone are, demonstrably,
  serving two versions in production right now. They are visually identical, so
  the impact is nil — but "harmless" is now measured rather than assumed.
- **Verifying a deploy by fetching a URL once is not verification on this host.**
  Sample repeatedly, or compare `last-modified` against the deploy time. Every
  post-deploy check in this programme's history has been a single sample.
- Whether Hostinger's CDN can be purged on deploy is **unknown and worth
  finding out** — it would make deploys atomic instead of eventually-consistent.

## 5 · The decisions waiting for the founder

Ordered by what I would ask first. None is urgent; all are genuinely his.

1. **besight retention + deployment model** (§2 above) — two factual questions.
   The retention one has the sharpest edge because it is a published privacy
   representation.
2. **besight AI-photography disclosure.** Still true: eleven source images and
   the hero video carry signed Google C2PA / SynthID manifests, the build strips
   them, and nothing on the site says so. One thing here is genuinely
   time-sensitive and costs nothing: **record the fact in QUESTIONS before
   anyone acts on NEEDS-REVIEW §6's proposal to strip C2PA metadata to slim the
   repo** — that would destroy the only provenance evidence.
3. **blinklab dataset licence.** Three live documents say a file is withheld on
   GPL3 grounds; it is committed and published. Whatever the licence answer,
   those sentences are false today and that is fixable without it. A suggestion
   worth its fifteen minutes: ask the corpus author directly.
4. **blinklab human-data fixtures.** One question, per file: is each
   unambiguously a recording of you and nobody else? Everything else follows.
5. **blinklab DROZY provenance sentence.** A short sentence naming the measuring
   commit is true today and stays true; the full re-measure is a separate call.
6. **portfolio LICENSE and `og:image:alt`.** Both cheap, neither contentious.
7. **Was "492" ever published outside these repos?** Only you know. The
   verifiers suggest the number is more likely a stale blinklab figure than a
   besight one.

## 6 · What I would do next

Re-run this investigation with the refutations folded in as starting
constraints, rather than trusting the current briefs. The questions are right;
the evidence needs rebuilding. That is roughly one more pass, and it should
happen **before** any of it reaches a decision log — publishing a fabricated
quotation into QUESTIONS.md would be a worse outcome than leaving Phase 6 open.

---

## 7 · What the completeness critic found, and what I did about it

A final pass asked what the seven briefs _missed_. Four gaps, each verified with
commands. Two are now fixed; two are for the founder and are larger than
anything in §5.

### 7.1 — The audit measured a stale tree. Fixed.

All three blinklab briefs certified their measurements against a local checkout
**nine commits behind** `origin/main`. The tree was clean, so it read as current
— but every one of those nine commits landed during Phase 4 earlier the same
day.

Their substantive findings survive (§1–§3 of blinklab's NEEDS-REVIEW are
byte-identical across the gap), but the failure had a real consequence: **a
published claim that a live page disproves was structurally invisible.**
NEEDS-REVIEW §4 still said "Nothing on the page says which commit is live" —
made false by my own #244 the previous day. That is a Phase 6 item, in a public
repo, created by Phase 4 and missed by Phase 6 for the same reason.

**Fixed:** corrected in blinklab #247 (`8026afa0`), verified against the live
page rather than the source. All three working checkouts have been
fast-forwarded to current `main` so the next session does not repeat it.

**The rule this earns:** _"clean working tree" is not "current". Fetch before
auditing._ This programme already had a rule that a green check is not a green
change; this is the same error one level up.

### 7.2 — The AI Act was applied to the pictures, never to the product

The largest gap, and it inverts the priority in §5. Seven briefs produced a
careful Article 50 analysis of whether besight's _marketing photographs_ need an
AI label. **Not one asked whether besight's own product is a regulated AI system
under the same Regulation** — and a repo-wide grep finds exactly one mention of
the AI Act anywhere, which is the photography note.

The product is continuous, individual, per-worker fatigue monitoring in a
workplace, with supervisor escalation and task changes driven off an individual
behavioural signal. Annex III point 4(b) covers systems used to "allocate tasks
based on individual behaviour or personal traits" or to "monitor and evaluate
the performance and behaviour of persons" in work relationships. Article 113
makes the Annex III route applicable from **2 August 2026** — the same date as
Art. 50, with only the Annex I route deferred to 2027.

The prohibition limb looks clear: Recital 18 explicitly excludes physical states
including fatigue, and names fatigue detection in pilots and drivers. That is
reassuring — but it is currently an answer nobody has on record, which is a
decision being made by default.

**Why this outranks the photography question:** Art. 50 is a sentence in Terms.
Annex III is conformity assessment and registration. The analysis was pointed at
the smaller of two obligations that landed on the same day. Adding it to the
same lawyer conversation costs almost nothing.

Not legal advice, and both limbs are a lawyer's call.

### 7.3 — The uncited-figures standard was never applied to the portfolio

besight §3 treats "figures asserted with attribution but no citation" as a
defect worth a citation table. **The portfolio — the other public repo — has the
identical defect, live, and no brief looked at it**, purely because each brief
was scoped to one repo.

Confirmed in production, not just in the source: `eivinasn.com/work/nfq/`
publishes a named former employer's revenue trajectory — €125k rising to nearly
€0.5M, "85%+ utilization", "nearly 5x" — with no citation and no stated
permission. `eivinasn.com/work/vmi/` publishes user and declaration counts the
same way.

This is sharper than besight's version, because besight's figures cite research
literature while these name **real private companies**. And it is not primarily
a citation problem: the audit already flagged the NFQ figures as a
_confidentiality_ exposure under a surviving employment clause. The right first
question is not "where is the source" but "what was agreed at NFQ" — and only
the founder can answer it. If that answer is uncomfortable, the citation
exercise is moot.

### 7.4 — One item resolved in the founder's favour, and one new one

**Resolved, and it shrinks two findings:** GitHub Pages does **not** serve
blinklab's repository files. The deploy uploads `dist` only, and the GPL3 miss
table, `session-01.json` and `session-fixture.csv` all return 404 from the Pages
origin while `/` returns 200. Two briefs listed this as unverified and one
called it load-bearing. The exposure for all three is the git repository alone,
not the web.

**New:** `compliance.json` says API RP 755 "calls for objective, validated tools
… BeSight delivers individual, during-shift measurement of exactly that kind."
The characterisation of the _standard_ checks out. The second half implies
BeSight **is** such a validated tool, and nothing in the repo evidences
validation against anything. Same class as the five figures, aimed at exactly
the compliance buyer most likely to check.

### 7.5 — The critic's own limits

It verified four gaps, not the whole surface, and did not re-audit the seven
briefs' evidence — it took the earlier refutations as read. So §6 still stands:
the questions are sound, the evidence needs rebuilding before any of it reaches
a decision log.
