# Acceptance checkpoint — 2026-10-14 final autonomous run

> **Final update 09:22Z, 2026-10-14 — password recovery COMPLETE AND LIVE-VERIFIED:** account A's real reset via the delivered link passed 11/11 ([evidence](verification/cloud/delivered-recovery-2026-10-14T09-21-23-999Z.json)). The new password works, the old password is rejected, phone/membership/suspension/roles are unchanged, and link reuse is refused. Release decision unchanged: **NOT PRODUCTION READY** (phone verification, member/staff positives, populated protected records, image processor, full restore, manual a11y/load and authorized deployment remain).


> **Update 08:40Z, 2026-10-14:** two fresh real links (08:13Z and 08:20Z requests) were accepted by hosted Auth, but the page fell back to the request form before the password editor. **The password is still unchanged.** Two application defects caused this, and both are fixed:
> 1. Hosted implicit-flow sessions carry AMR `otp`, not `recovery`. The page now accepts `otp` only within 3600 s after the verified user's `recovery_sent_at`.
> 2. The app shell unmounted the recovery page while reloading community data after `SIGNED_IN`.
>
> New live check `npm run test:recovery-adoption` passes 6/6 against hosted Auth, with no email or password change ([evidence](verification/cloud/recovery-adoption-2026-10-14T08-32-28-763Z.json)). It fails with the fix reverted ([negative control](verification/cloud/recovery-adoption-2026-10-14T08-33-28-486Z-negative-control.json)). Regression **20/20** ([results](verification/final-2026-10-14T08-33-42-742Z/results.json)): 94 unit, 47 demo browser. A real reset still needs one more email after the hourly sender limit resets (~09:21Z). Details: [PASSWORD_RECOVERY_ACCEPTANCE.md](PASSWORD_RECOVERY_ACCEPTANCE.md).


**NOT PRODUCTION READY.** Details: [FINAL_AUTONOMOUS_RUN_REPORT.md](FINAL_AUTONOMOUS_RUN_REPORT.md). Staging `ibxubsegrabpspopdgep` only. No signup, account deletion, role/flag change, reset, publication or paid resource. Account A's password was **not** changed.

| Gate | Status | Evidence |
| --- | --- | --- |
| Real password reset with delivered link | PARTIAL: saved link already used (`otp_expired`); original password intact; needs one fresh link | [recovery](PASSWORD_RECOVERY_ACCEPTANCE.md) |
| Used/expired real link refused safely | COMPLETE AND LIVE-VERIFIED 6/6 | [evidence](verification/cloud/expired-recovery-2026-10-14T07-08-56-825Z.json) |
| Recovery callback readiness | `npm run recovery:serve` 5/5 at exact origin; `sb`/refresh-token shape fixes, 26/26 tests | [health](verification/cloud/recovery-serve-health.json) |
| Two-account persistence | COMPLETE AND LIVE-VERIFIED 175 PASS / 0 FAIL (2 external BLOCKED, 12 empty-fixture LIMITED) | [evidence](verification/cloud/persistence-2026-10-14T07-18-28-119Z.json) |
| Avatar "no image" 404 → console errors | FIXED and redeployed (`verify_jwt=true`); live 0 console errors | same |
| Stale-response privacy / revocation / boundaries | LIVE 10/10, 5/5, 24/24 | [race](verification/cloud/account-switch-race-2026-10-14T07-10-23-188Z.json), [revocation](verification/cloud/revocation-2026-10-14T07-10-51-419Z.json), [boundaries](verification/cloud/safe-boundaries-2026-10-14T07-10-58-824Z.json) |
| Advisors / dependencies | 11 WARN unchanged; npm audit 0 | [audit](verification/cloud/final-audit-2026-10-14T07-20-50-060Z.json) |
| Regression | 19/19: 89 unit, 125 SQL, 27 catalog, 6 planner, 9 Edge, 47 demo browser, connected + recovery browser, build/bundle/production/backup, retention, reconcile | [results](verification/final-2026-10-14T07-20-56-959Z/results.json) |
| Phone, member/staff positives, populated protected records, image processor, scholarly contacts, full restore | BLOCKED / DEFERRED FOR SAFETY (unchanged) | report §9 |

---
# Acceptance checkpoint — 2026-10-14

**NOT PRODUCTION READY.** Full details: [AUTONOMOUS_COMPLETION_REPORT.md](AUTONOMOUS_COMPLETION_REPORT.md). Staging `ibxubsegrabpspopdgep` only; no signup, password change, account deletion, role/flag change, reset, publication or paid resource.

