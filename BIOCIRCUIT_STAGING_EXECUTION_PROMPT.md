# BioCircuit — Staging Cloud Execution Prompt

**Purpose:** Continue the existing BioCircuit project from its completed visual redesign and locally passing tests to a connected, verified cloud-backed staging application. Execute the remaining work methodically, using the explicitly confirmed Supabase staging project below. Do not rebuild the application or publish the frontend.

## Confirmed target — use this exact project

- **Project name expected:** `biocircuit-staging` (verify the actual dashboard name; do not assume the name from the ID)
- **Supabase project reference:** `ibxubsegrabpspopdgep`
- **Dashboard:** https://supabase.com/dashboard/project/ibxubsegrabpspopdgep
- **Project URL expected from the reference:** `https://ibxubsegrabpspopdgep.supabase.co` (verify it in the actual Supabase dashboard before writing local configuration)
- **Allowed remote mutation scope:** this project only, after target identity is verified and a migration dry run has been reviewed.
- **Explicitly not authorized:** public frontend deployment, production-project changes, purchases/upgrades, enabling paid services, destructive resets on remote databases, committing or pushing source, or using actual personal/clinical data.

The user has confirmed that they created this project and supplied its project reference for staging acceptance. Do not ask for the project reference again. If the linked project identity does not match exactly, stop before remote mutation and report the mismatch.

---

## Mission and working principles

Work directly in the current BioCircuit project directory. Complete cloud preparation, safe staging migration/deployment, and real-service acceptance wherever credentials and external configuration allow. Continue through independent tasks instead of stopping at a plan. Do not ask for approval for every routine step; ask only when a human must sign in, configure a provider, supply a secret locally, accept a cost, or make a product/legal decision.

Do not assume that tests previously reported as passing still pass on the current filesystem. Re-run relevant checks and record actual output. Keep visual styling, the social-first layout, content, and interactions intact unless a real connected-mode defect requires a minimal change.

### Current baseline provided by the user

The latest reported local baseline passed:

- lint
- TypeScript checks
- production build
- dependency audit
- 39 unit tests
- 122 database checks
- 10 catalog assertions
- 3 Edge tests
- 47 browser tests

The current visual implementation includes a graphite/cobalt identity, condensed typography, translucent/glass navigation, a pausable moving background, and a BYLD-inspired blue project marquee. Preserve it.

These figures are historical user-provided results. Re-run checks and report fresh results; do not repeat them as new evidence until verified.

## Hard safety requirements

1. Do not require Docker or Podman for the hosted Supabase route. Local Edge Function testing may require a container runtime, but deploy using a documented API-based deployment method if supported by the installed CLI.
2. **Never run `supabase db reset` against the remote staging project.** This command is for local development unless its remote behavior is explicitly selected; do not select remote reset.
3. Before every remote mutation, verify the exact project reference is `ibxubsegrabpspopdgep` and the project is intended for staging. Do not rely solely on a locally linked-project label.
4. Inspect migration status and use `supabase db push --dry-run` before the real push. Inspect what would be applied and any warnings. If the dry run, remote state, or schema-history relationship is unexpected, do not push until the cause is understood.
5. Never use `migration repair`, skip migrations, or manually modify migration history as a shortcut. Diagnose first and preserve the full evidence.
6. Never ask the user to paste passwords, Supabase access tokens, database passwords, service-role/secret keys, SMS-provider credentials, hCaptcha secrets, or processor tokens into ChatGPT or project documentation. The user may type credentials directly into a trusted local terminal or the provider's official dashboard.
7. Never put privileged keys, service-role keys, secret keys, personal access tokens, database connection strings containing credentials, SMS credentials, or hCaptcha secrets in `VITE_` variables, frontend bundles, screenshots, logs, reports, or Git.
8. The only frontend Supabase key may be the project publishable key or legacy anon key, after confirming the project uses the expected key type and all exposed tables have appropriate RLS.
9. Do not create public Storage access for private data, broad/wildcard production origins, fake OTP success states, client-controlled roles, or demo fallbacks in connected mode.
10. Do not expose academic marks, eligibility review details, credentials, private project data, or private images in public APIs or screenshots.
11. Do not upload real patient data, real academic evidence, confidential IP, or personally identifying test data. Use separate synthetic staging accounts and harmless test content.
12. Do not buy or enable billable resources, change a plan, or consent to provider charges without explicit authorization. Real SMS may cost money; do not silently configure paid delivery.
13. Keep the frontend unpublished. Do not run Netlify/Cloudflare/Vercel publish commands or create public deployments as part of this task.
14. Do not reset, clean, delete, or overwrite user work. Inspect the current workspace and backups first. Do not commit or push source.
15. Do not claim any real integration passed unless it was tested against the actual staging service. Distinguish local tests, PGlite/stubs, demo-mode tests, and live cloud tests.

