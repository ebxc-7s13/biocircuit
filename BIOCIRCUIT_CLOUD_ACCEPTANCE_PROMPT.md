# BioCircuit — Cloud Backend Acceptance and Release Readiness

## Mission

Take the existing BioCircuit project from a well-tested visual implementation to a genuinely connected, cloud-backed staging application. Work in the existing project. Do not start over, flatten the architecture, remove working features, or weaken security.

The visual design phase has passed its current acceptance checks. The next priority is **real cloud-service integration and verification**, not another UI redesign.

Use a cloud Supabase development project rather than requiring Docker or Podman on the developer workstation. The Supabase CLI supports linking and deploying Edge Functions to a hosted project without a local container runtime. Verify every command against the installed CLI's `--help` and official current Supabase documentation before running it.

## Canonical sources to read first

Read all of the following, if present, before changing files:

- `MASTER_IMPLEMENTATION_PROMPT.md`
- `BIOCIRCUIT_SOCIAL_REDESIGN_SPEC.md`
- `BIOCIRCUIT_VISUAL_ART_DIRECTION_PROMPT.md`
- `BIOCIRCUIT_AUTONOMOUS_VISUAL_POLISH.md`
- `docs/BUILD_REPORT.md` and root `BUILD_REPORT.md`
- `docs/IMPLEMENTATION_STATUS.md`
- `docs/SETUP.md`
- `docs/SECURITY.md`
- `docs/OPERATIONS.md`
- `docs/VISUAL_ART_DIRECTION_REPORT.md`
- `supabase/config.toml`, all 19 migration files, seed SQL, Edge Functions, `.env.example`, `.gitignore`, package scripts, and all tests.

Not every listed prompt file is guaranteed to exist in the root. Search for them and record missing files; do not block the work merely because an optional old prompt is absent. Treat the current source code, migrations, build report, implementation status, and security documentation as evidence of the actual implementation.

## Non-negotiable safety rules

1. Do not use Docker or Podman as a prerequisite for the cloud path.
2. Do not run `supabase db reset` against a linked remote project.
3. Do not guess a project reference, account, region, credential, API key, or service configuration.
4. Do not print, commit, upload, or put secrets into reports, source files, screenshots, shell transcripts, prompts, or browser bundles.
5. Never place a Supabase service-role/secret key, Supabase access token, processor token, hCaptcha secret, or SMS-provider credential in a `VITE_` variable.
6. Do not change a real or existing production project. Use a **new, isolated development/staging Supabase project** only.
7. Before a remote schema operation, identify the exact project name/ref and check migration status. If the project is not clearly an isolated development project, stop before mutating it and explain why.
8. Run a CLI-supported dry-run or equivalent migration review if available. If it is unavailable, inspect the full migration plan and document that limitation. Do not assume `db push` is harmless.
9. Do not enable insecure RLS policies, public private buckets, wildcard origins, fake OTPs, demo fallbacks in connected mode, or client-assigned roles to get tests passing.
10. Do not claim real OTP, database, Storage, source-proxy, or deletion tests passed unless they actually ran against the cloud services.
11. Do not publicly publish or deploy the frontend to a public URL without the user's explicit authorization. Deploying Edge Functions to the **explicitly designated staging project** may proceed only after its identity and the intended mutation are clearly confirmed.
12. If the user must perform an account-dashboard action or enter a credential, complete every independent task first, then stop with one concise, exact next-action instruction. Never ask the user to paste secrets into ChatGPT or a report.
13. Preserve user changes. Check Git status if a repository exists; do not reset, clean, delete files, or commit/push unless asked.

## Phase 0 — Audit the current state