| Gate | 2026-10-14 status | Evidence |
| --- | --- | --- |
| Hosted identity/schema drift | PASS — LIVE: no drift at start; 21 migrations after reviewed apply; 29/29 RLS; 4 JWT functions | [audit](verification/cloud/final-audit-2026-10-14T03-42-07-901Z.json) |
| Private buckets refuse documents | COMPLETE AND LIVE-VERIFIED: project-files PNG only, academic-evidence PNG/JPEG, 0 objects affected | [apply/readback](verification/cloud/storage-retention-migration-2026-10-14T03-38-05-781Z.json) |
| Retention schedule (free pg_cron) | COMPLETE AND LIVE-VERIFIED 5/5; first natural run pending; no eligible rows yet | [schedule](verification/cloud/retention-schedule-2026-10-14T04-00-00-624Z.json) |
| Media orphan reconciliation | LOCAL fixtures pass; LIVE read-only run clean on an empty store | [reconcile](verification/cloud/storage-reconcile-2026-10-14T04-00-05-047Z.json) |
| Crossref provider contracts | LOCAL 3 new Deno contracts; redeployed v2; live gate responses unchanged (429 non-member, 401 anon) | [edge diagnostic](verification/cloud/edge-auth-diagnostic.json) |
| A/B stale-response privacy | PASS — LIVE 10/10 (existing sign-in only) | [race](verification/cloud/account-switch-race-2026-10-14T04-00-34-242Z.json) |
| Advisors / dependencies | 11 WARN unchanged, 0 new; npm audit 0 (separate categories) | audit above |
| Regression | 19/19 commands: 85 unit, 125 SQL, 27 catalog, 6 planner, 9 Edge, 47 demo browser, connected + recovery browser, build/bundle/production/backup | [results](verification/final-2026-10-14T03-47-29-595Z/results.json) |
| Recovery delivery/reset | BLOCKED — owner inbox check (200s suggest default-sender eligibility; inference only) | [recovery](PASSWORD_RECOVERY_ACCEPTANCE.md) |
| Phone, academic/staff/member positives, protected-record population, image processor, scholarly contacts, Storage cleanup schedule, full restore | BLOCKED / DEFERRED FOR SAFETY — unchanged reasons | report |

Historical checkpoints follow.

---
# Password recovery acceptance ? 2026-10-13

Final evidence: [10-check boundary run](verification/cloud/password-recovery-2026-10-13T06-16-24-548Z.json), [privacy/preservation](verification/cloud/recovery-privacy-preservation.json).19 sanitized recovery JSON files scanned with0 pattern findings;30 protected backend/config/package files match the prior source backup. Final source snapshot contains140 allowlisted files, including HTML/PowerShell, at ignored `.cloud/backups/2026-10-13T06-16-04-300Z`; source copies are not hosted disaster recovery.

**NOT PRODUCTION READY.** Current recovery evidence supersedes older recovery setup notes only within tested scope. [Full recovery report](PASSWORD_RECOVERY_ACCEPTANCE.md). Existing staging remains `ibxubsegrabpspopdgep`; no signup, account password change/deletion, RLS/schema/Edge modification, paid resource or frontend publication.

- Installed/read back exact local recovery redirect and strengthened hosted password minimum6?12 through reviewed selective CLI Auth configuration.
- Recovery supports managed code/hash and default link callbacks, early URL sanitation/no-referrer, verified recovery AMR for default fragments, matching managed user/session, same-session refocus/renewal, cancellation, generic request notices and existing-code entry without resend. No fabricated session/OTP.
- Real hosted tests:11 request/invalid-artifact checks pass; final10 boundary-only checks pass (overlapping scope, no additional email). Request200 and invalid hash403 are actual hosted results. Ordinary managed password session cannot act as recovery. Phone/member/staff boundaries unchanged.
- Final76 unit/component tests (22 recovery),47 demo browser regressions, four connected recovery viewport/axe/overflow/action-clearance checks, format/lint/types/build/bundle pass; dependency audit0. Prior122 localSQL/3Edge retained, not rerun because those sources were untouched.
- **Hosted custom template NOT installed**: actual supported update returned400/ConfigPushAuthUpdateStatusError; current free/default-SMTP policy requires genuine custom SMTP. Latest preview customSMTP=false; no billing or fake sender workaround. Local `supabase/templates/recovery.html` is preparation.
- **Delivery/reset/reuse/real expiry BLOCKED**: mailbox connector/browser dashboard unavailable; no actual delivered artifact configured. Private continuation preflight exits2 before reading secrets or making a request. No successful reset/new-password login claim.