## Canonical materials to inspect

Read what exists in the current workspace, including:

- `MASTER_IMPLEMENTATION_PROMPT.md`
- `BIOCIRCUIT_CLOUD_ACCEPTANCE_PROMPT.md`, if present
- the social redesign and visual art-direction specifications, if present
- `docs/IMPLEMENTATION_AUDIT.md`
- `docs/IMPLEMENTATION_STATUS.md`
- `docs/BUILD_REPORT.md` and any root `BUILD_REPORT.md`
- `docs/SETUP.md`
- `docs/SECURITY.md`
- `docs/OPERATIONS.md`
- `docs/VISUAL_ART_DIRECTION_REPORT.md`
- `docs/CLOUD_ACCEPTANCE_REPORT.md`, if present
- `.env.example`, `.gitignore`, `package.json`, lockfile, Vite config, `supabase/config.toml`, all migration files, seed SQL, all four Edge Functions, shared function utilities, scripts, and test files.

Some earlier prompt files may not exist. Record missing optional files but do not block implementation merely because an old prompt file is absent. Treat the current source, migration files, reports, and tests as evidence of the actual project state.

## Phase 0 — Inspect current state and prepare tracking

1. Confirm the project working directory.
2. Inspect the tree and check `git status` if Git exists. The prior report said this workspace had no Git repository; verify rather than assume. Do not initialize Git automatically.
3. Check the latest `docs/VISUAL_ART_DIRECTION_REPORT.md`, screenshots, and the current running app if available. Preserve the visual design.
4. Re-run the available local checks: lint, strict TypeScript, unit tests, database checks, catalog assertions, Edge tests/types, browser tests, config/bundle checks, dependency audit, and production build, using actual package scripts.
5. Verify `.env.local` and other secret/config files are ignored by the current `.gitignore`. Inspect environment variable names without printing values. Do not dump `.env` files or secrets to the terminal transcript.
6. Create or update `docs/CLOUD_ACCEPTANCE_CHECKLIST.md` with each task status: `NOT STARTED`, `IN PROGRESS`, `PASS`, `BLOCKED`, or `FAIL`.
7. Create/update `docs/CLOUD_ACCEPTANCE_REPORT.md` with current baseline, project target reference, safe configuration plan, commands executed, sanitized outputs, and blockers.
8. Continue directly into Phase 1 after recording the checklist; do not stop for approval.

## Phase 1 — Check CLI, authentication, and target identity

Official docs to consult in their current form:

- Database migrations: https://supabase.com/docs/guides/deployment/database-migrations
- CLI database migration workflow: https://supabase.com/docs/guides/local-development/cli-workflows
- CLI `db push` reference: https://supabase.com/docs/reference/cli/supabase-db-push
- Edge Function deployment: https://supabase.com/docs/guides/functions/deploy
- Edge Function secrets: https://supabase.com/docs/guides/functions/secrets
- Phone authentication: https://supabase.com/docs/guides/auth/phone-login
- CAPTCHA: https://supabase.com/docs/guides/auth/auth-captcha
- Private Storage: https://supabase.com/docs/guides/storage/buckets/fundamentals
- Production checks: https://supabase.com/docs/guides/deployment/going-into-prod