- Confirm the working directory and inspect the project tree.
- Inspect current UI screenshot evidence, recent visual-refinement report, and the current test scripts.
- Verify existing checks still pass before external configuration: lint, strict TypeScript, unit tests, local PostgreSQL/PGlite checks, Edge type/test checks, browser tests, config/bundle checks, and production build, as available.
- Verify `.env.local`, local secrets, generated reports, and credential files are excluded from Git. If Git has not been initialized, do not initialize it without asking; instead preserve a clear local backup strategy without copying secrets.
- Update `docs/CLOUD_ACCEPTANCE_CHECKLIST.md` with ordered tasks, dependencies, exact acceptance criteria, and a status of `NOT STARTED`, `IN PROGRESS`, `PASS`, `BLOCKED`, or `FAIL` for every task.
- Record the actual baseline in `docs/CLOUD_ACCEPTANCE_REPORT.md`.

Then continue through every task that does not require a missing account credential or external human action.

## Phase 1 — Prepare the hosted Supabase workflow (no Docker)

Inspect the current Supabase CLI version and project configuration. Read CLI help before relying on any option. Official docs:

- Database migrations: https://supabase.com/docs/guides/deployment/database-migrations
- Edge Function deployment: https://supabase.com/docs/guides/functions/deploy
- Edge Function secrets: https://supabase.com/docs/guides/functions/secrets
- Phone authentication: https://supabase.com/docs/guides/auth/phone-login
- CAPTCHA protection: https://supabase.com/docs/guides/auth/auth-captcha
- Auth rate limits: https://supabase.com/docs/guides/auth/rate-limits
- Private Storage: https://supabase.com/docs/guides/storage/buckets/fundamentals
- Production checklist: https://supabase.com/docs/guides/deployment/going-into-prod

Confirm that all expected migration files exist and are ordered. Inspect all 19 migrations for destructive operations, unsafe grants, accidental public access, remote-environment assumptions, and idempotency issues. Do not rewrite migrations just to make deployment easier; if a real defect exists, make a new forward migration where appropriate and update tests.

Check that package scripts and `.env.example` describe a cloud-first setup without requiring a local stack. Keep the developer's current demo mode isolated; connected mode must display an honest configuration or connection error rather than silently substituting sample data.

## Phase 2 — Ask for only the required external action

If no staging Supabase project is available, finish all independent preflight work and then request the user to:

1. Open https://database.new or https://supabase.com/dashboard.
2. Create a **new development-only project** named `biocircuit-staging` (or a unique equivalent), select an acceptable region, and keep it separate from any existing production data.
3. Wait for project provisioning to finish.
4. Provide only the non-secret project reference/ID to the local Codex session when requested. Do not ask for a database password, service-role key, access token, SMS credential, or hCaptcha secret in the chat transcript.

Use the Supabase CLI's interactive authentication locally (`supabase login`) so the user can authenticate through the official flow. Never ask them to copy their personal access token into ChatGPT. If authentication fails, return the exact sanitized command and error needed for troubleshooting.

Do not create a second frontend project. Link the existing repository to the new staging project only after confirming the project ref and intended target.

## Phase 3 — Review and apply migrations safely

After the user confirms the new isolated staging project and CLI authentication is available:

- Link the current repository to that project using the installed CLI's documented syntax.
- Run `supabase migration list` and inspect remote/local migration state.
- Use a documented dry-run if supported by the installed CLI; otherwise fully explain the intended migrations before pushing.
- Apply the existing migration chain with the migration workflow, not manual ad hoc SQL. Use only the designated staging project.
- Do not include seed data unless the seed file has been inspected and only creates safe taxonomy or other clearly intended non-sensitive records.
- Never seed fabricated verified people, reviewer/admin roles, credentials, OTPs, patient records, or real-looking scholarly records.
- Verify the schema and policies in the hosted project after migration application.
- Run SQL/integrity/RLS tests against the actual hosted database where a supported workflow permits. Make clear which tests target a real PostgreSQL endpoint and which continue to use local PGlite stubs.

If a migration fails, stop additional remote mutations, capture the sanitized error, diagnose the cause, create a forward-safe repair if warranted, rerun local checks, and then resume only when the target state is understood. Do not use `migration repair` or alter migration history as a shortcut without examining the actual remote state.

## Phase 4 — Configure connected frontend safely

Use the actual staging project's URL and **publishable/anon client key only**. Store them in the ignored local environment file, normally `.env.local`, using the variable names this existing project expects:

- `VITE_APP_MODE=connected`
- `VITE_SUPABASE_URL=...`
- `VITE_SUPABASE_PUBLISHABLE_KEY=...`
- `VITE_HCAPTCHA_SITE_KEY=...` (only after the site key exists and the CAPTCHA integration is correctly configured)

Verify the exact names against `.env.example`, `src/env.d.ts`, and the config guard; do not introduce new public variables without a reason. Verify that `.env.local` is ignored. Never insert service keys or server credentials in the client environment.

Restart the Vite development server after environment changes. Test that missing or invalid configuration causes a clear setup/error state and never silently activates the synthetic demo adapter.

Initially keep the staging frontend local. Do not make the website public as part of this task.

## Phase 5 — Deploy and verify Edge Functions without Docker

The current source contains these functions:

- `scholarly-search`
- `account-delete`
- `avatar`
- `project-images`

Read each function and its shared modules. Confirm user JWT verification, explicit `getUser` validation, exact-origin CORS, bounded request bodies, generic external errors, proper user-scoped clients, and server-only privileged operations. Inspect `supabase/config.toml` to make sure function JWT settings agree with the code and actual security contract. Do not disable JWT verification merely to make a request succeed.

Once the staging project has been confirmed and remote deployment is authorized, deploy each function using the current CLI's API-based deployment path, such as `functions deploy <name> --use-api` if confirmed by CLI help. This path is intended to avoid the local Docker requirement. Do not guess options from memory; verify local CLI help/current official docs first.

Configure server-side secrets only through the Supabase Dashboard or the CLI's secure local secret workflow. The required variables and exact meanings are documented in `docs/SETUP.md`. Read that file and current function code before setting any secret. Do not write actual values to the report.

Functions that require unavailable processor hosting or contact configuration must return honest, bounded failures. Do not claim their successful user journey just because deployment succeeds.

## Phase 6 — Auth, SMS, and CAPTCHA

Use the actual managed Supabase Auth configuration. Read the current source to determine exactly how its OTP and CAPTCHA flow is wired.

Phone authentication requires a supported SMS provider; do not assume the SMS transport is free. Costs, sender approval, country support, and local rules vary. For India, explicitly flag applicable provider and regulatory requirements before testing real SMS. Do not use a fixed OTP, bypass phone confirmation, or emulate a successful verification state.

Configure CAPTCHA only after the user creates an hCaptcha or supported provider site and obtains both the site key and secret. The site key can be a frontend variable; the secret stays in the managed Auth settings/secret store. Match allowed domains and exact origins.

The user must enter SMS provider credentials through the provider/Supabase dashboard. Do not ask the user to paste those secrets into the chat. Do not spend money or upgrade a plan without explicit approval.

After configuration, test with dedicated test accounts and actual delivered OTPs:

- valid code, wrong code, expired code, reused code, resend cooldown, excessive attempts, CAPTCHA missing/invalid, duplicate registration, phone change/reverification, and global sign-out;
- rate limits and anti-enumeration behavior;
- application status remains distinct from phone verification;
- a phone-confirmed but academically pending user does not gain approved membership privileges.

If no SMS provider is configured, mark the real-OTP gate `BLOCKED` and continue the other independent tests.

## Phase 7 — Real authorized-access and community tests

Use separate staging test accounts. Never use real marks, uploaded academic evidence, clinical data, patient information, private intellectual property, or real user credentials in test fixtures.

Verify real connected operations and unauthorized denial for:

- anonymous visitor, phone-confirmed pending applicant, approved member, another member, reviewer, moderator, administrator, and suspended account;
- private profiles/application data/notifications/bookmarks/exports;
- creating, editing, deleting and reporting posts; replies, helpful responses, accepted answers, follows, saves, blocks and mutes;
- private projects, member requests, role permissions, removal, ownership transfer, archive, and delete;
- contribution ledger duplicate/self/day/pair limits and invalidation behavior;
- pagination, search, no-results, provider error states, and notification preferences;
- account export, global sign-out, and deletion flows.