Next action: check controlled A inbox privately for the already requested email. If received, save real link/code/new password with `scripts/set-staging-recovery-input.ps1` and use the prepared ordinary reset continuation. If absent, provision an eligible approved dedicated free Gmail SMTP sender privately (2SV/app password, TLS587, no purchased domain); availability/delivery remain unverified. Then preview/apply the hosted template using `scripts/configure-staging-recovery.mjs`. Exact commands, restrictions, provider comparisons and safely retained diagnostics are in the full report. No more A/B registration. Protected member/staff fixtures, images/sources and recovery/operational gates remain open.

Historical acceptance checkpoints follow.

---

# Current two-user acceptance - 2026-10-13

Historical rows below are superseded only within the stated tested scope. **NOT PRODUCTION READY.**

| Requirement | Status | Actual evidence / remaining limit |
| --- | --- | --- |
| Controlled A/B credentials and different managed users | COMPLETE AND VERIFIED | Local DPAPI; one ordinary B signup; subsequent sign-in only; no values recorded |
| Independent simultaneous browser sessions, navigation, refresh, logout/relogin | COMPLETE AND VERIFIED | Final152-check hosted run, managed same-identity assertions |
| Own profile/preferences persistence in each context and separate hosted reads | COMPLETE AND VERIFIED | Minimum private canaries, UI readings and owner READ200/row1; final restore verified |
| Bidirectional populated private profile/preference isolation | COMPLETE AND VERIFIED | Owner rows1, other/anonymous rows0; private URL/snapshot/search/RPC canaries |
| Direct unauthorized table/flag/role/project writes and privileged claims | COMPLETE AND VERIFIED, scoped |42501 denials;401 forged JWT; same-value flags/invalid role only; no privilege assigned |
| Populated academic/marks/notifications/bookmarks/roles/private project/image isolation | BLOCKED BY EXTERNAL DEPENDENCY | No legitimate protected fixtures; empty reads marked LIMITED, not passes |
| Frontend late-response account privacy | COMPLETE AND VERIFIED | Actual managedB/UIA failure reproduced, fixed, exact live10-pass rerun plus5 local regressions |
| Own export / foreign export selector / safe deletion guard | COMPLETE AND VERIFIED, scoped | Caller-only export, signature rejection, wrong confirmation400; destructive deletion not executed |
| Private Storage direct-upload authorization | COMPLETE AND VERIFIED, scoped | Valid synthetic files403 in all3 buckets and foreign prefixes; object lifecycle still blocked |
| Authorized member/staff/community positives | BLOCKED BY EXTERNAL DEPENDENCY | Genuine phone/human review/scoped privileged accounts unavailable; rules preserved |
| Scholarly proxy and safe private image processor | IMPLEMENTED, VERIFICATION BLOCKED | Member gate429/missing processor503; current contacts/processor names absent |
| Recovery delivery/exchange/reset | IMPLEMENTED, VERIFICATION BLOCKED | UI4 viewports pass; prior request200 only; actual code/SMTP/template/mailbox needed |
| Hosted metadata integrity and deployed boundaries | COMPLETE AND VERIFIED |19 migrations,29/29 RLS, no directDML/unsafepaths/uploads;4 JWT functions |
| Dependency/local regression/build | COMPLETE AND VERIFIED within scope |58 unit/122 stubbedSQL/3 Edge/47 demo; lint/types/build/audit0 |
| Native Advisors / load / breached-password protection | PARTIALLY IMPLEMENTED |0ERROR/28WARN; paid protection not enabled; load/staff review open |
| Backup/restore, cleanup/retention, actual deletion | BLOCKED BY EXTERNAL DEPENDENCY / explicit disposal authorization | No destructive rehearsal, source copies not full recovery |

[Final hosted evidence](verification/cloud/persistence-2026-10-13T01-44-23-179Z.json), [exact race repair](verification/cloud/account-switch-race-2026-10-13T01-41-37-845Z.json), [full report](CLOUD_ACCEPTANCE_REPORT.md). B is no longer a setup blocker; **omit signup flag** on future runs. Next action is free recovery-code template/delivery verification, not another account registration.

---

> Final preservation/privacy evidence:30 original backend/config/package fingerprinted files unchanged;13 new sanitized JSON results scanned with0 private-field/UUID/token pattern findings. Current source preflight passed and copied128 allowlisted files to ignored `.cloud/backups/2026-10-12T17-33-06-848Z`. This is source recovery only, not hosted data/Auth/Storage backup or exhaustive secret detection.

