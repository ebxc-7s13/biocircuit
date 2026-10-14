> Recovery update2026-10-13: [PASSWORD_RECOVERY_ACCEPTANCE.md](PASSWORD_RECOVERY_ACCEPTANCE.md) supersedes older sender/template instructions. Exact hosted redirect/minimum12 verified; local template not installed (new free/default-sender restriction); delivered reset remains blocked.76 unit/47 demo/four connected recovery viewports pass; no fake verification or paid resource.

> 2026-10-13 update: controlled B is now usable through ordinary managed Auth. Final focused two-user hosted run152 pass/0 fail/2 external blocks; a genuine late-response frontend privacy defect was fixed and the exact live race passed10 checks. Backend/schema/Edge/authorization/package files unchanged;58 unit/122 localSQL/3Edge/47 demo regression tests pass. See [CLOUD_ACCEPTANCE_REPORT.md](CLOUD_ACCEPTANCE_REPORT.md) and [RELEASE_READINESS.md](RELEASE_READINESS.md) for current scope. Earlier B-unavailable rows are history. Do not repeat signup; use `node scripts/test-staging-persistence.mjs --cross-user-only`. Production readiness and genuine protected/member/integration/recovery gates remain open.

> Current zero-cost staging setup: [FREE_RELEASE_PLAN.md](FREE_RELEASE_PLAN.md) documents the second DPAPI account, code-email recovery template/free SMTP, preserved phone/member gates and measured image limitations. The three cloud reports supersede historical local-container/credential blockers below; Docker is not required for the executed cloud tests.

# Reproducible setup

## Existing-account session acceptance - 2026-10-12

The dedicated staging account has already registered successfully. Use `node scripts/test-email-staging.mjs --resume-existing-account` with the existing DPAPI credential file. Do not repeat default new-account registration for this identity or recreate credentials unnecessarily. Resume mode signs in through normal UI, checks the five remaining routes, actual managed-user identity/session/API readiness, direct refresh, logout and relogin; it makes no signup, fixture write or verification/role changes. Results are timestamped, and original email-auth-live.json is preserved. The default wait now uses bounded content/core-API checks; --diagnose-networkidle is only for deliberate reproduction of the verified old /profile timeout. Final live result:20 passed / 0 failed, signup0, console0/uncaught0. Wider phone/academic/role/integration gates remain open; see current CLOUD_ACCEPTANCE_REPORT.md.


## Free staging email/password authentication - 2026-10-12

Actual hosted settings for ibxubsegrabpspopdgep returned HTTP200: Email enabled, email autoconfirm true (confirmation disabled), signup enabled, phone disabled and phone autoconfirm false. Local frontend still uses connected mode, the exact existing project URL and its existing public key. No hosted setting/migration/function change was needed for this extension.

Open the account control, choose Create an account or Sign in with email. Registration requires a valid email and a unique password of 12+ characters (up to 128). Login accepts an existing password without imposing a new registration minimum. Passwords are never trimmed, logged or saved by application code; the managed SDK retains/refreshes sessions using its existing browser storage. Email sign-in does not verify a phone or grant academic eligibility. CAPTCHA is enforced by the managed provider; when a real public site key is configured the form requires its challenge. Missing server-required CAPTCHA is an honest error, not bypassed.

To supply the controlled email and unique password for the authorized real UI/API acceptance runner, use your own trusted PowerShell terminal in this project root:

~~~powershell
.\scripts\set-staging-email-credentials.ps1
node scripts/test-email-staging.mjs
~~~

The credential prompt keeps the password out of command arguments/chat. It stores an ignored .cloud/email-staging-credentials.xml: Windows DPAPI encrypts the password for this Windows user; the email remains private personal information. Do not upload/share that file. The runner reads it only into process memory, registers through the actual connected UI, checks real session/logout/refresh/sign-in, and exercises existing permitted/denied APIs without printing credentials, tokens, identity values or private exports. No privileged key, phone confirmation, academic approval, staff role or deletion is involved. It writes a clearly labeled nonclinical private test profile and own preferences, so its successful run has real permitted persistence. It is an acceptance runner for a NEW dedicated staging account: do not rerun registration with a valuable preexisting account; duplicate registration is tested deliberately at the end. No account is deleted automatically.

