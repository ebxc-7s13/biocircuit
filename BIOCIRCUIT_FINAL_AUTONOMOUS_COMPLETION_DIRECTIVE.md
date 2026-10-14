# BioCircuit — Final Autonomous Completion Directive

**Purpose:** Finish every feasible part of BioCircuit using strictly free resources, with evidence-based testing against the existing Supabase staging project. Do not stop after one blocked feature, and do not require the user to write a new prompt for every phase.

## Confirmed project context

- Existing project: BioCircuit, an established React/TypeScript/Vite application with a social-first visual redesign.
- Staging project reference: `ibxubsegrabpspopdgep`.
- Staging dashboard: `https://supabase.com/dashboard/project/ibxubsegrabpspopdgep`.
- The existing staging project has 19 migrations applied and four Edge Functions deployed.
- The frontend remains unpublished.
- Email/password authentication is enabled in staging and email confirmation is disabled for staging tests. Account A and account B have been registered through normal signup, and their credentials are stored locally using the project's Windows DPAPI helper.
- Prior live tests found and fixed a real race/privacy bug where delayed responses from account A could appear after switching to account B. Later live evidence reports successful two-account isolation, independent sessions, persistence, export ownership, and denial of unauthorized operations.
- The app includes recovery UI, managed recovery link/code verification, redirect configuration, URL cleanup, session safeguards, and a hosted password minimum of 12. Local verification reported 76 unit tests, 47 browser tests, four responsive recovery checks, lint, type checks, and production build passing. Use the latest actual reports rather than treating these summary values as guaranteed current results.
- **Password recovery is not fully verified.** Supabase rejected the custom hosted email-template installation with HTTP 400 because this new Free project uses the default SMTP. The local file `supabase/templates/recovery.html` is not installed. A read-only preflight found no recovery artifact, and no password was changed. The existing safe next step is for the user to check account A's inbox privately; if a real recovery link/code exists, use the supplied local helper `scripts/set-staging-recovery-input.ps1` and follow the documented acceptance procedure.
- Real SMS OTP is not configured because Twilio cannot be upgraded. Do not purchase credits or enable paid services. Academic eligibility cannot be fabricated or bypassed.
- Remaining reported gates include: delivered email and successful reset; protected-record fixtures/approved-member workflows; scholarly source integrations; private image processing/uploads; operational recovery/backup/restore; and 28 platform warnings that must be inspected and explained. A separate npm audit previously reported zero known package vulnerabilities; distinguish package advisories from Supabase platform/security/performance warnings.
- The strict constraint is **zero monetary cost**. No paid trials, plan upgrades, paid API credits, new billable resources, or surprise charges.

## Official documentation starting points

Use current official documentation and verify current settings before making decisions:

- Supabase default Auth SMTP limitations: https://supabase.com/docs/guides/auth/auth-smtp
- Supabase change to auth template customization on new Free-tier projects: https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier
- Supabase password-based Auth: https://supabase.com/docs/guides/auth/passwords
- Supabase phone login and SMS-provider requirements: https://supabase.com/docs/guides/auth/phone-login
- Supabase Storage private downloads: https://supabase.com/docs/guides/storage/serving/downloads
- Supabase database backups: https://supabase.com/docs/guides/platform/backups
- Supabase security advisors: https://supabase.com/docs/guides/database/database-linter

Supabase's documentation currently states that the hosted default email SMTP is for non-production use, may send only to pre-authorized organization/team addresses, has a low adjustable/variable sending limit (currently documented as two messages per hour), and has no delivery SLA. Starting 3 June 2026, new Free-tier projects using the default SMTP cannot customize Auth email templates; a configured custom SMTP provider permits customization. Verify current behavior for this exact staging project before relying on these rules. Do not treat a template customization error as proof that password recovery itself is impossible.

---

# Operating rules