> Final verification: existing **47/47 demo browser tests** passed (5.1m). Production missing-configuration smoke passed: setup-required=true, synthetic fallback=false, remote backend requests0, uncaught0, FCP480ms/LCP572ms/CLS0.00238 on an unthrottled local preview; not hosted-feed performance.

## Current free staging acceptance ? 2026-10-12

Prior sections are historical. Status applies only to stated evidence; local fixtures are separate from live service checks.

| Requirement | Status | Evidence / limitation |
| --- | --- | --- |
| Exact existing staging identity | COMPLETE ? LIVE | CLI exact ref/name ACTIVE_HEALTHY; phase2-project-identity.json |
| A profile/preferences persistence through refresh and independent sessions | COMPLETE ? LIVE | 47-pass timestamped persistence result; UI writes and separate hosted reads |
| Duplicate requests and invalid writes | COMPLETE ? LIVE | Receipt deduplication, cross-action rejection, transactional validation, categories |
| Own notification categories | COMPLETE ? LIVE | Hosted writes/readback; actual unread transition has no fixture |
| Anonymous access to known private profile | COMPLETE ? LIVE | Known populated A profile filtered |
| Membership/staff/service restrictions and safe direct-write probes | COMPLETE ? LIVE, scoped | 42501 denials; no elevated identity/valid staff-role assignment attempted |
| B credential configuration and bidirectional privacy | BLOCKED | User confirmed no second controlled account; DPAPI helper and explicit ordinary signup prepared |
| Populated marks/applications/bookmarks/notifications/private-project/image isolation | BLOCKED | No legitimate protected fixtures; empty reads are insufficient |
| Managed renewal and own export/rate limit/anonymous denial | COMPLETE ? LIVE | auth-lifecycle-live.json, six passes |
| Recovery UI and safe code/password sequencing | IMPLEMENTED; delivery/reset BLOCKED | 53 unit tests total; four connected route/axe/overflow checks; request200 does not prove delivery |
| Free SMTP setup and recovery template | BLOCKED ? ACCOUNT CONFIGURATION | Reviewed local template/free-provider decision; no SMTP/template remote change |
| Real SMS and approved-member positives | BLOCKED ? ZERO-COST/VERIFICATION GATE | No sustainable free SMS verified; no policy bypass |
| Scholarly upstream availability | COMPLETE ? DIRECT UPSTREAM ONLY | Two public source200 responses; not Edge proxy/cache acceptance |
| Scholarly proxy/source attribution/cache | BLOCKED ? MEMBER/CONTACT CONFIGURATION | Real Edge429 membership gate; contacts absent |
| Private image processing/storage lifecycle | BLOCKED | Real503, no processor settings; measured WASM candidate not adopted |
| Local regressions/build/audit | COMPLETE, stated scope |53 unit,122 stubbed SQL,3 Edge; lint/types/build/format/audit0; browser/smoke final result below |
| Backups/retention/deletion/operational recovery | PARTIAL / BLOCKED | Source/private baseline protection; hosted restore/destructive deletion not executed |
| Release/public deployment | BLOCKED / NOT AUTHORIZED | No production readiness, public frontend, paid resources or external destructive actions |

Details and final evidence: [CLOUD_ACCEPTANCE_REPORT.md](CLOUD_ACCEPTANCE_REPORT.md), [FREE_RELEASE_PLAN.md](FREE_RELEASE_PLAN.md).

---

# Cloud acceptance checklist

## Current live session repair - 2026-10-12

Confirmed existing staging/account resumed. Earlier credential-unavailable status rows below are historical; the original actual registration report is preserved. No signup, fixture write, verification-flag change, staff grant or database/backend/frontend mutation in resume mode.

