# Public release audit — 2026-10-15

Scope: the repository at `D:\personal_projects\my apps\biocircuit-source\biocircuit`, GitHub `ebxc-7s13/biocircuit` (public, branch `main`), GitHub Pages at https://ebxc-7s13.github.io/biocircuit/, and Supabase staging `ibxubsegrabpspopdgep`. All findings below are from commands and browser checks run on 2026-10-15.

## Starting state

| Item | Finding |
| --- | --- |
| Git | `main`, clean, in sync with `origin/main` at `00bd391`; Pages workflow runs succeeded for the last three pushes |
| Deployed vs local | Live HTML referenced the same fonts and assets as the local build; the callback route was deployed |
| GitHub provider | `/auth/v1/settings` reports `external.github = true` (owner enabled it in the dashboard) |
| OAuth check script | Reported failure because it decoded `state` as a JWT. Current hosted Auth issues an opaque state, so its allowlist test could never pass. **Defect in the check, not in the app.** |
| Membership policy (live) | Trigger `auth_github_participation` on `auth.identities` (provider `github`) calling `private.approve_github_identity` (security definer); anon/authenticated cannot execute it; 0 GitHub identities and 0 auto-approvals so far ([evidence](verification/cloud/membership-policy-2026-10-15T06-09-28-382Z.json)) |
| Public copy | **Conflicted with the policy.** The status line said "membership review required", the page title said "Built by biomedical engineers", and the eligibility text, email sign-in text, workspace text and dialog footer described academic review as the gate to participation |
| Repository layout | Ten agent prompts/specs and an old build report sat at the root; no root README for security reporting; no CONTRIBUTING; no LICENSE |
| Secrets | No real secrets in any commit (pattern scan of full history; the only `sb_secret_`/token hits are synthetic test fixtures). `.env.example` contains placeholders only. No personal email addresses tracked |
| Dependencies | `npm audit`: 0 vulnerabilities (all and production-only) |
| Supabase advisors | 11 WARN: 10 × `authenticated_security_definer_function_executable` (intended authenticated RPCs with internal checks), 1 × `auth_leaked_password_protection` (requires a paid plan) ([evidence](verification/cloud/final-audit-2026-10-15T06-11-16-768Z.json)) |

## Ordered checklist (all acted on in this run)

1. Make public copy match the live policy (launch gate). Done.
2. Fix the OAuth check for opaque state. Done: it now checks the provider is enabled, GitHub is the target and the callback is Supabase's own. Allowlist acceptance is observable only after a real sign-in.
3. Verify the live OAuth journey up to GitHub, plus the error paths. Done; the real sign-in needs the owner's GitHub login.
4. Organise the repository: move prompts to `docs/specs/`, rewrite the README, add CONTRIBUTING and SECURITY, enable private vulnerability reporting, and set the repo description, homepage and topics. Done.
5. Typography (owner request): self-hosted Inter, Plus Jakarta Sans and JetBrains Mono (OFL). Done.
6. Run the full local suite, deploy, and verify the live site. See [PUBLIC_RELEASE_REPORT.md](PUBLIC_RELEASE_REPORT.md).

## Decisions deliberately not taken

- **No license added.** The owner has not chosen one, and the README states that no reuse rights are granted.
- **Membership policy unchanged.** The owner chose auto-approval on 2026-10-14. Only the disclosure was corrected.
- **No history rewrite.** No secret was found.