1. **Act autonomously.** Inspect, decide, implement, test, fix, re-test, and document. Do not ask the user to design the workflow or write another prompt for each task.
2. **Strictly free.** Investigate legitimate zero-cost alternatives and verify plan limits, domain requirements, quotas, acceptable-use terms, data handling, and hidden billing risk. Do not upgrade a plan, buy credits, add a paid service, start a paid trial, or enable a service that can incur charges.
3. **Never fake verification or success.** No fabricated OTP, phone verification, academic approval, email delivery, reset completion, backup restoration, scholarly records, image upload, or permission result.
4. **Never weaken security.** Do not disable RLS, loosen grants, bypass Edge authorization, grant privileged roles for convenience, edit verification flags directly, use admin APIs to manufacture user accounts/approvals, or weaken tests to obtain a green result.
5. **No destructive remote actions.** Do not reset the hosted database, delete user accounts or records, overwrite remote data, change production resources, or publish the frontend. Check the project ref before every remote operation. Read-only diagnostics and approved non-destructive staging tests are allowed.
6. **Protect all secrets.** Keep credentials in the approved local DPAPI-protected helpers or trusted service dashboard secret fields. Never print or report passwords, OTPs, tokens, private keys, database URLs containing secrets, personal academic information, session payloads, or recovery URLs.
7. **Preserve the existing product.** Keep the social-first layout, visual art direction, routing, database schema, migrations, Edge Functions, and working behavior unless a proven defect requires a targeted fix.
8. **Separate evidence categories.** Label each result as local unit/test fixture, local PostgreSQL/PGlite, hosted staging/live, blocked by external configuration, or not implemented. Never use a local test as evidence that a hosted integration passed.
9. **No infinite loop.** Use measurable acceptance gates and bounded test retries. When one task is blocked, finish independent tasks rather than waiting indefinitely.
10. **User interaction only for unavoidable external actions.** If an action requires the user to open an inbox, enter provider credentials, approve legal terms, or complete a sensitive recovery step, finish all unrelated work first and give one exact request. Do not access their inbox or change their password without a real recovery artifact and explicit authorization.

# Phase 0 — Establish the real current state

Before edits:

- Confirm the project root and inspect `git status` if Git exists; preserve all changes.
- Read the latest versions of `docs/CLOUD_ACCEPTANCE_REPORT.md`, `docs/CLOUD_ACCEPTANCE_CHECKLIST.md`, `docs/RELEASE_READINESS.md`, `docs/PASSWORD_RECOVERY_ACCEPTANCE.md`, `docs/SECURITY.md`, `docs/OPERATIONS.md`, relevant setup documents, and the latest verification JSON/logs.
- Inspect `scripts/set-staging-recovery-input.ps1`, recovery test runners, local credential helpers, `supabase/templates/recovery.html`, auth configuration, migrations, storage policies, Edge Functions, image processor, scholarly functions, and npm scripts.
- Never display secrets while inspecting configuration.
- Build a requirement ledger identifying each unfinished acceptance gate, existing evidence, cheapest safe path, dependencies, and measurable success conditions.
- Do not re-run a script that signs up users or changes passwords until you understand whether it is destructive or would duplicate existing identities.

Then continue without asking for approval.

# Phase 1 — Finish password recovery if possible, then move on

## 1A. Check for an actual recovery artifact

- Review the report and the documented safe preflight procedure.
- Do not read the user's mailbox. Ask the user to inspect account A's inbox privately only if no recovery artifact has been supplied.
- If the user has a real recovery link/code, use `scripts/set-staging-recovery-input.ps1` according to its own implementation and documentation. Inspect the helper before using it. Keep the artifact secret and local; never echo it.
- Follow the existing staging test runner and confirm the project reference is exactly `ibxubsegrabpspopdgep`.
- Complete the reset only when a genuine, valid artifact exists and the existing procedure explicitly authorizes the reset test. Do not guess tokens, manufacture recovery links, call administrative APIs to set a password, or change any account password in the absence of the artifact.

## 1B. Investigate free delivery alternatives accurately

- Check if account A is a pre-authorized member of the Supabase organization, whether a default-SMTP reset message was actually sent, and whether the provider has rate-limited it. Do not spam repeated requests; respect documented limits.
- The custom template HTTP 400 is not proof that Supabase's default password-reset template cannot be used. Investigate the supported default-template path separately.
- Research current SMTP providers and free tiers using official documentation. Check whether they require a verified domain, a paid plan/card, approved sender/domain, daily caps, or trial restrictions. A `free tier` label alone is insufficient.
- Consider a user's already-owned verified sending domain and a legitimate free SMTP tier only if available and authorized. Do not buy a domain, invent sender identities, impersonate a third party, or set up prohibited relay behavior.
- If no approved, truly free sender is available, leave email recovery as `BLOCKED BY EXTERNAL CONFIGURATION`, document the exact blocker, and continue all other phases. Do not keep stopping the entire project for this single gate.

## 1C. Recovery acceptance, if a real email can be received

Verify actual receipt, valid recovery link/code, redirect to the approved staging URL, token consumption/expiry behavior, password update, URL secret cleanup, no session confusion, login with new password, rejection of old password, session revocation/continuity as intended, and generic errors. Verify there is no accidental phone verification or membership approval. Record sanitized evidence only.

# Phase 2 — Re-verify two-account persistence and privacy