| Task | Status / scope | Actual evidence |
| --- | --- | --- |
| R01 Audit actual report/runner/routes/Auth and working source | PASS - LOCAL ONLY | No Git repository;121 fingerprints compared, only test runner source changed |
| R02 Preserve original evidence and add safe diagnostics | PASS - LOCAL ONLY | email-auth-live.json byte-identical to initial-registration-failure copy; timestamped route/step/class/code/boolean/status results, no identifiers or raw payloads |
| R03 Explicit existing-account UI sign-in mode | PASS - LIVE VERIFIED | Existing DPAPI credentials private; actual managed sign-in, signupRequests 0; registration remains separate |
| R04 Reproduce exact failure without assuming cause | PASS - LIVE DIAGNOSIS | /profile -> wait-for-networkidle TimeoutError, session true/true, content true, core 200, uncaught 0; first diagnostic exit1 retained |
| R05 Verified bounded readiness repair | PASS - LIVE VERIFIED |15s content/loading/API checks; same managed user/session; session/data assertions retained, networkidle only optional diagnostic flag |
| R06 /profile, /saved, /notifications, /settings | PASS - LIVE VERIFIED | Each actual connected route/content/core APIs/session verified; profile explicitly says phone not verified/academic not_submitted |
| R07 /trust | PASS - LIVE VERIFIED, expected denial | Access-denied message for actual account without staff roles; no privileged access granted |
| R08 Direct refresh with same account | PASS - LIVE VERIFIED | /profile and post-relogin /settings refresh; actual managed user matches without logging identity |
| R09 Logout, refresh signed-out, login again, final logout | PASS - LIVE VERIFIED | Two token200/two logout204; restored/local sessions match expected states, final session absent |
| R10 Actual avatar empty metadata | PASS - LIVE VERIFIED, read only | Own metadata 200 / hasAvatar false / code null; initial avatar404 is empty state, not upload success |
| R11 Final live runner and static checks | PASS - LIVE VERIFIED / LOCAL ONLY |20 PASS / 0 FAIL exit0; console0/uncaught0/signup0; lint/format exit0; existing unchanged passing suites not repeated |
| R12 Wider permission/persistence/integration/release gates | STILL BLOCKED / UNVERIFIED | Real write/duplicate/adverse/cross-user/SMS/human review/member/staff/source/processor/recovery and Advisor gates are not closed by session smoke |

Final live result: `verification/cloud/email-auth-diagnostic-2026-10-12T14-10-01-453Z.json`; initial precise failure: `email-auth-diagnostic-2026-10-12T13-59-45-169Z.json`; original: `email-auth-live.json` and preserved copy. Other successful diagnostic iterations retained. No authenticated screenshot/trace/HAR was captured.

No user setup action remains for the repaired session test. To repeat only that scope, use `node scripts/test-email-staging.mjs --resume-existing-account`. Do not run new-account registration against this existing identity. Existing phone/academic/role restrictions remain in effect. See the current [report](CLOUD_ACCEPTANCE_REPORT.md) for exact results and release limitations.

---

## Previous free-email implementation checkpoint - 2026-10-12

Same confirmed staging target: **ibxubsegrabpspopdgep**. User enabled Email and disabled email confirmation; actual hosted settings were verified. No remote schema/Auth/function mutation was needed by the agent. No signup/account/session was fabricated. Existing migration/deployment evidence below remains valid as a previous checkpoint; its old42unit count and SMS-first action are superseded by this section.

| Task | Status / scope | Actual evidence / remaining prerequisite |
| --- | --- | --- |
| E01 Inspect Auth/client/gateway/routes/validation/policies/reports and target/public config | PASS - LOCAL ONLY | Existing project preserved; exact connected endpoint/public-key guard; no dependency or backend/security changes |
| E02 Verify actual hosted Email configuration | PASS - LIVE VERIFIED, settings only | HTTP200: Email=true, email autoconfirm=true, signup enabled; phone=false/phone autoconfirm=false. email-auth-settings.json |
| E03 Email registration/login forms, visibility/validation/errors/loading/navigation | IMPLEMENTED; PASS - LOCAL ONLY / LIVE ANONYMOUS UI |7 isolated unit scenarios; forms call real managed SDK; no demo Auth fallback or privileged/phone/academic metadata |
| E04 Password/session/logout lifecycle | IMPLEMENTED, REAL ACCOUNT VERIFICATION BLOCKED | Existing SDK persistence/refresh/Auth events and logout retained; account/session not supplied, no real lifecycle pass |
| E05 New-account profile editor/null handle and honest unverified phone UI | IMPLEMENTED; source/local tests | Null handle normalized; no phone-verified or academic badge fabricated; unverified academic form blocked; real profile creation NOT EXECUTED |
| E06 Connected forms and responsive/a11y inspection | PASS - LIVE CONNECTED ANONYMOUS UI | Four sizes, axe0/overflow0,16 public snapshot200, console0/uncaught0, Auth requests 0. Eight captures; four final desktop/mobile captures opened/inspected |
| E07 Real registration/duplicate/invalid credentials/malformed email/short password | BLOCKED - USER CONFIGURATION | Actual runner exit2: controlled private credentials unavailable; only hosted settings verified. No account created or valid signup/token request sent |
| E08 Real own profile/preferences/notifications/feed/export and refresh persistence | BLOCKED - USER CONFIGURATION | Guarded live UI/API runner prepared; no signed-in operation executed. Expected policy permissions kept distinct from tested behavior |
| E09 Unverified member/staff/service denials and verification-flag escalation | BLOCKED - USER CONFIGURATION for signed-in tests | Existing source/RLS preserved. Previous anonymous native checks remain scoped historical evidence; actual email JWT missing |
| E10 Two-user populated private-row isolation | BLOCKED - USER CONFIGURATION | Requires separate actual controlled identity/fixtures; filtered empty queries are insufficient proof |
| E11 Delivered SMS/academic submission/approved-member/staff positive journeys | BLOCKED - EXTERNAL DEPENDENCY | Email grants none; real SMS unavailable, genuine human review/roles required. No Twilio upgrade or bypass performed |
| E12 Local regression/build/security/bundle | PASS - LOCAL ONLY |49 unit/122 SQL/47 demo browser; final lint/types/build/7focused email tests/format/4Edge types/3Edge tests/audit0/smoke pass; original CSS budget met9993 gzip bytes |
| E13 Secure private intake/test runner/reporting | PASS - LOCAL ONLY preparation; live credential gate BLOCKED | PSparser0errors; Windows-user DPAPI/ignored file, no plaintext password output; no actual prompt invoked |
| E14 Public frontend deployment or paid resources | NOT APPLICABLE | Neither authorized nor performed |

