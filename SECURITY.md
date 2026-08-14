# Security policy

## What this is

`eivinasn.com` is a **static site**. `npm run build` produces `dist/`, which is
mirrored to a LiteSpeed host. There is no server-side code, no API, no database,
no user accounts and no form endpoint — nothing accepts input from a visitor.
That rules out most of what a vulnerability report would normally concern.

What is worth reporting:

- A weakness in the shipped headers or Content-Security-Policy
  (`config/htaccess.template`, generated into `dist/.htaccess` at build time)
- A dependency advisory that is genuinely reachable in a static build — the
  build machine and CI runner are the exposed surface, not the served page
- Anything in this repository that discloses information it should not:
  credentials, personal data, or third-party material

## Reporting

Email **e.norusaitis@gmail.com** with enough detail to reproduce. The address is
already published on every page of the site, so this is not a new disclosure.

Please do not open a public issue for something exploitable. There is no bug
bounty; this is a personal portfolio.

Expect an acknowledgement within a few days. Fixes ship as ordinary commits —
this repository has no release cadence to wait for.

## Scope

| In scope                                    | Out of scope                                                          |
| ------------------------------------------- | --------------------------------------------------------------------- |
| `https://eivinasn.com/` and this repository | The hosting control panel, DNS, and anything else the host operates   |
| Shipped headers, CSP, build output          | Findings that require access to the founder's machine                 |
| Dependency advisories with a reachable path | Automated scanner output with no demonstrated impact on a static site |

## What is already known

Open items are recorded in [NEEDS-REVIEW.md](NEEDS-REVIEW.md) rather than left
implicit. If a report matches something already listed there, it is known and
being handled.