Run negative tests with two different authenticated users, not just a mocked UID. Check the actual HTTP responses/RPC behavior and database state. RLS must remain the security boundary.

## Phase 8 — Scholarly discovery and Storage

### Scholarly sources

Configure `scholarly-search` with the documented, non-secret contact/config values required by Crossref and NCBI/PubMed. Use a staging environment, real provider responses, timeouts, caching, pagination, source attribution and bounded budgets. Test successful search, empty search, invalid parameters, rate-limited upstream, timeout, malformed upstream response, and unauthorized calls. Never fabricate papers or imply that metadata provides free full text.

### Private storage and image processor

The existing implementation requires a separate first-party Node/Sharp processor. Do not pretend it runs inside the Supabase Edge runtime. Review `docs/SETUP.md` and the processor routes and security contract. Choose a host only after verifying current availability, free-tier limits, supported Node/Sharp binaries, sleep/latency characteristics, HTTPS, ingress limits, and secret support.

Do not deploy or expose an unauthenticated image processor. Its shared token must remain server-only, be strong and rotatable, and the processor must not accept arbitrary URLs or become an open proxy.

Until the processor is hosted and tested, keep avatar/project image upload states clearly unavailable. Do not enable unsupported credential-document/PDF upload: document ingestion/scanning is not implemented. Keep academic evidence storage disabled until a proper scanner/reviewer-access workflow exists.

Test real file type spoofing, malformed files, oversized inputs, private membership, signed-link expiry, removed-member access, metadata writes, replacement/removal, tombstone cleanup, and safe failure handling. Verify that a previously issued signed URL only lasts the intended short lifetime and record this limitation.

## Phase 9 — Browser, privacy, operational, and release checks

Retest in a real browser against the connected staging backend without changing the accepted social-first visual design. Check direct route loads and history, desktop/tablet/mobile layout, console/network errors, authentication and denied states, keyboard navigation, reduced motion, focus visibility, zoom/reflow, and screen-reader semantics as far as available tooling permits.

Run the project's actual lint, typecheck, unit, Edge, browser, database, bundle/config, dependency audit, and build scripts. Record the exact count and result, not just “all passed.”

Review current Supabase Security Advisor and Performance Advisor in the Dashboard. Check RLS on all exposed app tables, privileges, bucket privacy, exact CORS origins, Auth settings, indexes and error logs. Never expose secrets in screenshots or reports.

Document that a free Supabase project can have usage quotas and may pause after inactivity; do not promise unlimited free hosting or free SMS. See current Supabase plan docs before making any cost claims.

Do not deploy the frontend publicly during this task. Do not schedule destructive cleanup/retention jobs until their exact scope, retry logic and test results have been reviewed. A staging-only no-data schedule may be prepared, but do not create paid resources.

## Phase 10 — Final acceptance and reports

Create/update:

- `docs/CLOUD_ACCEPTANCE_CHECKLIST.md`
- `docs/CLOUD_ACCEPTANCE_REPORT.md`
- `docs/RELEASE_READINESS.md`

For every requirement use one of: `PASS — LIVE VERIFIED`, `PASS — LOCAL ONLY`, `BLOCKED — USER CONFIGURATION`, `FAIL — REPAIR REQUIRED`, or `NOT APPLICABLE`. Include actual evidence, exact command/test, scope, and any limitation.

The release report must explicitly state whether these were actually verified live: migrations, RLS, Auth/OTP, CAPTCHA, Edge Functions, scholarly proxy, Storage, processor, account export/deletion, cleanup, and browser journeys. Clearly separate hosted-staging verification from PGlite/test doubles and demo-mode tests.

Do not call BioCircuit production-ready until every production release gate is passed or consciously scoped out and documented. No public frontend deployment should occur in this task.

## Execution directive

Start with the audit, then execute all local and non-destructive cloud-preparation work now. If an external account, project reference, credential, approval, or human dashboard setting is required, finish every independent task first and tell me precisely what to do next. Resume automatically as soon as that blocker is resolved; do not repeatedly re-plan completed work. Never fabricate configuration or successful live tests.