**First external action:** run `.\scripts\set-staging-email-credentials.ps1` in your trusted local PowerShell from this root. Enter a dedicated email you control and a unique 12+ character password privately. Do not send password/tokens/OTPs in chat. The agent can then execute `node scripts/test-email-staging.mjs` for real UI/Auth/API acceptance. No SMS provider upgrade is required for this email step. See [SETUP.md](SETUP.md) for private-file handling and new-account test scope.

Current evidence: `verification/cloud/email-auth-{settings,live,ui}.json`, `screenshots/staging/email-auth/{login,register}-{1440,1024,390,320}.png`, ignored `email-*.log`. Latest outcomes and original repaired failures are in [CLOUD_ACCEPTANCE_REPORT.md](CLOUD_ACCEPTANCE_REPORT.md).

---

## Previous migration/deployment checkpoint - 2026-10-12

Confirmed target: **biocircuit-staging / ibxubsegrabpspopdgep**. CLI authenticated, ACTIVE_HEALTHY, local link and frontend URL verified. Only this staging project changed; frontend unpublished. No Docker, reset/history repair, seed, purchase, fabricated verification/roles or secret output. Canonical current authority: `BIOCIRCUIT_STAGING_EXECUTION_PROMPT.md` and the user's resume directive. Full historical evidence remains in [CLOUD_ACCEPTANCE_REPORT.md](CLOUD_ACCEPTANCE_REPORT.md).

Scope is explicit: **PASS - LIVE VERIFIED**, **PASS - LOCAL ONLY**, **BLOCKED - USER CONFIGURATION**, or **NOT APPLICABLE**. A limited pass does not close the larger authenticated release gate.