Use local CLI help before relying on any flags:

- `supabase --version`
- `supabase --help`
- `supabase link --help`
- `supabase migration list --help`
- `supabase db push --help`
- `supabase functions deploy --help`

### Authentication

Check if the CLI is already authenticated. If not, start the official interactive login (`supabase login`) and let the user complete browser/device authentication locally. Do not ask them to paste a personal access token into chat. If the agent environment cannot complete interactive login, stop for that single action after doing all independent work and give the user the exact command to run in their trusted local terminal. Resume from that point.

### Verify the target

Use the provided reference exactly: `ibxubsegrabpspopdgep`. Inspect the Supabase project list/dashboard metadata when available and ensure that this reference maps to the intended newly created staging project. The dashboard link is https://supabase.com/dashboard/project/ibxubsegrabpspopdgep.

If the actual project display name is not `biocircuit-staging`, report the actual name and ask for confirmation before mutating it. A name difference alone does not mean the ref is wrong; validate the actual identity. Never silently link to another project.

## Phase 2 — Review all migrations and plan the remote change

The current implementation report describes 19 versioned migrations and a private schema/RLS/Storage model. Verify the current file count and contents instead of assuming it has not changed.

Inspect every migration for:

- destructive `DROP`/`TRUNCATE`/data rewrite operations;
- privilege and grant changes;
- RLS enablement, policy scopes, and table grants;
- `SECURITY DEFINER` functions, fixed search paths, grants and argument validation;
- private bucket configuration and Storage policies;
- triggers and migration ordering;
- assumptions about Auth, Storage, `auth.uid()`, roles, extensions or platform-managed schemas;
- forward compatibility, idempotency, and any hard-coded project-specific values.

Then:

1. Link the working repository using the confirmed project reference. If linking prompts for the database password, the user should type it in the trusted local terminal; never put it into chat or a report.
2. Run `supabase migration list` and capture only non-secret status output.
3. Inspect the remote schema/history state. Check whether the project is newly provisioned/empty or has unexpected objects/data.
4. Run `supabase db push --dry-run` (only if the installed CLI help confirms support). The current documented CLI supports `--dry-run`, but still verify the installed version.
5. Review the exact proposed migration list and warnings. Do not push if unexpected migrations, destructive changes, or out-of-sync history appear.
6. Once target and plan are verified as safe for this staging project, run the ordinary migration push to this project only. Do not include seed data by default.
7. Verify remote migration history, required tables, functions, indexes, RLS enabled on exposed application tables, and bucket privacy.
8. Run real hosted SQL checks where supported. Clearly note that the existing PGlite tests with Auth/Storage stubs are not native hosted tests.

A recently created project may have managed platform schemas or tables. Do not assume it is completely empty without checking. Do not reset it remotely to make migrations pass.

## Phase 3 — Configure the connected frontend

Use the real project URL from the dashboard and the publishable key (or legacy anon key, if that's what this project's API settings provide). Confirm `.env.example`, `src/env.d.ts`, and the config guard before writing any variable.

Expected public variable names in the current setup documentation are:

- `VITE_APP_MODE=connected`
- `VITE_SUPABASE_URL=https://ibxubsegrabpspopdgep.supabase.co` (verify exact URL in dashboard)
- `VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key from this project's dashboard>` (if the project uses a legacy anon key, follow the code's supported variable semantics; don't invent a new variable)
- `VITE_HCAPTCHA_SITE_KEY=<public site key>` only after the CAPTCHA site is configured.

Place these values in the local ignored `.env.local`, not in source code or committed files. Public client configuration is not a substitute for RLS. Verify the file is ignored without printing its contents. Restart Vite after changing environment values.

Test connected mode for:

- correct project endpoint and initialized SDK;
- missing/invalid configuration and clear setup errors;
- no silent fallback to synthetic local demo data;
- sensible unauthenticated state and no uncaught browser errors;
- browser requests target the expected staging URL, not an accidental production or unknown project;
- no privileged secrets appear in emitted bundle files.

Keep the frontend running locally for staging tests; do not publish it.

## Phase 4 — Deploy the four Edge Functions to staging

Inspect and deploy only the functions currently present:

- `scholarly-search`
- `account-delete`
- `avatar`
- `project-images`

Before deployment, confirm each has:

- `verify_jwt` configuration appropriate to its access model;
- explicit current-user validation (`getUser`) as implemented;
- separate user-scoped and privileged clients;
- exact-origin CORS, not wildcard CORS for authenticated private workflows;
- bounded request bodies, timeouts, and generic safe error responses;
- no accidental secret logging;
- correct authorization and rate-budget checks;
- no bypass of RLS or private membership checks.

After target verification and CLI authentication, use the installed CLI's current supported API deployment method. Current official Supabase documentation describes `functions deploy <name> --use-api` for deploying without local Docker; verify the flag with `supabase functions deploy --help` first. Deploy the functions one at a time and inspect each result before proceeding.

Do not disable JWT verification because a test call fails. Diagnose expected authentication requirements and test using an authorized staging account.

## Phase 5 — Set only necessary Edge secrets securely

Read every function and `docs/SETUP.md` first. Determine which environment variables the functions actually require. The setup guide previously lists some of these server-only names:

- `ALLOWED_ORIGIN`
- `CROSSREF_MAILTO`
- `NCBI_EMAIL`
- optional `NCBI_API_KEY`
- `AVATAR_PROCESSOR_URL`
- `PROJECT_IMAGE_PROCESSOR_URL`
- `AVATAR_PROCESSOR_TOKEN`

Supabase's Edge runtime provides Supabase service values in the function environment; check actual code/runtime assumptions instead of duplicating or overriding built-ins unnecessarily.

Use `supabase secrets set --help` and current official documentation to choose a secure process. If using a local env file with a CLI `--env-file` option, keep that file in a Git-ignored location, create it with restrictive file permissions, never print it, and never include it in reports. Otherwise use the trusted Supabase Dashboard secret form. Do not pass secrets in a way that will appear in shell history. Do not ask for a secret in chat.

Set source contact information only to an address the user authorized. Do not invent a contact identity. If no real contact can be supplied, document that source-proxy deployment may exist but the provider workflow is blocked/incomplete.

Functions may deploy but still fail closed if a missing source contact or processor endpoint is required. That is preferable to fake success.

## Phase 6 — Configure authentication, phone OTP and CAPTCHA

Inspect the actual Auth flow and current project settings. Configure the portions possible without a paid provider.

1. Enable phone sign-up/confirmation only after confirming project Auth settings and the selected provider.
2. Configure OTP length/expiry, resend limits, signup limits, verification limits and appropriate abuse protections supported by managed Auth.
3. Configure hCaptcha only after the user has registered the correct local/staging site and obtained its public site key and secret. The public site key can be used in the frontend; the CAPTCHA secret belongs in managed Auth settings only.
4. Match the Auth site's allowed URL/redirect list to the actual local development URL and exact staging frontend origin. No wildcard production redirects.
5. Keep phone verification separate from academic eligibility approval. Phone confirmation must reflect actual provider Auth state; never set it manually.
6. Never use fixed OTPs or bypass provider verification outside explicitly isolated existing demo tests.

Real SMS delivery usually requires provider setup and may cost money. Do not buy/upgrade/configure a paid service without explicit approval. If the SMS provider is not configured, finish all independent work, record OTP as `BLOCKED — USER CONFIGURATION`, and tell the user which dashboard page and provider information is needed. Do not claim real OTP passed.

For actual OTP testing use dedicated test numbers/accounts and actual delivered codes. Verify correct, incorrect, expired, reused and rate-limited codes; cooldown/resend behavior; CAPTCHA missing/invalid; account enumeration resistance; phone change/reverification; global logout; and that a phone-confirmed pending applicant still lacks approved-member privileges.

