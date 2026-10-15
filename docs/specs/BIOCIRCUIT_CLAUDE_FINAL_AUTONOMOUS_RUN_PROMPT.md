# BioCircuit — Final Autonomous Run and Zero-Cost Completion

## Mission

You are taking over the existing BioCircuit codebase as the autonomous engineering lead. Your goal is to finish every feasible implementation, integration, security, persistence, and release-readiness task using **strictly free resources**, and then produce an evidence-based assessment of what is and is not ready.

Do not wait for me to provide a sequence of prompts or make routine technical decisions. Inspect the actual repository and reports, decide what to do next, implement it, test it, fix verified defects, and continue. A blocker in one feature must not stop unrelated work.

**Do not claim production readiness unless the real release gates have passed. Do not fake features, verification, email delivery, external service results, tests, or evidence.**

## Fixed context and constraints

- Existing project directory: `D:\personal_projects\my apps\biocircuit-source\biocircuit`
- Supabase staging project reference: `ibxubsegrabpspopdgep`
- Dashboard: `https://supabase.com/dashboard/project/ibxubsegrabpspopdgep`
- The visual design has already been upgraded. Preserve the current social-first layout, animated visual identity, routes, and working UX unless a demonstrated defect requires a targeted change.
- The staging database already has the existing migrations applied, including migration 21 for bucket MIME restrictions, and four Edge Functions are deployed. Verify current reality before assuming any prior report is still accurate.
- The project has two ordinary staging identities, account A and account B. Account B is already registered; use sign-in for B rather than signup again.
- Two-account privacy checks previously found and fixed a race where delayed responses from A could appear after switching to B. Preserve the regression test.
- Local recovery page is intended to run at `http://127.0.0.1:5190/account/recovery`.
- The local helper `scripts/set-staging-recovery-input.ps1` has already saved account A's recovery input and a new password encrypted for the current Windows user. The helper confirmed: **“Real receipt input encrypted for this Windows user. No request/reset performed.”**
- `npm run recovery:request` previously got an HTTP 200 response, which proves request acceptance only—not email delivery or reset success. I have confirmed that recovery emails arrived in account A's inbox.
- The reset operation has not yet been verified. The recovery email/template restrictions on Supabase Free and inability to configure paid SMS must not stop unrelated tasks.
- Strict zero-cost rule: no paid SMS, paid SMTP, paid APIs, subscriptions, upgrades, trial-to-paid conversion, new billable resources, or services whose use might incur charges. Verify the current plan, quotas, license, and possible charges before choosing a provider. Prefer existing free infrastructure and open-source tools.
- Keep the frontend unpublished. Do not perform destructive production changes. Do not reset the staging database, delete users, or alter existing account roles. No credentials, OTPs, recovery links, access tokens, refresh tokens, or passwords may be printed or sent to chat.

## Phase 0 — Establish actual state before modifying anything

1. Confirm the working directory and inspect `git status` if Git exists. Preserve all local work. Do not reset or overwrite user changes.
2. Read the most recent versions of, at minimum:
   - `docs/AUTONOMOUS_COMPLETION_REPORT.md`
   - `docs/CLOUD_ACCEPTANCE_REPORT.md`
   - `docs/CLOUD_ACCEPTANCE_CHECKLIST.md`
   - `docs/RELEASE_READINESS.md`
   - `docs/PASSWORD_RECOVERY_ACCEPTANCE.md`
   - `docs/SECURITY.md`
   - `docs/OPERATIONS.md`
   - `docs/SETUP.md`
   - the latest relevant files under `docs/verification/cloud/`
3. Inspect the relevant source, scripts, tests, migration history, Edge Functions, and runtime configuration. Never print secret file contents.
4. Reconcile discrepancies between reports and actual code/commands. Treat old results as historical evidence, not proof of current behavior.
5. Create or update `docs/FINAL_AUTONOMOUS_RUN_CHECKLIST.md` with the real outstanding items, priorities, dependencies, and acceptance tests. Immediately proceed into implementation; do not stop after writing the checklist.

## Phase 1 — Complete the pending real password reset safely

This is the first task because account A's encrypted recovery input and new password are already stored locally.

1. Read and understand, before executing them:
   - `scripts/test-delivered-recovery-staging.mjs`
   - `scripts/set-staging-recovery-input.ps1`
   - the recovery server implementation and its `recovery:serve` command
   - recovery unit/e2e tests and `docs/PASSWORD_RECOVERY_ACCEPTANCE.md`