Use the already registered Account A and B with the existing DPAPI credential files and supported runner. Do not recreate accounts unless an explicit isolated test genuinely requires it and the user has authorized that behavior.

- Authenticate A and B in independent browser contexts.
- Confirm session separation through navigation, reload, expiry/refresh behavior, logout, and subsequent login.
- Check actual hosted persistence for own profile and preferences across refresh and login.
- Verify cross-account reads and writes for private profile fields, preferences, notifications, bookmarks, academic applications, roles, project metadata, and any configured private objects.
- Ensure test data is populated for each assertion. An empty result alone is not sufficient evidence of correct isolation.
- Verify attempts to modify another user's record, phone-confirmation flags, academic state, role, project membership, moderation state, and privileged RPCs are rejected by the actual hosted service.
- Check delayed responses cannot leak A's data after switching to B.
- Verify current server behavior on any unexpected result. Fix the proven root cause with the smallest safe change, test it, and preserve the original regression evidence.
- Do not attempt to read all data using a privileged key merely for convenience. Use privileged access only for documented operator setup where necessary and authorized, never in the browser.

# Phase 3 — Approved-member workflows and protected-record fixtures

This phase must be truthful. Email authentication is not phone verification, and successful login is not academic approval.

- Inspect the existing application-review workflow, reviewer role bootstrap instructions, review RPCs, appeal flow, role expiry/revocation, and controlled test fixture strategy.
- Identify whether there is a legitimate free, policy-compliant way to test approved-member operations. Use the existing application/submission and reviewer process where feasible.
- Do not auto-approve the user, forge evidence, create synthetic verification claims in the hosted production-facing data, directly change verification flags, or give test users reviewer/admin roles solely to force a pass.
- If a trusted reviewer role must be bootstrapped, follow the project's documented trusted-operator process, confirm a real application, record the actual operator action privately and minimally, and do not approve academic eligibility without genuine evidence and authorized review.
- If approved-member fixture creation is blocked by absent proof or authorized reviewer action, test all permitted pending-account operations plus negative cases, document the positive approved-member tests as blocked, and proceed.
- Create only the minimum non-sensitive test records required; use controlled staging data, no patient details or real confidential research.

# Phase 4 — Scholarly-source integrations

Inspect all deployed functions and current provider configuration. Test actual live Crossref/PubMed requests when available, using official endpoints and compliant identifiers.

- Verify authentication, exact-origin CORS, bounded request sizes, timeouts, provider limits, cache behavior, pagination, canonical DOI/PMID URLs, metadata provenance, correction/availability labels, and honest error states.
- Check server-side contact identity/configuration requirements and set only legitimate, approved contact data through the appropriate secret settings.
- Do not put service keys or private contacts into `VITE_` variables, client bundles, reports, or public files.
- Add rate-limit and error-path tests that can run for free.
- Do not fabricate scholarly hits, infer that full text is free, or claim a provider is operational when configuration is missing.
- If one provider fails or is unavailable, continue with the other and complete unrelated tests.

# Phase 5 — Image uploads, file safety, and Storage

Inspect existing private buckets, image Edge Functions, Sharp processor service, membership checks, signed URL duration, tombstone queue, and cleanup scripts.

- Verify which components are deployed and which require hosting or secrets.
- Search for suitable genuinely free hosting only if the plan's terms, resource limits, network access, persistent availability, and TLS satisfy the security requirements. No free hosting assumption without evidence.
- Check PNG/JPEG decoding, spoofed MIME types, malformed and oversized files, dimensions, metadata stripping, image re-encoding, membership checks at upload and read, private URL expiration, revocation, deletion, retries, and orphan cleanup.
- Use safe synthetic test images; do not upload patient images or private academic evidence.
- Do not accept documents or unprocessed uploads to work around missing scanning. Keep unsupported PDF/credential evidence disabled and plainly labelled.
- If no zero-cost processor host can meet the safety requirements, leave the feature disabled and document the exact blocker. Do not expose service secrets or make private objects public.

# Phase 6 — Platform warnings and dependency review

The reports may contain 28 Supabase platform warnings while npm audit reported zero known package vulnerabilities. Do not conflate these categories.