## Phase 7 — Scoped roles, academic eligibility and access-control verification

Never seed or assign real privileged roles automatically. Do not give the current user admin rights without a trusted, explicit decision. If role bootstrap is needed, explain the minimal trusted-admin procedure and ask only for the required action.

Use separate staging accounts/roles for anonymous, phone-confirmed pending applicant, approved member, other member, reviewer, moderator, administrator and suspended account. Do not use real marks or real academic evidence.

Test actual HTTP/RPC/database behavior for:

- private academic applications, marks, notifications, bookmarks and profile fields;
- role escalation attempts and direct RPC calls;
- access to other users' posts, draft/state changes, private projects, collaboration requests and images;
- post create/edit/delete/report; comments/replies, helpful response, accepted answer, saves, follow, block and mute;
- project owner/member checks, requests, removal, transfer, archive/delete;
- duplicate/self/recipient/day contribution-point constraints and invalidation;
- server-side pagination, search, provider errors, notification preferences;
- account export, global sign-out and deletion.

Use multiple authenticated accounts. A single browser using a mocked or shared UID does not establish cross-user isolation. RLS remains the primary data boundary.

## Phase 8 — Scholarly discovery and real provider responses

Configure the `scholarly-search` function for Crossref and PubMed/NCBI based on current function source. Verify provider contacts, optional API key, outbound calls, cache, provider budgets, timeout, pagination, DOI/PMID validation, canonical links and provenance.

Test with actual source queries:

- valid results and empty results;
- invalid input and oversized request;
- unauthenticated request;
- provider timeout/unavailable response;
- malformed or rate-limited upstream response;
- pagination and repeat queries/cache behavior;
- truthful attribution and publication metadata.

Do not fabricate results, claim full-text access when only metadata is available, or automatically label records retracted without a trustworthy source. If a contact/provider requirement cannot be configured without user input, mark it blocked and test all independent error paths.

## Phase 9 — Processor hosting, private Storage and image tests

The avatar/project-image workflow relies on a first-party Node/Sharp processor. Supabase Edge Functions must not be treated as a persistent hosting service for this separate process.

1. Inspect `scripts/avatar-processor.mjs`, `docs/SETUP.md`, the Edge function request contracts, and the private Storage migrations/policies.
2. Determine whether the processor has a secure hosting option already available to the user. If not, compare current official host documentation and cost/idle limits before recommending one.
3. Do not create billable resources or claim a permanent free service without verification and user approval.
4. Require HTTPS, a strong server-only shared token, small bounded request bodies, safe network exposure, runtime-compatible Sharp binaries, request timeout/concurrency limits, and restricted egress. Do not expose an unauthenticated processor or arbitrary URL fetching.
5. Set `AVATAR_PROCESSOR_URL` and `PROJECT_IMAGE_PROCESSOR_URL` only once the processor is safely hosted and reachable over HTTPS. Keep `AVATAR_PROCESSOR_TOKEN` server-only.
6. Keep credential evidence/PDF uploads disabled; scanning and reviewer-only signed access are not implemented.
7. Test actual file processing, malformed/spoofed/oversized files, PNG/JPEG decoding, metadata stripping, project membership checks, private buckets, signed URL expiry, removed-member behavior, replacement/removal, tombstone cleanup and failure compensation.
8. Do not infer scientific measurements from downsampled previews; the existing processor changes image data. Preserve original scientific files outside this preview upload feature.

If no approved/free/safe hosting route is available, keep uploads unavailable and mark the integration blocked rather than making the Storage bucket public.

## Phase 10 — Cleanup, retention, exports, deletion and backups

Review `scripts/cleanup-storage.mjs`, retention functions, `docs/OPERATIONS.md`, and the account deletion Edge Function. Verify scopes, authentication, batch sizes, retry/acknowledgment logic, idempotency and safe failure behavior.