2. Confirm the credential/input file exists and is readable through the intended local-user-protected mechanism. Do not decrypt and print it, pass values on the command line, write plaintext to disk, or include them in logs.
3. Verify the local recovery server is healthy at exactly the configured callback URL. Reuse an already-running server when appropriate; do not start competing servers on the same port.
4. Check the current saved recovery artifact's age and the runner's actual behavior. The previous helper stated that it did not perform the reset. Use the documented expiry window and actual current state.
5. Run `node scripts/test-delivered-recovery-staging.mjs` **only after the script has been inspected to confirm that it consumes the saved artifact safely and that a run is appropriate**. This task is authorized to perform the user's intended staging password reset using the user-supplied locally encrypted input.
6. Do not blindly rerun a password-changing operation if an earlier attempt may have succeeded. If it fails after reaching the reset API or changing the password, inspect its sanitized report and create/use a read-only or resume verification path before deciding whether another reset is needed.
7. Verify actual outcomes using the least risky method available:
   - whether the recovery artifact was accepted;
   - whether the password update succeeded on the real staging Auth service;
   - whether sign-in using the new password succeeds;
   - whether the old password is rejected, if the old credential is safely available through the approved local credential helper;
   - whether phone verification, academic membership, suspension, and roles remain unchanged;
   - whether invalid/expired/reused links are rejected and the UI shows a clear safe error.
8. Do not ask me for a link/password in chat. If a genuinely fresh recovery artifact is needed, run all independent tasks first, then tell me only the smallest local action required to create it. Do not manufacture one.
9. Update `docs/PASSWORD_RECOVERY_ACCEPTANCE.md` and the cloud/release reports with exact evidence. A 200 from the recovery-request endpoint is not delivery proof; an email arriving is not reset proof.

## Phase 2 — Complete all remaining free staging acceptance

After recovery is tested, continue automatically. Do not stop because the recovery path remains blocked.

### A. Two-account privacy and persistence

- Re-run only the relevant latest live regression tests for A and B; avoid unnecessary signup or redundant broad suites.
- Use independent authenticated clients/browser contexts and real hosted requests.
- Verify a change persists across refresh, logout/login, and independent requests.
- Test populated records where possible: private profile fields, preferences, notifications, bookmarks, academic applications/private marks, roles, project data, and image metadata.
- Check permitted writes and forbidden cross-account reads/writes. Verify server-side rejection of role escalation, phone/membership flag edits, other-user profile mutation, privileged RPC invocation, and private project access.
- Do not count “no rows” as proof of isolation unless the records are known to exist and the test proves a policy-denied result or equivalent authoritative behavior.
- Preserve the previously fixed stale-response privacy regression and its actual two-account test.
- Use account B by signing in; do not register B again.

### B. Auth, session, and membership behavior

- Verify registration/login/session restore/logout and recovery without printing session tokens.
- Preserve the distinction between email-authenticated, phone-confirmed, eligibility-pending, eligible/approved, suspended, reviewer, moderator, and administrator states.
- Never set `phone_verified`, `phone_confirmed_at`, academic approval, or role fields manually. Never use an admin API to bypass normal account flows.
- Since paid SMS is prohibited, investigate a genuinely free supported path only if it is secure and compatible with the existing hosted Supabase project. Do not use fake OTPs or weak development backdoors in connected/staging behavior. If no reliable free SMS method exists, leave phone verification safely blocked, explain why, and continue.
- Test account export/deletion safeguards without deleting A or B. Use non-destructive dry-run checks where available. Do not run account deletion as part of general acceptance.

### C. Scholarly integrations

- Review existing Crossref and PubMed code and the newest tests.
- Verify official API behavior, request identification/contact requirements, current free-use rules, rate limits, attribution, DOI/PMID validation, pagination, caching, timeouts, and honest unavailable/error states.
- Use only a contact address that is already configured and authorized; do not invent an email identity or use someone else's address. If a provider contact must be added and is missing, test everything else offline and record the precise blocker.
- Test the deployed function with valid authenticated requests and expected anonymous/non-member denials. Distinguish a deliberate 401/429 from a successful search. Do not invent papers, full-text availability, corrections, retractions, or live integration results.
- Keep optional AI summaries/embeddings or paid endpoints disabled unless a necessary, genuinely free and justified implementation exists.

### D. Storage and image processing

- Verify migration 21, the current bucket MIME types, Storage privacy, and the existing prohibition on unsupported PDFs.
- Review the image processor and the deployment/secret requirements. Test image decoding, file-type spoofing, malformed images, size/pixel limits, metadata stripping, private-object access, expiry, member revocation, and deletion/cleanup using existing tools and synthetic non-sensitive image fixtures.
- Check whether the processor can run safely on existing free infrastructure without violating quotas or exposing a privileged key. Never assume the local processor is cloud-hosted merely because code exists.
- Run the read-only storage reconciliation tool if available, review the output, and do not delete objects automatically without verifying their exact ownership/status.
- Confirm the daily cleanup schedule is still present and that its target functions exist. Use safe dry-run or transaction-rollback testing for destructive cleanup. Do not manually delete user data.
- Keep academic evidence uploads disabled unless secure validation/scanning, private reviewer access, and lifecycle policies are actually implemented and testable. Do not enable PDF upload merely to finish a checklist.

### E. Account recovery

- Verify the password reset and recovery UI as above. Inspect error handling, redirect allowlists, token/PKCE or implicit-flow support as actually configured, fragment/query cleanup, session clearing, invalid/expired/replayed link behavior, and current-password security.
- Do not install unavailable hosted templates by repeatedly attempting unsupported operations. If Supabase Free cannot install the customized template and no configured free sender works, keep the default supported flow where viable, document the template limitation, and continue.
- Investigate only current providers whose free tiers genuinely support the intended sending/verification use without a required paid upgrade, domain purchase, paid credits, or hidden billing. Do not create accounts or resources that could incur charges.

