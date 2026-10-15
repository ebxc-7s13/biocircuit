# Public release report — 2026-10-15

**Public URL:** https://ebxc-7s13.github.io/biocircuit/
**Repository:** https://github.com/ebxc-7s13/biocircuit (public), branch `main`, workflow `.github/workflows/pages.yml` → GitHub Pages
**Backend:** Supabase staging `ibxubsegrabpspopdgep` (free tier)

**Decision:** usable as a **public preview**: anyone can browse, and anyone who signs in with GitHub can participate. It is **not production ready**, and the one remaining acceptance step is a completed real GitHub sign-in (see "Owner action").

## Deployment

- The site was already public before this run (first deployed 2026-10-14). This run **redeployed** it twice:
  - `f6c317f` changed the fonts. Pages run 38673319641 succeeded, and the live HTML now preloads `fonts/Inter.woff2` and `fonts/PlusJakartaSans.woff2`.
  - The release commit with the copy, documentation and repository changes. The deploy run and live checks are recorded in the "Deployment record" section below.
- Live route probes return 200 for `/`, `/feed`, `/questions`, `/projects`, `/auth/callback`, `/account/recovery`, `/manifest.webmanifest`, `/sw.js` and `/fonts/Inter.woff2`. Unknown detail routes (`/post/<id>`) return HTTP 404 with the SPA fallback page, which then renders the app. That is a documented GitHub Pages limitation.

## Membership policy (launch gate)

- **Live rule.** Trigger `auth_github_participation` fires after insert on `auth.identities` when `provider = 'github'`. It runs `private.approve_github_identity()` (security definer, not executable by `anon` or `authenticated`). The function sets membership to `approved` only for unsuspended profiles in `not_submitted`, `pending`, `needs_evidence` or `expired`, and writes audit action `membership_auto_github`. Rejected profiles, appeals and suspensions are untouched. [Readback](verification/cloud/membership-policy-2026-10-15T06-09-28-382Z.json): enabled, GitHub-only, definer, no anon/authenticated execute. 0 GitHub identities and 0 auto-approvals so far.
- **Academic qualifications are not verified.** GitHub sign-in proves only that the person controls a GitHub account.
- **Copy fixed to match.** The page title and manifest now say "Open biomedical engineering community (preview)". The status line reads "Open preview · GitHub sign-in to participate · qualifications not verified". The about, eligibility-policy, account-dialog, email sign-in and workspace text all say membership is not a credential. No remaining UI text claims that only verified graduates may participate.

## OAuth evidence

| Check | Result |
| --- | --- |
| Provider enabled (`/auth/v1/settings`) | `github: true` |
| Authorize redirect for both app callbacks | 302 to `github.com`, `redirect_uri` = `https://ibxubsegrabpspopdgep.supabase.co/auth/v1/callback`, scope `user:email` |
| Live button flow | Clicking **Continue with GitHub** on the live site reaches "Sign in to GitHub" with the client id and Supabase callback; stopped at the password prompt |
| Denied consent (`#error=access_denied`) | Clear failure message and "Return to feed"; fragment removed from the URL |
| Forged token fragment, no same-browser start | Rejected; fragment removed; no session written to storage |
| Provider token | Accepted only as an allowed fragment key; never stored. Only the Supabase session is set, after `getUser` verifies the access token |
| Return-address allowlist, session persistence, refresh, sign-out, re-sign-in | **Pending a real GitHub sign-in.** Current hosted Auth keeps flow state server-side (opaque `state`), so the allowlist cannot be observed beforehand; `scripts/check-github-oauth.mjs` was corrected for this |

## Local test results (2026-10-15, this working tree)

| Suite | Result |
| --- | --- |
| `npm run lint` / `format:check` / `typecheck` | pass / pass / pass |
| `npm test` (Vitest) | 16 files, 103 tests passed |
| `npm run test:db` (PGlite; Auth/Storage stubbed) | 133 passed |
| `npm run test:cloud-catalog` (local) | 27 passed |
| `npm run test:edge` / `typecheck:edge` | 10 passed / pass |
| `npm run test:e2e` (demo mode, axe scans) | 47 passed; art-direction + redesign specs rerun after the final CSS trim: 18 passed |
| `npm run build` / `check:bundle` | pass / pass (CSS 9,998 B gzip against a 10,000 B budget after removing redundant rules) |
| `npm audit` (all / production) | 0 / 0 vulnerabilities |

## Live service results

| Check | Result |
| --- | --- |
| Staging identity | `biocircuit-staging`, `ACTIVE_HEALTHY` |
| Edge Functions | scholarly-search, account-delete, avatar, project-images: ACTIVE, `verify_jwt=true` |
| Advisors | 11 WARN, unchanged from earlier runs. 10 are `authenticated_security_definer_function_executable` (intended RPCs with internal checks). 1 is `auth_leaked_password_protection` (a paid-plan feature, so a provider-plan limit rather than an app defect) ([audit](verification/cloud/final-audit-2026-10-15T06-11-16-768Z.json)) |
| Membership trigger readback | as above |
| Earlier live evidence still current | password recovery 11/11 (2026-10-14), two-account persistence 175/0, account-switch race 10/10, revocation 5/5. Not rerun today because nothing in those paths changed |

## Security checks and their limits

- **History scan.** The full Git history was pattern-scanned for Supabase secret keys, GitHub tokens, private keys, AWS keys, service-role assignments, token-bearing URLs and SMTP passwords. The only hits are synthetic fixtures in tests. No dedicated scanner (gitleaks/trufflehog) is installed, so this is a pattern scan, not a guarantee.
- **Public config only.** `.env.example` holds placeholders only. Only public `VITE_` values ship to browsers. The GitHub client secret exists only in the Supabase provider configuration.
- **Reporting.** Private vulnerability reporting is enabled on the repository.
- **Limits.** Zero scanner findings and passing tests do not prove the absence of vulnerabilities.

## Repository changes

- Agent prompts and specifications moved from the root to `docs/specs/`, with links updated.
- README rewritten: what it is, live URL, policy, setup, commands, deployment, architecture, limits and license status.
- Added `CONTRIBUTING.md` and a root `SECURITY.md` that points to `docs/SECURITY.md`.
- Set the repository description, homepage and topics.
- Fonts changed to Inter, Plus Jakarta Sans and JetBrains Mono, all self-hosted under OFL, so the CSP is unchanged.
- No license added; the owner has not chosen one.

## Remaining limitations

- **SMS.** Phone verification is unavailable (paid SMS is out of scope).
- **Password-recovery email.** Supabase's default sender allows about 2 emails per hour, so delivery can be delayed. Recovery itself was live-verified on 2026-10-14.
- **Scholarly metadata.** Search depends on the Crossref and PubMed services. Positive results for non-members are rate-gated.
- **Image uploads.** Avatar and project images need a first-party image processor that is not hosted. Document uploads are disabled.
- **Clean-up and backups.** Free pg_cron retention is scheduled, but backups and restore follow the free tier and a full restore has not been tested.
- **Clickjacking.** There is no `frame-ancestors` protection, because GitHub Pages cannot set headers.
- **Free-tier limits.** Free-tier projects may pause after inactivity, and there is no uptime guarantee.

## Owner action

Open https://ebxc-7s13.github.io/biocircuit/, choose **Join the community → Continue with GitHub**, and approve on GitHub. Then run `node scripts/check-membership-policy.mjs`. It should show 1 GitHub identity and 1 auto-approval. After that, post something and sign out and back in to confirm the full journey.
