# Isolated cloud acceptance: no Docker, no public frontend

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


This workflow is prepared for the existing repository. As of 2026-10-12, exact-target CLI verification/linking, all 19 migrations, four API-bundled JWT-verified deployments, native catalog/TAP and anonymous connected acceptance have run. Authenticated acceptance remains blocked by real provider/CAPTCHA/accounts/processor configuration; see the current report. Follow [CLOUD_ACCEPTANCE_CHECKLIST.md](CLOUD_ACCEPTANCE_CHECKLIST.md) in order. `cloud:plan` prints a plan; it does not deploy. Guard validation does not prove a project's ownership or isolation: the actual CLI inventory and user designation must agree before mutations.

## 1. Confirmed staging target — do not create another project

The user designated **`ibxubsegrabpspopdgep`**, [Dashboard](https://supabase.com/dashboard/project/ibxubsegrabpspopdgep), through the full staging execution directive. Authenticated Dashboard settings verified actual name `biocircuit-staging`, exact project ID and the canonical Data API endpoint. CLI authorized inventory, link, native empty pre-migration inventory, the supported 19-file dry-run, push and matching hosted ledger are now verified. Login and migration/deployment are no longer blockers. Keep database passwords, personal access tokens, API secret keys, SMS credentials and CAPTCHA secrets out of chat. Do not recreate the project or ask for its reference again.

The agent recorded the non-secret request in ignored `.cloud/requested-target.json`, marked identity verified after reading actual Dashboard settings, and created `.cloud/staging.json` with those actual values. This does not replace the mandatory CLI inventory/ledger/dry-run checks before mutation. Its fields are `projectName`, `projectRef`, `isolatedDevelopment: true`, verified `url`, and `frontendOrigin: http://127.0.0.1:5190`. No credential belongs in either file. The guard rejects an unverified requested identity, another requested reference, or a conflicting linked reference. If the actual name differs, obtain explicit confirmation of that name before mutation.

## 2. Verify local authentication and inspect the target

Authentication is already complete on this workstation. Do not log in again unless the authenticated inventory actually fails. For a fresh operator workstation, use the following official local flow from the existing root in PowerShell:

```powershell
npm.cmd exec -- supabase --version
npm.cmd exec -- supabase login --help
npm.cmd exec -- supabase login
```

Use the official interactive browser/local terminal flow. Do not use `--token <secret>`, put a token in shell history or paste it into chat. If a password is requested for linking, enter it only in the secure local prompt. CLI caches and `.cloud/` are ignored. Do not include login/link output in a report if it contains credentials or personal information. Read-only `projects list` should be captured locally and reduced to the designated target's non-secret name/ref/status. Never print the whole account inventory.

The installed CLI is 2.120.0. Its help was inspected for login, projects list, link, migration list, db push, functions deploy, secrets set, db query and db advisors. Recheck help when the lockfile version changes. Source guidance: [migrations](https://supabase.com/docs/guides/deployment/database-migrations), [API deployment](https://supabase.com/docs/guides/functions/deploy), [secret management](https://supabase.com/docs/guides/functions/secrets). No container engine is required for the commands below. The optional local stack in SETUP.md is a separate workflow.

## 3. Review the ledger and dry-run before applying anything

Once the target and account match, the agent runs `npm.cmd run cloud:preflight` and `npm.cmd run cloud:plan`. The former makes an allowlisted local source recovery copy and hashes the migration chain; it does not back up a hosted database. The latter rejects an undesignated target or a conflicting linked reference. Review the exact target again before each remote command.

```powershell
npm.cmd exec -- supabase link --project-ref YOUR_CONFIRMED_STAGING_REF
npm.cmd exec -- supabase migration list --project-ref YOUR_CONFIRMED_STAGING_REF
npm.cmd exec -- supabase db query --linked --project-ref YOUR_CONFIRMED_STAGING_REF --file supabase/tests/cloud-before-migrate.sql
npm.cmd exec -- supabase db push --project-ref YOUR_CONFIRMED_STAGING_REF --dry-run --skip-vault
```

The reference placeholder means exactly `ibxubsegrabpspopdgep` in this execution. All 19 migrations were applied and their local/remote versions match on this confirmed staging project. These commands describe the guarded workflow; do not replay SQL or reset an applied database. All 19 migrations are expected only on a fresh project. Review actual local/remote ledger columns, pre-migration inventory and pending sequence before push. **No seed is included by default**, as required by the current staging directive. The seed was inspected and contains 11 taxonomy labels only; any later taxonomy initialization is a separate reviewed step. The chain has intentional obsolete function/index replacements; it is not designed to rerun outside its migration ledger. Bucket `ON CONFLICT` clauses do not repair unsafe existing bucket settings, so inspect actual flags after migration.

```powershell
npm.cmd exec -- supabase db push --project-ref YOUR_CONFIRMED_STAGING_REF --skip-vault
npm.cmd exec -- supabase migration list --project-ref YOUR_CONFIRMED_STAGING_REF
npm.cmd exec -- supabase db query --linked --project-ref YOUR_CONFIRMED_STAGING_REF --file supabase/tests/cloud-catalog-api.sql
npm.cmd exec -- supabase db advisors --linked --project-ref YOUR_CONFIRMED_STAGING_REF --type all --fail-on error
```

`db query` and `db advisors` are confirmed by this installed CLI's help; the published CLI reference may lag its version. The single-result catalog adapter returns schema/privilege metadata only; the Management API otherwise exposes only the final nonempty result of separate SELECT statements. Native verification returned all 29 RLS tables and expected controls. The unchanged five TAP assertions now use one UNION ALL result and all returned ok on the hosted service. Expected: 29 RLS-enabled application tables, no client table write grants, fixed empty search paths for definer functions, three private buckets with correct type/size restrictions, both enabled Auth triggers, and denied anonymous/ordinary-client privileged RPC access. Review Storage policies separately; no direct INSERT/ALL policy may allow unvalidated client uploads. Also confirm hosted API schema exposure excludes `private`.

For native SQL policy checks, the same API-based command can submit `supabase/tests/rls.test.sql` **only to designated staging**. It creates pgTAP within a rolled-back transaction and runs five structural assertions. Check that all returned TAP assertions are `ok`, not merely that the CLI exited zero. If the extension/transaction/query API is unavailable, record the actual sanitized error and use the hosted SQL editor for that file. These structural checks still do not replace two-user JWT tests. Do not run `supabase test db` assuming it is Docker-free; that optional local runner uses the native stack.

If anything fails, stop subsequent remote mutations and inspect the ledger and sanitized error. Do not reset a remote database, repair history as a shortcut, use `--include-all`, or replay partially applied SQL blindly. A genuine schema repair requires a reviewed forward migration and local tests before continuing.

## 4. Deploy four functions using API bundling

All four functions are already ACTIVE, version 1, with verify_jwt=true on confirmed staging. ALLOWED_ORIGIN is configured to the exact loopback origin. The commands below are the supported Docker-free deployment workflow; redeploy only when an actual code/config change requires it:

```powershell
npm.cmd exec -- supabase functions deploy scholarly-search --project-ref YOUR_CONFIRMED_STAGING_REF --use-api
npm.cmd exec -- supabase functions deploy account-delete --project-ref YOUR_CONFIRMED_STAGING_REF --use-api
npm.cmd exec -- supabase functions deploy avatar --project-ref YOUR_CONFIRMED_STAGING_REF --use-api
npm.cmd exec -- supabase functions deploy project-images --project-ref YOUR_CONFIRMED_STAGING_REF --use-api
```

Retain `verify_jwt=true` and each handler's `getUser` validation. Never use `--no-verify-jwt` or `--prune` to simplify acceptance. Current [Auth header guidance](https://supabase.com/docs/guides/functions/auth-headers) supports legacy and asymmetric user JWT validation; do not assume a signing-key change needs a JWT bypass. User Authorization and public `apikey` headers have different purposes. Verify the actual configured project and deployed behavior.

Use the Dashboard secret manager or an ignored local `.cloud/functions.env` with `secrets set --env-file .cloud/functions.env --project-ref YOUR_CONFIRMED_STAGING_REF`. Never put values in CLI arguments, transcripts or reports. Runtime `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are supplied by Supabase; do not copy privileged keys into frontend configuration.

Required server configuration:

| Name | Meaning / acceptance prerequisite |
| --- | --- |
| ALLOWED_ORIGIN | Exactly `http://127.0.0.1:5190`, matching the designated browser origin, no slash or wildcard |
| CROSSREF_MAILTO | Legitimate service contact; configure locally/server-side, omit its value from reports |
| NCBI_EMAIL | Legitimate E-utilities contact; no fabricated contact |
| NCBI_API_KEY | Optional server key; the existing conservative global budget remains |
| AVATAR_PROCESSOR_URL | Authorized first-party HTTPS `/avatar` endpoint |
| PROJECT_IMAGE_PROCESSOR_URL | Same first-party HTTPS service's `/project-image` endpoint |
| AVATAR_PROCESSOR_TOKEN | Strong random shared server-only token of at least 32 characters; rotate with the processor |

Processor-dependent functions must retain honest bounded failure states until that service is configured. Deployment alone does not establish functionality.

## 5. Connect the frontend locally

Ignored `.env.local` now contains actual connected mode, verified URL and the existing publishable key copied without logging it. hCaptcha is not configured; no fake site key was inserted. The variables below are the allowed public configuration contract; the hCaptcha site key is added only after real provider configuration:

```dotenv
VITE_APP_MODE=connected
VITE_SUPABASE_URL=https://YOUR_CONFIRMED_STAGING_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_OR_LEGACY_ANON_KEY
VITE_HCAPTCHA_SITE_KEY=YOUR_PUBLIC_CONFIGURED_SITE_KEY
```

The displayed example values are placeholders; the actual local file is configured without exposing its key here. Obtain the endpoint/public key from the **designated** project's API settings. Do not put a secret/service-role key, processor token, database password or CAPTCHA secret here. The build guard rejects privileged/unknown public variables. Restart Vite after changes:

```powershell
npm.cmd run dev -- --port 5190 --strictPort
```

Keep host binding on loopback. Check setup errors and invalid/missing configuration without falling back to demo. Existing demo screenshots/tests are synthetic. `npm.cmd run test:staging-browser` separately verifies actual anonymous connected initialization, reflow, axe, keyboard/history and honest backend errors; `npm.cmd run test:staging-ingress` observes public gateway responses. The actual public_snapshot404/PGRST202 was caused by the missing app schema and is fixed by the original migrations. A guest-only recommended_page401 was also corrected by requesting recommendations only for an actual session. Final connected browser evidence: 12 routes/four sizes/axe 0 / overflow 0, 34 snapshot200 responses and zero console/uncaught errors. These anonymous checks do not verify authenticated persistence. Do not publish `dist`, create a public preview, use a tunnel or change production infrastructure.

## 6. Configure real Auth, CAPTCHA and eligibility

The local TOML is not proof of hosted settings. In staging Dashboard configure phone signup/confirmation, a supported actual SMS provider and its sender/template approvals. For Indian numbers, check applicable TRAI/DLT requirements with that provider before sending. Provider fees and account configuration require user authorization; no free SMS is promised. See [phone Auth](https://supabase.com/docs/guides/auth/phone-login), [CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha), and [rate limits](https://supabase.com/docs/guides/auth/rate-limits).

Register the loopback hostnames with hCaptcha; put the **secret** in managed Auth and the public site key in `.env.local`. Use the exact staging frontend site URL and redirect allowlist. Do not use wildcard redirects, test OTP mappings or CAPTCHA bypasses as evidence for actual delivery.

Review six-digit codes, 300-second expiry, minimum 60-second resend interval, SMS send limit 10/hour per IP, token verification limit 30/hour and signup/sign-in limit 20/hour. Verify actual Dashboard settings and provider constraints rather than inferring defaults. Shared university networks may need reviewed limits. The UI's five-attempt cap does not replace managed server-side protection.

Use consenting dedicated real test accounts. Enter delivered OTPs directly in the local browser; never record codes, phone numbers or Auth/session panels in screenshots. Record only outcome labels and sanitized status codes for valid/wrong/expired/reused codes, cooldown, missing/invalid CAPTCHA and request limits. Confirm generic errors and that phone verification does not grant academic approval. Test phone change and global sign-out separately.

Operational role accounts must originate in actual managed Auth. Assign scoped reviewer/moderator/admin roles only through a trusted administrator using actual account IDs privately, following SETUP.md. Do not set `phone_verified` manually or fabricate an eligibility decision. An approved member needs an actual documented human review; synthetic academic credentials must not be presented as real qualifications. Pending, rejected, needs-evidence, expired and suspended states remain distinct.

## 7. Run real-user HTTP and community acceptance

Already executed anonymous acceptance: `node scripts/test-staging-anonymous.mjs` returned 39 live passes, including private reads/mutations, invalid JWTs, CORS and valid tiny-image direct Storage denial. `npm.cmd run test:cloud-http` returned 7 live anonymous passes and 8 real-identity/cross-user blockers (exit 2), with no fixture writes. These do not close the authenticated role matrix.

Create two different approved member identities and separate phone-confirmed pending, reviewer, moderator, admin and suspended identities. Preserve role separation. Store temporary access tokens only in ignored `.cloud/sessions.json`, entered/captured locally without output. Its labels are `memberA`, `memberB`, `pending`, `reviewer`, `moderator`, `admin`, `suspended`; each contains an `accessToken`. The harness confirms managed `getUser`, actual profile and authoritative role state. Remove the temporary session file after the run and sign out. No example token is needed.

```powershell
npm.cmd run test:cloud-http
npm.cmd run test:cloud-http -- --sessions=.cloud/sessions.json
npm.cmd run test:cloud-http -- --sessions=.cloud/sessions.json --write-fixtures
```

The first invocation performs anonymous live probes once target/public config exist; it does not create users. Missing identities remain BLOCKED. Exit 2 means blocked/incomplete, exit 1 means an actual failed assertion or live transport failure, exit 0 means all this harness's executed assertions passed. Even exit 0 is **not** full release acceptance: unimplemented live scenarios remain separately listed in its report. Prerequisite gating was tested locally with no cloud request.

The fixture option writes only labeled nonclinical synthetic test posts/project through actual member RPCs. It checks duplicate-request prevention, private post/project visibility, unauthorized editing, real answer/acceptance/ledger/notification persistence and self-reaction denial. It tracks created fixture IDs and removes only this run's created project/soft-deletes its posts through owner RPCs. Soft-deleted rows, replies and invalidated ledger/audit records may remain as evidence; do not clear the whole project or delete accounts implicitly. Cleanup failures must be recorded.

Complete the remaining live matrix in the browser and real-user HTTP calls; the harness is a subset, not a replacement:

| Scope | Positive journey | Negative/privacy checks |
| --- | --- | --- |
| Profiles/eligibility | Each user's own profile; reviewer reasoned decisions/resubmission/appeal | Other ordinary user sees no marks/application; reviewer cannot moderate; moderator cannot read academic queue; suspended staff lose scoped access |
| Community | Post/reply/edit/history, reaction/save/un-save/subscribe, refresh persistence | Author checks, private/blocked records, unknown IDs, duplicate UUID, self-vote, invalid and over-limit inputs |
| Questions/reputation | Acceptance/resolution, explanation and ledger | Author-only acceptance; duplicate/self/daily/pair award limits; invalidation cannot reset abuse budget |
| Projects | Requests/decisions, logs, milestone confirmation, member removal, transfer/archive/delete | Owner/collaborator separation; nonmember/private log denial; removed member loses access; ownership transfer prerequisites; confirmation required |
| Notifications/search | Unread/read persistence/preferences and destination; bounded cursors/search/no results | No other user's notifications/preferences/bookmarks; no repeated/exhausted cursor entities; unavailable backend shows actual errors |
| Trust/admin | Report/moderation/appeal/audit; admin bounded rules/taxonomy/aggregates | Nonstaff role assignment/membership changes denied; reviewer/moderator scope separation; private projects remain private from moderators |
| Account | Current-user export/global sign-out; explicit disposable-user deletion | Export cannot specify another user; owned project blocks deletion until transfer/delete; revoked session reuse tested; no automated deletion of valuable accounts |

Use database state and actual HTTP responses, not only a toast. No real names/IDs/private payloads go into reports. Only dedicated disposable accounts may be deleted, with the exact account and intended test confirmed first.

## 8. Sources and private file acceptance

Verify actual Crossref and PubMed results through the deployed authenticated proxy: identifiers, canonical URLs, attribution/retrieval metadata, stable pages and bounded cache reuse. Metadata is not a full-text license. Test invalid parameters, unauthorized calls, empty results and budget exhaustion. Simulated upstream timeouts/malformed/429 fixtures must be labeled simulated, even when run through an isolated staging build; do not substitute fake papers in production or induce provider abuse to provoke failure. True adverse-provider conditions may be unavailable and remain unverified.

The Node/Sharp processor runs separately from Deno Edge. No host was selected or purchased. Current [Sharp installation guidance](https://sharp.pixelplumbing.com/install/) must be checked for the selected Node/platform binaries. Prefer an already-authorized, always-on first-party Node >=22.12 service behind an HTTPS reverse proxy with secret support, bounded ingress and restricted observability. The current server intentionally binds loopback; preserve that behind a proxy. Configure only its two POST routes, <=5 MiB body limit, no arbitrary URL fetching, no credential logging and a strong shared bearer token. Test the published TLS endpoint before configuring Edge.

[Render free services](https://render.com/docs/free) sleep after inactivity and may take about a minute to restart; that conflicts with the current eight-second Edge processor timeout. Therefore the free sleeping tier is not a reliable choice for this integration. An always-on alternative may cost money: selection/provisioning is a later user decision, not automatic authorization to spend. No unauthenticated temporary processor or public tunnel is acceptable.

Run actual avatar/project PNG/JPEG upload, decode/re-encode, metadata stripping, spoof/malformed/oversize rejection, record/path membership, replacement/removal and failure compensation tests. Keep academic evidence and PDF/document upload disabled: a scanner/validation pipeline is not implemented. Confirm bucket privacy and denied direct client upload; use signed links only. Test no new links after removal and actual old-link expiry after 60 seconds. Already-issued URLs remain valid until expiry; access revocation is not instantaneous. Do not report mock Storage responses as live evidence.

## 9. Connected browser and operational acceptance

Run the local connected UI against staging at desktop 1440x900, tablet 1024x768, mobile 390x844 and narrow 320x700. Test direct routes/history, real refresh persistence, keyboard/focus, reduced motion, zoom/reflow, denied/empty/loading/error states and responsive navigation. Run axe on connected populated states as well as existing demo checks. Do not save authenticated traces, HAR files, session storage, raw console payloads or unmasked Auth/private-record screenshots; keep sanitized error counts/labels. Existing Playwright tests deliberately start **demo** mode and do not become cloud tests by changing `.env.local`.

Postmigration Advisors returned 0 ERROR / 27 WARN (10 authenticated definer entry points and17 Auth RLS initplan findings). Source-reviewed deliberate RPC boundaries remain unchanged; real-role negative tests and representative query plans are required before release risk acceptance. Review staging Security/Performance Advisors, actual indexes, RLS/grants, bucket privacy, exposed schemas, exact CORS, Auth settings, budgets and sanitized function errors. Inspect response headers at the chosen frontend host only after a later authorized deployment; Vite preview does not apply `public/_headers`.

Free Supabase projects have quotas and may pause after inactivity; review the actual [plan/billing](https://supabase.com/docs/guides/platform/billing-on-supabase) and [production checklist](https://supabase.com/docs/guides/deployment/going-into-prod). Do not promise unlimited hosting or free SMS. Native cloud backup/point-in-time recovery depends on plan. Local recovery copies do not contain hosted data or managed Auth. Before any future existing-database changes, verify actual recovery/restore to another explicitly authorized isolated project. `db dump` is not assumed Docker-free; a reviewed native `pg_dump` or Dashboard workflow needs separate setup and secure credential handling.

Review `scripts/cleanup-storage.mjs` and the privileged queue/ack/retention RPCs before scheduling. Default worker scope is bounded queued tombstones, not an arbitrary bucket sweep. Acknowledge only successful removals, preserve failed entries for retry, and verify real object absence. Inventory unrecorded orphans separately after failed compensation; queue success alone does not prove no orphan remains. Do not install schedules or run destructive retention on live records until scopes and acceptance results are reviewed. Backup restore, actual expiry, deletion and scheduled recovery remain explicit release gates.

## Troubleshooting without unsafe shortcuts

| Symptom | Next safe check |
| --- | --- |
| CLI inventory says authentication unavailable | Run official interactive local login; redact the output; no PAT in chat |
| Target guard rejects configuration | Match exact name/ref/isolation, endpoint and loopback origin; inspect ignored link ref; never bypass the guard |
| Dry-run differs from 19 fresh migrations | Stop and inspect actual ledger/target identity; no reset/history repair shortcut |
| Function 401 | Check actual user session/signature/project and API header; retain both JWT/getUser checks |
| Function 403/CORS | Match exact local origin and server ALLOWED_ORIGIN; no wildcard |
| OTP/CAPTCHA fails | Check managed settings/provider approvals/quotas/domain registration; no mock verification |
| Processor timeout/503 | Verify authorized always-on TLS service/config locally without disclosing token; preserve unavailable UI states |
| Cloud test blocked | Read sanitized report scope; supply prerequisites locally, never in reports/chat |

Current first external action is step 6: privately configure an already-owned SMS provider in this project's Authentication Providers, retain phone confirmation and enable phone Auth, then configure hCaptcha and exact loopback redirects. Complete step 4's legitimate service contacts/processor secrets separately. CLI login, migrations and deployment already passed; do not repeat them unnecessarily.