### F. Platform warnings, dependencies, and security

- Re-run the current package manager's dependency audit and inspect all currently reported platform/service warnings. Do not carry forward historical counts without checking.
- Separate npm dependency vulnerabilities from Supabase dashboard/platform/security advisories. For every warning, record its source, severity, current relevance, safe remediation, and whether it actually applies to this project.
- Apply stable compatible fixes only after reviewing release notes and running relevant tests. Avoid blanket upgrades and avoid introducing unnecessary packages.
- Review RLS coverage for all exposed data tables; grants, fixed search paths, authorization on RPC/Edge functions, request size/rates, CORS, secret separation, URL validation, XSS/input rendering, role assignment, export/delete flows, retention, and Storage. Fix demonstrated issues without weakening the model.
- A clean package audit is not a penetration test. State the limits of all scans honestly.

### G. Operations and recovery

- Inspect `docs/OPERATIONS.md`, current pg_cron/cleanup schedule, storage reconciliation behavior, and retention rules.
- Use free existing facilities for schedules and retention where safe. Verify the actual schedule definitions and permissions.
- Determine whether a full backup/restore can be tested using the current free plan and existing tooling. Do not claim restore success unless executed. If the free tier lacks required backup capabilities, document a manual export/restore test that can be safely done locally or mark the real hosted restore as blocked.
- Check cost/quotas before enabling any scheduled function, worker, SMTP, processor, or third-party API that could create charges.

## Phase 3 — Continuous quality loop

For every change, use:

**Inspect → decide → implement → test → investigate failures → fix → rerun → document → continue.**

Run the relevant actual project commands for lint, typecheck, formatting, unit tests, local SQL tests, native/live database tests when available, Edge tests, browser/connected tests, accessibility, bundle/configuration checks, dependency audit, and production build.

- Preserve tests. Do not delete or weaken assertions to make a suite green.
- Do not stop at compile success. Verify connected behavior with actual staging APIs whenever configuration allows.
- Keep local tests, fixtures, demo-mode tests, mocked behavior, and real staging evidence clearly distinguished.
- If a browser test times out waiting for `networkidle`, investigate whether the app and required APIs are healthy before changing the wait strategy. Use bounded, meaningful content/API checks without removing the real acceptance assertion.
- Capture screenshots only if visual behavior changes or a UI issue is involved. Preserve the existing social-first visual design.
- Do not create a public deployment, commit/push changes, buy services, reset the staging database, delete accounts/data, or make destructive remote changes.
- Before any remote schema or config change, verify project reference `ibxubsegrabpspopdgep`, inspect the proposed change, and use a dry run where supported. Never use a remote database reset.

## Phase 4 — Definition of done

Continue until all feasible zero-cost requirements are tested and corrected or each remainder has a precise external/safety blocker. The goal is the strongest possible verified staging release candidate—not a false claim of production readiness.

Update at minimum:
- `docs/FINAL_AUTONOMOUS_RUN_CHECKLIST.md`
- `docs/AUTONOMOUS_COMPLETION_REPORT.md`
- `docs/CLOUD_ACCEPTANCE_REPORT.md`
- `docs/CLOUD_ACCEPTANCE_CHECKLIST.md`
- `docs/RELEASE_READINESS.md`
- `docs/PASSWORD_RECOVERY_ACCEPTANCE.md`
- `docs/SECURITY.md` and `docs/OPERATIONS.md` if changed findings require it

Keep reports consistent and evidence-based. For each requirement, use a clear state such as COMPLETE AND LIVE-VERIFIED, IMPLEMENTED BUT UNVERIFIED, LOCAL-TESTED ONLY, BLOCKED BY EXTERNAL CONFIGURATION, or NOT IMPLEMENTED. State commands, results, sanitized error codes, and artifacts. Do not include secrets, inbox links/codes, passwords, email addresses, session IDs, or unnecessary personal identifiers.

At the end, write `docs/FINAL_AUTONOMOUS_RUN_REPORT.md` with:
1. Executive summary and honest release-readiness decision.
2. Password recovery outcome, including whether the password change actually happened.
3. Live staging checks and evidence versus local tests.
4. Two-account privacy and persisted-data evidence.
5. Security/platform warnings assessed and actions taken.
6. Integrations completed and blocked.
7. Every important file changed.
8. Commands/tests and exact final results.
9. Remaining blockers and why no secure free option resolved them.
10. A concise list of any user-only actions that are genuinely unavoidable.

The report is a deliverable, not a substitute for implementation.

## Autonomous execution rule

Start now by inspecting the actual project state. Execute Phase 1 safely with the already-saved encrypted recovery input, then proceed through every independent remaining task. Do not ask me to choose routine next steps or write more prompts. If a manual action is truly required, finish all independent work first, then ask for only that single action. Never sacrifice security or the zero-cost requirement to claim completion.
