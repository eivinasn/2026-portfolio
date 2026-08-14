# FOUNDER-TASKS.md

Everything that needs you rather than Claude, in the order that unblocks the
most. Written 2026-08-13 at the end of the uplift programme.

**Updated 2026-08-14: this document's premise has been overtaken. It is live.**
Everything below was written while the deploy was still dormant. The pipeline
was armed and run on 2026-08-13, and `npm run smoke` against production now
passes every check — it reported 22 failures when this was written. The
`example.com` canonical is gone from `eivinasn.com` after seven months.

Task 2 is therefore **done**, and so are the Q10/Q11 asset decisions and the
`www` → apex redirect in §6. What remains genuinely open is §3 (Search Console
and Bing, which need your accounts), §4 (analytics, still deliberately inert),
§5 (uptime monitoring) and the content decisions in §6 that only you can make.

Run `npm run smoke` at any time to see production's current state.

**Read [NEEDS-REVIEW.md](NEEDS-REVIEW.md) before anything in this file.** The
close-out audit on 2026-08-14 found that the history purge never actually
removed anything from GitHub, and that the server details it existed to redact
are still publicly retrievable. That outranks every task here.

---

## 1 · ~~Check for an existing `.htaccess`~~ — DONE 2026-08-13

Confirmed over SSH: **there is none**. Hostinger's redirects and injected CSP
header come from server-level config, so our `.htaccess` is purely additive.
See [Q9](QUESTIONS.md#q9).

Also established: the real document root is
`/home/uXXXXXXXXX/domains/eivinasn.com/public_html` — not `~/public_html`.

---

## 2 · ~~Arm the deploy~~ — DONE 2026-08-13

**This was the task that made the last eight increments real, and it is done.**
`DEPLOY_ENABLED` is `true`, the secrets are set, the pipeline has run, and
production is green. The steps below are kept because they are the runbook for
rotating the deploy key — which [NEEDS-REVIEW.md](NEEDS-REVIEW.md) §1 recommends
you do.

### 2a · Get SSH details from Hostinger

hPanel → **Advanced** → **SSH Access**. Note the host, port (usually 65002) and
username. Enable SSH if it is off.

### 2b · Create a deploy key

On your machine:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/eivinasn_deploy -N ""
```

Add the **public** key (`~/.ssh/eivinasn_deploy.pub`) to hPanel → SSH Access →
Manage SSH keys.

Then generate the host fingerprint — the workflow fails closed rather than
trusting a host on first use:

```bash
ssh-keyscan -p 65002 <your-ssh-host>
```

### 2c · Add them to GitHub

Repository → **Settings** → **Secrets and variables** → **Actions**.

| Secret            | Value                                                                   |
| ----------------- | ----------------------------------------------------------------------- |
| `SSH_HOST`        | from 2a                                                                 |
| `SSH_USER`        | from 2a                                                                 |
| `SSH_PORT`        | from 2a, usually `65002`                                                |
| `SSH_PRIVATE_KEY` | contents of `~/.ssh/eivinasn_deploy`, including the BEGIN and END lines |
| `SSH_KNOWN_HOSTS` | the full output of the `ssh-keyscan` above                              |
| `DEPLOY_PATH`     | `/home/uXXXXXXXXX/domains/eivinasn.com/public_html`                     |

| Variable         | Value  |
| ---------------- | ------ |
| `DEPLOY_ENABLED` | `true` |

Claude has never seen and will never see any of these.

### 2d · Dry run first

Actions → **Deploy** → Run workflow → leave **dry run** ticked. It builds, runs
every gate, and prints exactly which files would transfer without sending
anything.

### 2e · Deploy

Same, with dry run **unticked**. The run ends with `npm run smoke` against the
live site and fails loudly if production does not match what was built.

> **Deploy sparingly.** Hostinger bans the runner's IP after roughly a dozen SSH
> connections in a day. This is manual-dispatch only for that reason.

---

## 3 · Search Console and Bing — 20 minutes

**Do this after task 2.** Submitting a sitemap that 404s wastes the submission.

### 3a · Google Search Console

1. https://search.google.com/search-console → add property → **Domain** property
   for `eivinasn.com` (covers apex and `www` at once).
2. Verify by DNS TXT record in your registrar. There are currently **no TXT
   records at all** on the domain, so nothing will conflict.
3. If you use the URL-prefix method instead, put the verification HTML file in
   **`public/`** in this repo and commit it — then it survives every deploy.
   Do not upload it directly to the server.
4. Submit `https://eivinasn.com/sitemap-index.xml`.
5. **Then look at the damage.** Use URL Inspection on `https://eivinasn.com/`.
   The `example.com` canonical was live for roughly seven months, and nobody has
   ever measured whether it caused deindexing or misattribution. This is the
   first real look. Request indexing for all five URLs.

### 3b · Bing Webmaster Tools

https://www.bing.com/webmasters — you can import directly from Search Console
once 3a is done. Submit the same sitemap.

---

## 4 · Analytics — 10 minutes, optional

The site currently collects **nothing**. There is also no field data, so the
88% weight reduction in increment 7 is a lab measurement only.

Recommended: **Cloudflare Web Analytics** — free, cookieless, no consent banner,
one token.

1. https://dash.cloudflare.com → Web Analytics → add `eivinasn.com`.
2. Copy the beacon token.
3. Add repository variables:
   - `PUBLIC_ANALYTICS_PROVIDER` = `cloudflare`
   - `PUBLIC_ANALYTICS_ID` = the token
4. Redeploy. The CSP widens automatically to allow exactly that origin.

Plausible and self-hosted Umami are also supported — see `.env.example`.

**If you arm analytics, add a short privacy note to the site.** All three options
are cookieless so a full policy is not required, but saying what is collected is
both good practice and, in the EU, the safe reading. There is deliberately no
privacy page today because the site genuinely collects nothing and the page would
be false.

---

## 5 · Uptime monitoring — 5 minutes, optional

Any free monitor works. UptimeRobot, Better Stack and Cloudflare all have free
tiers. Point it at `https://eivinasn.com/` on a 5-minute interval with email
alerts. The site has been up and untouched for 212 days, so this is insurance,
not a fix.

---

## 6 · Content decisions Claude would not make

**All three below were settled on 2026-08-13 and are kept here as a record.**

- ~~**[Q10](QUESTIONS.md#q10) — 7 unused case-study images, 1.27 MB.**~~ **Ruled:
  delete.** Removed in `223f308`. Note that they are no longer recoverable from
  this repo's history either — `3b24b5a` purged them — though they remain
  publicly retrievable from GitHub's retained objects (NEEDS-REVIEW §1).
- ~~**[Q11](QUESTIONS.md#q11) — `dexcom case study.pdf`.**~~ **Ruled: delete.**
  Same caveat.
- ~~**`www` vs apex.**~~ **Done** in `b14290b`; `npm run smoke` asserts the 301
  preserves the path.

Still open, and genuinely yours — the full detail is in
[NEEDS-REVIEW.md](NEEDS-REVIEW.md):

- **The licence.** No LICENSE file and no `license` field, so the repo is
  all-rights-reserved by omission rather than by decision.
- **Consent for the case-study photography**, including the Open Graph cards
  added in `0622399`, which re-published two of the team photographs as share
  images after the Q23 acceptance was given.
- **Seven unreferenced files still in `public/`** (`favicon.svg` and six
  `logo-*.png`), 5,709 B, live on the server. They match Q10's ruling but were
  not part of that sweep; deleting them was blocked by tooling on 2026-08-14.

---

## 7 · Rulings to review

Nine decisions were made by Claude under your instruction to proceed without
blocking. All are reversible and all have their reasoning recorded. The two worth
a second look:

- **[Q3](QUESTIONS.md#q3) — staying on Astro 4** despite 9 high-severity `npm
audit` findings. Every one is build-time only for a static site, and the
  proposed remedy is a three-major upgrade that would likely force Tailwind 3→4
  and put your just-approved design at risk. Deferred, not dismissed — it is
  logged as the first out-of-ladder item and it also unlocks a better image
  pipeline.
- **[Q16](QUESTIONS.md#q16) — the contrast corrections.** This is the one place
  engineering had to touch design you approved. Six colours moved, each by the
  minimum its own text size required rather than one blanket grey, so the
  hierarchy survives. Compare against the live site and tell me if any of it
  reads wrong; each change can be reverted individually.

The rest — [Q4](QUESTIONS.md#q4) npm over pnpm, [Q5](QUESTIONS.md#q5) the brand
mark, [Q6](QUESTIONS.md#q6) trailing slashes, [Q7](QUESTIONS.md#q7) allowing AI
crawlers, [Q12](QUESTIONS.md#q12) leaving your email exposed,
[Q17](QUESTIONS.md#q17) no ESLint, [Q18](QUESTIONS.md#q18) no Lighthouse — are
lower stakes but all documented.