Without the file, it verifies hosted settings, exits2 and marks real-account tests BLOCKED. Exit1 is an executed failure; exit0 means this runner's actual assertions passed, not production release readiness. A separate controlled second account with populated private fixtures is still required for conclusive two-user isolation; filtered empty other-user queries alone are limited evidence. Keep valid OTPs, passwords and tokens out of screenshots/transcripts. After testing, remove only the exact ignored credential file from your trusted local terminal when no longer needed.

The standalone node scripts/test-email-auth-ui.mjs checks actual connected anonymous form rendering, client invalid-email/short-password validation, password visibility and mode navigation at 1440x900,1024x768,390x844,320x700. It sends no valid Auth request, creates no account and does not establish real sign-in/session behavior.

Current policy boundaries: own profile/preferences/notification reads and current-user export are expected to be available to a genuine signed-in account, subject to rate limits/suspension. Academic submission requires confirmed phone. Posting/replies/reactions/bookmarks/project creation need approved membership. Staff and service-only RPCs remain separately restricted. These are source-reviewed expectations until executed with a real account. No Twilio upgrade or paid service is required to exercise email Auth; SMS-dependent flows remain unavailable without genuine provider configuration.


## Recommended: isolated hosted staging, without Docker

Start with [CLOUD_SETUP.md](CLOUD_SETUP.md). It verifies the staging identity, CLI account, migration ledger and dry-run before any hosted mutation, and uses `functions deploy --use-api`. The frontend stays on loopback. No cloud acceptance gate is closed by a local PGlite or synthetic browser test; see [RELEASE_READINESS.md](RELEASE_READINESS.md).

The checked-in `supabase/config.toml` specifies local defaults. Do not assume that linking or pushing migrations applies its Auth/SMS/CAPTCHA settings to hosted Auth. Review the actual dashboard configuration separately.

## Local toolchain and modes

Use Node >=22.12, npm and the committed lockfile. npm ci installs exact versions, including Supabase CLI 2.120.0, browser test tools and the Node-only Sharp processor. Use npm.cmd on restricted PowerShell systems. Deno 2 is needed for Edge checks. Run npm exec playwright -- install chromium once for browser tests.

Copy .env.example to .env.local. Only these names may be public/build-time configuration:

| Variable | Purpose / where to obtain it |
| --- | --- |
| VITE_APP_MODE | demo for isolated synthetic evaluation; connected for real backend |
| VITE_SUPABASE_URL | HTTPS project URL from Supabase project API settings |
| VITE_SUPABASE_PUBLISHABLE_KEY | Public publishable key (or legacy anon key); never secret/service-role |
| VITE_HCAPTCHA_SITE_KEY | Public site key from your configured hCaptcha application |

The build guard rejects unknown VITE_ variables and privileged keys without printing values. Production without public configuration renders a setup-required state and does not simulate persistence. Keep local secret files out of version control. There are no actual credential values in the example.

## Optional native local Supabase

Docker Desktop or Podman must be installed and running. These commands target the local development stack defined by supabase/config.toml; do not point destructive reset commands at a live environment.

~~~sh
npm ci
npm exec supabase -- start
npm exec supabase -- db reset
npm exec supabase -- test db
~~~

All ordered migrations create the schema, policies, functions, private buckets and integrity controls. The seed contains taxonomy only. No seed grants a privileged role, verifies a real person, or inserts public demo papers. PGlite fixtures are isolated in-memory PostgreSQL data and never initialize production.

The current workstation cannot run this stack: Supabase status reports docker: command not found (podman also not found). npm run test:db runs the executable authorization suite independently; Auth/Storage APIs remain stubs there.

## A configured development project

Use the already-confirmed isolated Supabase staging project `ibxubsegrabpspopdgep`; do not create another project for this acceptance run. Existing project config is already checked in; do not initialize a second frontend. Follow the complete identity, ledger and dry-run gates in [CLOUD_SETUP.md](CLOUD_SETUP.md); the abbreviated commands below are not an authorization to target an arbitrary project. From a trusted administrator machine:

~~~sh
npm exec supabase -- login
npm exec supabase -- link --project-ref YOUR_DEVELOPMENT_PROJECT_REF
npm exec supabase -- migration list --linked
npm exec supabase -- db push --linked --dry-run --skip-vault
npm exec supabase -- db push --linked --skip-vault
~~~