- Retrieve the actual latest warning/advisor output from the dashboard/CLI or report. Classify each warning as security, performance, configuration, or informational.
- Determine the affected table/function/index/policy, actual severity, exploitability, and recommended fix.
- For RLS warnings, inspect actual exposed schemas, policies, grants, RPC execution privileges, and function search paths. Confirm the intended access model before changes.
- For performance warnings, check query patterns and existing indexes; make only justified migration changes.
- For configuration warnings, apply safe free settings where possible and document risks where a setting would break correct behavior.
- Do not blanket-disable warnings, add broad public policies, or change database settings without understanding effects.
- Review npm advisories separately. Inspect actual advisory details and compatibility, fix safe vulnerabilities with minimal upgrades, rerun relevant tests, and leave unresolved items documented with rationale. Do not blindly upgrade every package.
- Use free local checks and current official guidance. Do not claim that zero npm vulnerabilities means full security.

# Phase 7 — Operational recovery and account lifecycle

Inspect export, deletion, cleanup, backup, retention, and recovery procedures.

- Test user-scoped export without printing personal payloads.
- Test safe account deletion prerequisites and cleanup logic without deleting existing A/B accounts.
- Inspect project transfer requirements, Storage cleanup queue, retries, idempotency, and orphan reconciliation.
- Determine what database/Storage backup and restore are available on the actual free plan. Do not assume platform backup is included; verify current official terms.
- If an isolated restore target can be used free without creating billable resources, test an export/restore or documented restoration process safely. Never reset the current staging project for a recovery test.
- If backup/restore or scheduled job functionality is unavailable on the free plan, implement and test any safe code-level backup/export utilities and document the platform limitation. Do not claim a production recovery plan is proven.
- Verify account recovery, logout, session revocation, deletion restrictions, and no stale sessions or data across identities.

# Phase 8 — UX, accessibility, performance, and reliability regression

Preserve the existing social-first design and recent visual art direction.

- Run existing browser tests for desktop/tablet/mobile layouts, dialog flows, theme, motion preferences, routing, keyboard behavior, and loading/error states.
- Add tests only where a genuine gap exists; avoid duplicating tests with no value.
- Check keyboard and reduced-motion support, accessible labels, responsive overflow, navigation overlap, error messaging, and focus management.
- Inspect performance with existing free tooling. Avoid heavy dependencies or continuously forcing UI rendering for animations.
- Do not perform superficial redesigns or refactor stable components without evidence.

# Phase 9 — Full regression and release evaluation

Run the supported scripts in `package.json` and other documented test tools, including where available:

- npm install reproducibility / lockfile check
- lint
- strict TypeScript checks
- unit/component tests
- local SQL/authorization tests
- Edge type/HTTP tests
- connected staging acceptance tests
- browser/E2E tests
- format checks
- package audit
- bundle/config/secret checks
- production build

Do not remove tests, relax assertions, hide expected failure categories, or count a blocked test as a pass. Verify a clean or understood working tree. Do not commit/push unless explicitly requested. Do not deploy the frontend publicly.

# Phase 10 — Final evidence and decision

Update the existing reports:

- `docs/CLOUD_ACCEPTANCE_REPORT.md`
- `docs/CLOUD_ACCEPTANCE_CHECKLIST.md`
- `docs/RELEASE_READINESS.md`
- `docs/PASSWORD_RECOVERY_ACCEPTANCE.md`
- `docs/SECURITY.md` and `docs/OPERATIONS.md` if their current guidance is changed

Create or update a concise `docs/FINAL_COMPLETION_REPORT.md` with:

- Starting state and previous evidence reviewed.
- Work completed in this run, with key changed files.
- Exact commands and checks executed and results.
- Hosted staging tests versus local tests, clearly separated.
- Two-user privacy and persistence evidence.
- Recovery delivery/reset status and why it passed or remains blocked.
- Actual platform warnings by category and disposition.
- Scholarly and image/storage integration status.
- Operational recovery evidence and limits.
- Every remaining feature categorized as `COMPLETE AND VERIFIED`, `IMPLEMENTED BUT UNVERIFIED`, `BLOCKED BY EXTERNAL CONFIGURATION`, `PARTIALLY IMPLEMENTED`, or `NOT IMPLEMENTED`.
- The next required user action, if any, in one exact request.
- A truthful release-readiness decision.

## Completion rule

Do not stop simply because password recovery is blocked. Continue with cross-user security, protected-member flows, scholarly integrations, storage safety, advisories, and operational recovery. Finish every task that can be completed securely with existing free resources. If the user must inspect an inbox or configure a credential, record that as a blocker while proceeding with independent tasks.

Do not label BioCircuit production-ready unless every mandatory release gate actually passes. If some gates inherently require paid SMS or unavailable free infrastructure, produce the strongest safe zero-cost release candidate, keep those capabilities unavailable or clearly constrained, and explain the trade-off.

**Start now by reading the latest reports and code. Make the implementation decisions yourself. Do not ask the user for another task-by-task prompt.**