| Order / task | Dependencies | Status / scope | Actual evidence / remaining criterion |
| --- | --- | --- | --- |
| S01 Read current reports/specification/source/19 migrations/four functions; preserve work | None | PASS - LOCAL ONLY | Reviewed chain, grants/RLS/storage/handlers. All 19 migration and eight Edge/shared hashes unchanged; six narrow existing source/test changes; no Git repository or commit |
| S02 Verify CLI inventory, exact target/link/public config | S01 | PASS - LIVE VERIFIED; config LOCAL ONLY | Actual name/ref ACTIVE_HEALTHY; exact local link/URL; only three real public env variables, no privileged key or fake CAPTCHA |
| S03 Local recovery/baseline/regression checks | S01 | PASS - LOCAL ONLY | 117-file secret-free source copy; lint/types/42unit/122 SQL/26catalog/3Edge/build/format/audit/bundle/missing-config smoke pass |
| S04 Review pending plan, native fresh-target inventory, supported dry-run | S02 | PASS - LIVE VERIFIED | Native empty app schema/ledger/buckets/triggers; dry-run exactly19 files, no seed/roles; fresh identity/link/hashes checked before push |
| S05 Apply original migrations and verify actual ledger | S04 | PASS - LIVE VERIFIED | Push exit0, all 19 local/remote versions match; no reset/seed/repair |
| S06 Hosted RLS/grants/definer/storage/triggers/indexes and native pgTAP | S05 | PASS - LIVE VERIFIED, structural scope | 29/29 RLS, no client writes/unsafe definer searchpaths; three private buckets, no direct-upload policies; both triggers enabled,49 indexes, five native TAP assertions ok |
| S07 Snapshot404 diagnosis/repair and guest recommendation denial | S05 | PASS - LIVE VERIFIED; adapter tests LOCAL ONLY | Original missing public_snapshot installed by migrations: same SDK200. Guest member-only recommended_page401 prevented by actual-session gate; no authorization weakened |
| S08 Connected anonymous frontend/browser/accessibility | S07 | PASS - LIVE VERIFIED, anonymous scope | 12 routes/four sizes/axe 0 / overflow 0; keyboard/history/focus/motion;34 snapshot200,console 0 / uncaught 0; all four actual captures inspected |
| S09 Configure origin and API-based function deployments | S05 | PASS - LIVE VERIFIED, deployment/ingress scope | Four ACTIVE/version1/verify_jwt=true; ALLOWED_ORIGIN exact5190; --use-api, no Docker; getUser/private boundaries unchanged |
| S10 Anonymous hosted negative permissions/Storage/JWT/CORS | S06,S09 | PASS - LIVE VERIFIED, anonymous scope | 39 actual assertions pass: private reads/RPC/role flags denied, private REST denied, valid tiny-image direct uploads denied403/RLS, exact/wrong-origin preflights and invalid/missingJWT checked |
| S11 Inspect managed phone Auth settings | S02 | PASS - LIVE VERIFIED, observation only | Auth settings200 phone=false/autoconfirm=false; no OTP or credential inspection. Selected SMS provider unknown |
| S12 Delivered OTP/login/logout/change/reuse/expiry/cooldown/abuse/CAPTCHA | S11 | BLOCKED - USER CONFIGURATION | Existing provider credentials/approvals, real hCaptcha settings/sitekey, exact redirects, consenting dedicated phones required |
| S13 Actual academic submission/review/pending/rejected/approved/suspended/staff scopes | S12 | BLOCKED - USER CONFIGURATION | Real Auth accounts, actual human decisions and trusted explicit scoped staff bootstrap; no fabricated verification |
| S14 Cross-user persistence/post/reply/reaction/bookmark/question/project/notifications/reputation/moderation | S13 | BLOCKED - USER CONFIGURATION | Actual authorized distinct JWTs missing. Existing cloud-http:7 anonymous passes/8 blocked records, exit2; no write fixtures or real-role tests executed |
| S15 Scholarly provider/cache/pagination/attribution/rate/adverse acceptance | S09,S13 | BLOCKED - USER CONFIGURATION | Legitimate server contacts and real authenticated proxy/provider results; no source success simulated |
| S16 Processor/private uploads/links/expiry/removal/replace/failure compensation | S09,S13 | BLOCKED - USER CONFIGURATION | Authorized always-on HTTPS first-party processor/token and actual distinct accounts/object lifecycle; denied anonymous upload alone is insufficient |
| S17 Account export/delete/ownership refusal/global session revocation | S14,S16 | BLOCKED - USER CONFIGURATION | Current-user journeys and separately confirmed disposable account; no account deletion implicitly authorized/executed |
| S18 Orphan cleanup/retry/retention schedule/hosted backups/restore | S16 | BLOCKED - USER CONFIGURATION | Local preparation only, no schedule or remote destructive rehearsal installed; source copy is not a hosted backup |
| S19a Postmigration Advisor inspection/source assessment | S06 | PASS - LIVE VERIFIED, findings observed | 0 ERROR / 27 WARN:10 authenticated definer/17 AuthRLSinitplan. Intentional RPC design reviewed; no unsafe grant or applied-migration rewrite |
| S19b Advisor risk/release operational approval under actual role/load | S13-S18 | BLOCKED - USER CONFIGURATION | Real-user negative permissions, representative query plans and recovery evidence still required; warnings retained honestly |
| S20 Evidence reports/setup/security/operations and artifact review | Independent work | PASS - LOCAL ONLY | Current report/checklist/readiness, guarded Docker-free instructions, logs/JSON/captures; zero dependency changes |
| S21 Publish frontend/change production/purchase resources | None | NOT APPLICABLE | Not authorized or performed |

## Evidence and next action