Review migrations before applying them. Populate taxonomy using supabase/seed.sql through a trusted SQL session, or use the CLI seed option after verifying its scope. On 2026-10-12, CLI identity/link, the supported no-seed dry-run, all 19 migrations and four API-based JWT-verified deployments were executed only on confirmed staging. Native catalog/TAP and anonymous permission/browser checks passed. No seed was applied; authenticated provider/accounts/processor and recovery gates remain open. See CLOUD_ACCEPTANCE_REPORT.md for exact evidence. Do not replay migrations outside their ledger or reset the remote database.

Configure managed Auth:
1. Enable phone signup/confirmation and a supported SMS provider in the Supabase dashboard. Obtain its account credentials and any sender/template approval required in the operating region. Add provider credentials only to managed Auth/server settings.
2. Keep six-digit codes, 300-second expiry and a 60-second resend minimum. Verify dashboard equivalents of the local config: SMS sends 10/hour per IP, token verifications 30/hour and sign-in/signup limits 20/hour. Review these limits for shared university networks and current provider quotas.
3. Enable hCaptcha in Auth and register local/staging/production hostnames with hCaptcha. Store the CAPTCHA secret in managed Auth and only the site key in the frontend.
4. For local cloud acceptance, set the exact designated loopback site URL and redirects; keep the frontend unpublished. A later authorized production deployment requires HTTPS. Avoid wildcard redirects.
5. Confirm phone change behavior and global sign-out on the configured provider. UI attempts are capped at five per requested code, but the managed provider expiry/verification/rate rules are the security boundary.
6. Use dedicated test numbers and actual delivered codes for release verification. No fixed OTP is implemented. Document SMS delivery failures and regional requirements rather than claiming number control.