Do not start recurring destructive retention/deletion jobs until the user has selected a policy and the job has been reviewed. You may test bounded jobs against synthetic staging records. Never run cleanup against production or remove records merely to clear a test. Verify account deletion preconditions, project ownership transfer requirements, export scoping, Storage deletion, session revocation and cleanup queue correctness.

Configure real schedules or backup/restore only if supported by the chosen plan. Do not promise free/unlimited retention. Perform an actual backup/restore rehearsal if the project/plan permits without risking the only copy of data; otherwise mark it as a release blocker and document the exact Dashboard procedure.

## Phase 11 — Real connected browser acceptance

Run the existing local app with `VITE_APP_MODE=connected` pointing to the confirmed staging project. Keep the accepted visual redesign intact.

Test at desktop/tablet/mobile sizes:

- logged-out/loading/authorized/denied/error and empty states;
- onboarding and actual Auth redirects;
- feed queries, publish, replies, reactions, save/share/report, pagination and refresh;
- questions and accepted answers;
- public/private project behavior and collaboration requests;
- journals, source proxy results and failure states;
- profile editing/visibility and collaborator discovery;
- notifications/preferences, blocks/mutes, contribution ledger;
- trust/moderation and academic eligibility states;
- settings, export, session revoke and account deletion;
- keyboard focus, modal escape/return, reduced motion, mobile reflow and no horizontal overflow.

Collect browser console/network evidence and take screenshots without exposing tokens, personal data or secret configuration. Fix regressions introduced by the cloud integration and repeat the affected tests.

A browser suite using synthetic demo mode is not live-service evidence. Label each test with the actual backend mode.

## Phase 12 — Security, plan and launch gates

In the Supabase Dashboard, inspect available Security Advisor and Performance Advisor results, Auth settings, RLS posture, bucket privacy, function secrets/config, database indexes and provider logs.

Run current local checks again: lint, typecheck, unit tests, catalog assertions, PGlite/database tests, Edge types/tests, browser tests, bundle/config checks, dependency audit and production build. Verify secrets are absent from generated bundles and reports.

Record unresolved concerns honestly:

- provider SMS charges/limits, hCaptcha settings and regional requirements;
- native cloud Auth/Storage/RLS behavior not covered by local stubs;
- processor hosting and remaining document uploads;
- email verification/digest delivery, if still unimplemented;
- manual screen-reader/physical-device testing;
- database backup/restore and schedules;
- no public frontend deployment.

Do not make the public frontend deployment a part of this prompt's execution.

## Required deliverables

Create/update:

- `docs/CLOUD_ACCEPTANCE_CHECKLIST.md`
- `docs/CLOUD_ACCEPTANCE_REPORT.md`
- `docs/RELEASE_READINESS.md`

For each acceptance item choose exactly one of:

- `PASS — LIVE VERIFIED`
- `PASS — LOCAL ONLY`
- `BLOCKED — USER CONFIGURATION`
- `FAIL — REPAIR REQUIRED`
- `NOT APPLICABLE`

Every result must state the test/command actually run, the target environment, relevant sanitized output, limitations, and next action. Keep private values out of all reports. Include the exact staging project reference `ibxubsegrabpspopdgep`, but no keys or passwords.

The final report must separately state whether live migration/RLS, OTP, CAPTCHA, Edge Functions, Crossref/PubMed, Storage, image processor, export/deletion, cleanup, schedule, backup/restore, and connected browser flows were verified against the actual hosted project.

## Final execution directive

Begin now. Inspect the current working tree and official CLI help/docs, authenticate through the safe interactive workflow if necessary, confirm the target reference, review migrations, run the dry run, and apply only the safe migration plan to `ibxubsegrabpspopdgep`. Deploy and verify all independently feasible staging integrations. Keep the frontend unpublished. If a required provider credential or user-dashboard action is missing, complete everything else first, then provide a single concise instruction for the exact blocker. Never fabricate results, weaken authorization, or claim production readiness while any required release gate remains open.