Actual JSON: `verification/cloud/resume-{migrations,native-catalog,native-pgtap,functions,snapshot-diagnosis,anonymous-http,advisors,empty-data,preservation}.json`, current `connected-anonymous.json`, `http-results.json`, `preflight.json`. Screenshots: `screenshots/staging/anonymous-{1440,1024,390,320}.png`; prior404captures preserved in `screenshots/staging/before-migrations/`. Ignored actual command logs: `docs/resume-*.log`. Earlier47 demo browser passes are historical, not rerun or called live.

First external action: open staging [Authentication Providers](https://supabase.com/dashboard/project/ibxubsegrabpspopdgep/auth/providers), configure an already-owned supported SMS provider privately, retain phone confirmation and enable phone Auth. Then configure managed hCaptcha plus the public frontend site key and exact loopback redirects. Keep credentials and delivered OTPs in trusted local/Dashboard flows. Further source contacts, processor hosting, real accounts and human review are required; see [CLOUD_SETUP.md](CLOUD_SETUP.md). CLI login, migrations and deployment are no longer blockers

Final preservation evidence: 20 current sanitized JSON reports scanned with zero private-field, personal-UUID or token-pattern findings; 30 original backend/config/package files remain unchanged. Final source preflight copied 132 allowlisted files to ignored `.cloud/backups/2026-10-13T02-11-27-645Z`. This is source recovery only, not hosted database/Auth/Storage backup or exhaustive secret detection. Final ESLint, Prettier and TypeScript checks exited0..
# Current acceptance checklist — 2026-10-13 final autonomous run

See [complete current evidence/status matrix](FINAL_COMPLETION_REPORT.md). Historical rows below do not override this checkpoint.

| Gate | Current status | Evidence / limitation |
| --- | --- | --- |
|Exact staging/migration20/catalog|COMPLETE AND VERIFIED|Single reviewed migration applied;20 hosted versions,29RLS, original19 unchanged|
|Populated A/B profile/preferences/persistence|COMPLETE AND VERIFIED|152 scoped live passes;0 failures,2 explicit blocked categories; both original baselines restored|
|Delayed responses/session refresh revocation|COMPLETE AND VERIFIED|10 race +5 actual Auth checks; unrelated B survives; access JWT expiry caveat|
|Owner export/encrypted local core restore|COMPLETE AND VERIFIED within scope|8 checks: hosted exports, DPAPI, independent local20-migration profile/preferences readback|
|Recovery UI/request/invalid-artifact boundaries|COMPLETE AND VERIFIED within scope|Prior live negatives plus fresh component/connected viewport regression|
|Delivery/template/reset/reuse/expiry|BLOCKED BY EXTERNAL CONFIGURATION|No artifact/customSMTP; no mailbox access/reset|
|Phone/member/staff/protected populated records|BLOCKED BY EXTERNAL CONFIGURATION|No genuine phone/proof/authorized reviewer fixtures; empty rows not privacy proof|
|Community/question/project/moderation live positives|IMPLEMENTED BUT UNVERIFIED|Local SQL/demo pass; ordinary hosted denials verified|
|Upstream sources/provider contracts|COMPLETE AND VERIFIED within scope|Actual Crossref/PubMed200; local pagination/budget/error contracts|
|Hosted scholarly search/cache|BLOCKED BY EXTERNAL CONFIGURATION|Contacts and approved member missing|
|Image processor/cleanup safeguards|COMPLETE AND VERIFIED locally|Output caps, decoder tests, validated100-item queue and retry/dry-run tests|
|Private image lifecycle|BLOCKED BY EXTERNAL CONFIGURATION|TLS processor/token and member fixtures missing|
|Documents/evidence scanning|NOT IMPLEMENTED|Safely disabled|
|RLS17 performance warnings|COMPLETE AND VERIFIED|Gone remotely; equivalence/InitPlan and live A/B rerun|
|Remaining11WARN|PARTIALLY IMPLEMENTED acceptance|Ten intentional RPCs reviewed, privileged positives outstanding; paid breach control unavailable. Error-level0|
|Deletion/retention/orphans/full recovery|PARTIALLY IMPLEMENTED|Safe negative/local tests; no live destruction/job/full Auth/Storage restore|
|Regression/reproducibility|COMPLETE AND VERIFIED within scope|17/17 commands,85unit/122SQL/26catalog/6planner/6Edge/47demo; connected/axe; audit0; offline install265|
|Publication/paid resources|NOT IMPLEMENTED / NOT AUTHORIZED|None performed|

**Release remains blocked.** Exact commands, sanitized evidence, failure repairs, inspected screenshots and the next private owner action are in the final report.

---

