# FOUNDER-TASKS.md

Everything that needs you rather than Claude, in the order that unblocks the
most. Written 2026-08-13 at the end of the uplift programme.

**The single most important fact:** every fix in this repo is verified and
committed, and **none of it is live**. The ladder ran 1→10 in order per
[Q1](QUESTIONS.md#q1), so `eivinasn.com` still serves the January build —
including `<link rel="canonical" href="https://example.com">`. Task 2 is what
changes that.

Run `npm run smoke` at any time to see production's current state. Today it
reports 22 failures. After task 2 it should report none.

---

## 1 · ~~Check for an existing `.htaccess`~~ — DONE 2026-08-13

Confirmed over SSH: **there is none**. Hostinger's redirects and injected CSP
header come from server-level config, so our `.htaccess` is purely additive.
See [Q9](QUESTIONS.md#q9).

Also established: the real document root is
`/home/REDACTED-SSH-USER/domains/eivinasn.com/public_html` — not `~/public_html`.

---

## 2 · Arm the deploy — 15 minutes

**This is the task that makes the last eight increments real.**

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
| `DEPLOY_PATH`     | `/home/REDACTED-SSH-USER/domains/eivinasn.com/public_html`                     |

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

These are recorded as open in [QUESTIONS.md](QUESTIONS.md). Nothing has been
deleted or changed.

- **[Q10](QUESTIONS.md#q10) — 7 unused case-study images, 1.27 MB.** Dexcom ships
  5 images and renders 1; NFQ ships 4 and renders 1. Vinted and VMI render all
  four. The unused Dexcom assets are 446/383/380 KB of finished work, not stubs.
  Either the two case studies are unfinished, or the files should go.
- **[Q11](QUESTIONS.md#q11) — `dexcom case study.pdf`.** Committed, built, linked
  from nothing, and 404s live. Wire it up, delete it, or keep it as a direct
  share link — but it does not currently work as one.
- **`www` vs apex.** Both serve 200 with identical content and no redirect. The
  canonical tag now disambiguates for search engines, but a host-level redirect
  in hPanel is the real fix.

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
