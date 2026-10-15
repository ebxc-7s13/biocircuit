# Public release checklist — 2026-10-15

Statuses: `COMPLETE AND VERIFIED`, `IMPLEMENTED BUT NOT LIVE-VERIFIED`, `BLOCKED BY EXTERNAL CONFIGURATION`, `NOT IMPLEMENTED`, `NOT APPLICABLE`.

| # | Gate | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Repo `ebxc-7s13/biocircuit` `main` deploys to https://ebxc-7s13.github.io/biocircuit/ via Pages workflow | COMPLETE AND VERIFIED | `gh run list`; [report](PUBLIC_RELEASE_REPORT.md) |
| 2 | No secrets or personal data in tracked files or history | COMPLETE AND VERIFIED (pattern scan; no dedicated scanner installed) | [audit](PUBLIC_RELEASE_AUDIT.md) |
| 3 | `.gitignore` covers `.env*`, `.cloud/`, credentials, build/test output, `.claude/` | COMPLETE AND VERIFIED | `.gitignore` |
| 4 | Public copy matches the live membership policy (GitHub ⇒ participate; qualifications not verified) | COMPLETE AND VERIFIED (source + live page text) | [report](PUBLIC_RELEASE_REPORT.md) |
| 5 | Live membership trigger present, GitHub-only, not executable by anon/authenticated | COMPLETE AND VERIFIED | [readback](verification/cloud/membership-policy-2026-10-15T06-09-28-382Z.json) |
| 6 | GitHub provider enabled; authorize goes to GitHub with the Supabase callback | COMPLETE AND VERIFIED | `node scripts/check-github-oauth.mjs` exit 0 |
| 7 | Live button → GitHub sign-in page (client id, `user:email` scope, Supabase callback) | COMPLETE AND VERIFIED | browser check |
| 8 | Callback rejects denied consent, forged tokens without a same-browser start, and strips the fragment | COMPLETE AND VERIFIED | browser check + 9 unit tests |
| 9 | Completed GitHub sign-in → session, auto-approval, post, refresh, sign out, sign in again | BLOCKED BY EXTERNAL CONFIGURATION (needs the owner's GitHub login; Claude cannot enter passwords) | — |
| 10 | Lint, format, types, unit, DB/RLS, Edge, e2e + axe, build, bundle budget, npm audit | COMPLETE AND VERIFIED (local) | [report](PUBLIC_RELEASE_REPORT.md) |
| 11 | Deep links return 200; assets load under `/biocircuit/`; mobile layout | COMPLETE AND VERIFIED | [report](PUBLIC_RELEASE_REPORT.md) |
| 12 | README, CONTRIBUTING, SECURITY, private vulnerability reporting, repo description/homepage/topics | COMPLETE AND VERIFIED | GitHub repo settings |
| 13 | License | NOT IMPLEMENTED (owner decision; README says no reuse rights granted) | README |
| 14 | SMS phone verification | BLOCKED BY EXTERNAL CONFIGURATION (paid SMS) | — |
| 15 | Image processing for avatar/project uploads | BLOCKED BY EXTERNAL CONFIGURATION (no free hosted processor configured) | — |
| 16 | `frame-ancestors` clickjacking header | NOT APPLICABLE on GitHub Pages (no custom headers) | `vite.config.ts` |