See official [phone authentication](https://supabase.com/docs/guides/auth/phone-login) and [CAPTCHA setup](https://supabase.com/docs/guides/auth/auth-captcha). Provider charges and requirements vary; no paid resources were created.

## Reviewer and administrator bootstrap

First create a real Auth account through the phone flow and submit its own academic application. A trusted database administrator can assign scoped roles using a known actual Auth UUID:

~~~sql
insert into public.roles(user_id,role)
values ('REPLACE_WITH_ACTUAL_AUTH_USER_UUID'::uuid,'reviewer');
~~~

Assign admin/moderator separately where needed; do not grant every role by default. Clients cannot INSERT roles or mutate membership flags. To approve the initial operator, another authorized reviewer should review the application; a trusted administrator may bootstrap a documented eligibility decision if necessary. Do not set phone_verified manually: it mirrors actual Auth confirmation.

In /trust, reviewers approve/reject/request clarification/expire applications and record a reason. Applicants can resubmit needs-evidence details or appeal rejected/expired decisions. Evidence files are not accepted while their validation flow is disabled. Moderators handle content reports and appeals; administrators manage restrictions, taxonomy, bounded future point rules and aggregates. Suspended staff lose role-derived reads.

## Edge Functions

Deploy only to an authorized development project:

~~~sh
npm exec supabase -- functions deploy scholarly-search --use-api
npm exec supabase -- functions deploy account-delete --use-api
npm exec supabase -- functions deploy avatar --use-api
npm exec supabase -- functions deploy project-images --use-api
~~~

All four retain verify_jwt=true and also call managed Auth getUser. They construct separate user-scoped and server-only privileged clients. This follows current [Edge authentication guidance](https://supabase.com/docs/guides/functions/auth-headers).

Configure server secrets through the dashboard or a local, Git-ignored secrets file. Do not put values on shared terminals, in reports or into VITE_ variables.

| Server-only name | Purpose |
| --- | --- |
| SUPABASE_URL | Supplied by Edge runtime; project endpoint |
| SUPABASE_ANON_KEY | Supplied by runtime; user-scoped client |
| SUPABASE_SERVICE_ROLE_KEY | Supplied by runtime; privileged operations only |
| ALLOWED_ORIGIN | Exact frontend origin, with scheme and port if local, no trailing slash |
| CROSSREF_MAILTO | Service contact for identified Crossref API requests |
| NCBI_EMAIL | Service contact for NCBI E-utilities identification |
| NCBI_API_KEY | Optional NCBI key; conservative shared two-requests/second budget still applies |
| AVATAR_PROCESSOR_URL | HTTPS first-party /avatar endpoint |
| PROJECT_IMAGE_PROCESSOR_URL | HTTPS first-party /project-image endpoint |
| AVATAR_PROCESSOR_TOKEN | Strong server-only shared token, at least 32 characters |

Use separate projects/functions for preview and production; each function configuration permits one exact origin. Missing contacts/processor configuration produces explicit errors. These are actual integration boundaries, not simulated results.

## First-party avatar processing

The frontend sends a PNG/JPEG under 5 MB to the authenticated avatar Edge Function. That function validates ownership/restriction/budget and sends bytes to your configured first-party processor. The included processor decodes real pixels using Sharp, rejects malformed/animated/oversized inputs, limits decoding to ten million pixels, resizes to at most 256x256, strips metadata and emits WebP. Only the processed object is stored in the private avatars bucket, under a randomized user path.

~~~sh
# Set PROCESSOR_TOKEN through the service's secret store, never in frontend configuration.
npm ci
npm run avatar:processor
~~~

The processor binds 127.0.0.1:8787 by default. PROCESSOR_PORT may change that port. Place it behind your own HTTPS proxy, enforce a 5 MB body limit, require the shared token, restrict network access, and monitor memory/concurrency. It processes at most two concurrent requests with a three-second image processing timeout. The Edge URL must be HTTPS and redirects are rejected. Native Sharp binaries must match the server platform; install dependencies on that server with npm ci, including development dependencies for this repository-hosted processor.

No processor hosting has been created. Avatar SDK/Storage round trips require deployed functions, server configuration and real access tests. Other members' images are not globally public. Signed access lasts 60 seconds; Refresh image link obtains a new authorization check.

## Private project images and cleanup

The same processor exposes /project-image. Set PROJECT_IMAGE_PROCESSOR_URL to its first-party HTTPS endpoint and the same strong server-only AVATAR_PROCESSOR_TOKEN. It decodes PNG/JPEG, strips metadata, preserves aspect ratio, limits the longest side to 2048 pixels, and emits PNG under 5 MB. This changes pixels: retain scientific originals separately and never use a preview to infer measurements. The authenticated project-images function enforces active approved project membership, a three-upload/minute budget, bounded pages and 60-second signed reads. SQL rechecks current membership at metadata commit time. Uploaders and project owners can explicitly remove images. PDF/evidence uploads remain unavailable.

Metadata deletion/replacement queues private Storage tombstones. Deploy a trusted scheduled worker using scripts/cleanup-storage.mjs with server-only SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY; run npm run storage:cleanup. It removes at most 100 queued objects per invocation and acknowledges only successful removals. Browser roles cannot access its queue or RPCs. Configure retry/monitoring and a cadence appropriate to load. No worker or schedule has been deployed or executed against a real service. Failed new-object insertion plus failed compensating removal can still create an unrecorded orphan; add periodic inventory reconciliation before launch.

## Release verification after configuration

Use separate real test accounts for anonymous, pending, approved, suspended, reviewer, moderator and administrator cases. Verify OTP delivery/expiry/resends, application review/appeal, cross-account private reads, direct RPC denial, posting/replies/saves/accepted answers, concurrent retries, public/private project membership and ownership transfer, notifications/preferences, Crossref/PubMed pagination/cache/provenance, processed avatar and project-image rejection/download/removal/member revocation/cleanup, global sign-out, export and account deletion.

Run native pgTAP and SDK/browser integration tests against that development service; never use production credential documents for test fixtures. The local browser suite intentionally exercises the labelled synthetic adapter. A release needs both local passes and these real service results.

## Troubleshooting

- npm.ps1 execution policy: run npm.cmd; no system execution policy change is needed.
- Setup-required banner: check mode, HTTPS URL, public key and restart Vite after changing environment.
- Generic mutation denial: check applied migrations, actual membership/suspension, object permissions and limits. Do not weaken RLS.
- OTP unavailable: check Auth phone provider, CAPTCHA domain/key pair, approved SMS sender/template and provider delivery logs. Do not log phone/code values.
- Crossref/PubMed unavailable: check Edge deployment, exact CORS origin, service contacts, outbound API status and provider budget. Use canonical links; do not substitute fabricated articles.
- Avatar/project images unavailable: configure the first-party processor/token/TLS and matching native Sharp dependencies. SVG, PDF, renamed/spoofed and malformed images are refused.
- Native database unavailable: install/start Docker Desktop or Podman; the CLI status error identifies the missing container runtime.
- Deletion refused: transfer owned projects, then retry. Nested or exceptionally large storage needs cleanup before identity deletion; the function fails before silently leaving files behind.
