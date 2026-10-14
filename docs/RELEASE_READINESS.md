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

# Latest release decision - 2026-10-13

**NOT PRODUCTION READY.** Populated ordinary-account privacy and sessions now have genuine two-user evidence. A real frontend stale-response privacy defect was repaired. This does not prove every protected/member/staff/integration/operational workflow.

| Gate | Latest decision |
| --- | --- |
| A/B ordinary managed identities |PASS; B signup performed once, subsequent existing-account login only |
| Simultaneous sessions / refresh / one-user logout / relogin |PASS - LIVE |
| Populated private profiles/preferences and caller-bound mutations |PASS - LIVE, both directions |
| Private URL / snapshot / search exclusions |PASS - LIVE, known populated profiles |
| Account transition under delayed real A response |PASS - LIVE after repair; failure history retained |
| Ordinary unauthorized DML/flags/roles/projects/forged JWT |PASS - LIVE, stated safe probes |
| Export and deletion confirmation / direct Storage uploads |PASS - LIVE safeguards; actual deletion/object lifecycle UNVERIFIED |
| Protected applications/marks/notifications/bookmarks/roles/private projects/images |BLOCKED; missing genuine protected fixtures, not falsely passed by empty reads |
| Genuine phone/academic/staff/member positives |BLOCKED; no fake flags or paid SMS |
| Recovery / scholarly proxy / private processor |BLOCKED; valid delivery/exchange, contacts/member approval and secure hosting required |
| Schema/RLS/grants/deploy state |PASS; fresh19 ledger/29RLS/3private buckets/4JWT functions |
| Advisors/security operations |28WARN retained, noERROR; paid breach filter not enabled; load/manual review/restore remain open |
| Tests and release artifacts |58unit/122localSQL/3Edge/47demo; four connected recovery viewports; lint/types/format/build/audit0 pass |
| Paid services / public frontend / destructive reset |None performed |

Evidence: [152-check hosted result](verification/cloud/persistence-2026-10-13T01-44-23-179Z.json), [10-check exact race result](verification/cloud/account-switch-race-2026-10-13T01-41-37-845Z.json), [hosted operations](verification/cloud/two-user-operations-summary.json), [report](CLOUD_ACCEPTANCE_REPORT.md).

Next best free action: configure reviewed recovery-code email template and permitted sender in the **existing staging dashboard**, then verify delivery and reset privately. No more B signup needed. Full production acceptance remains blocked by the rows above; no claim of complete security or release readiness.

Historical checkpoints follow.

---

> Final preservation/privacy evidence:30 original backend/config/package fingerprinted files unchanged;13 new sanitized JSON results scanned with0 private-field/UUID/token pattern findings. Current source preflight passed and copied128 allowlisted files to ignored `.cloud/backups/2026-10-12T17-33-06-848Z`. This is source recovery only, not hosted data/Auth/Storage backup or exhaustive secret detection.

> Final verification: existing **47/47 demo browser tests** passed (5.1m). Production missing-configuration smoke passed: setup-required=true, synthetic fallback=false, remote backend requests0, uncaught0, FCP480ms/LCP572ms/CLS0.00238 on an unthrottled local preview; not hosted-feed performance.

# Current release decision ? 2026-10-12

**NOT PRODUCTION READY.** Live persistence/security scope advanced:47 passes/0 failures/3 external blockers, plus six managed renewal/export checks. A's profile/preferences persisted across independent sessions. This does not satisfy populated two-user, approved-member/staff, delivered recovery, scholarly proxy, private storage or operational recovery gates.

| Release gate | Current status |
| --- | --- |
| Existing staging identity and protected backend | Verified exact ref/name; no schema/Edge/RLS changes |
| Existing registration/session/logout/relogin | Previous20 actual passes retained, registration not repeated |
| Own profile/preferences/categories persistence and duplicate/input handling | PASS ? LIVE, final47 result and hosted cleanup readback |
| Ordinary restrictions/direct DML/anonymous known private profile | PASS ? LIVE, scoped probes only |
| Same-identity managed token renewal and own export/rate limiting | PASS ? LIVE, six lifecycle checks |
| Two independent populated private accounts and protected fixtures | BLOCKED ? B credentials and legitimate fixtures unavailable |
| Recovery request | HTTP200 ACCEPTED; mailbox delivery/valid code/password reset UNVERIFIED |
| Recovery implementation | Managed code verification/password update implemented; local tests and connected UI pass; remote template/SMTP configuration open |
| Phone/academic/staff/member-positive workflow | BLOCKED; no safe sustainable free SMS verified, identity rules preserved |
| Scholarly discovery | Direct sources200; application member gate429 and missing contacts; proxy/cache success BLOCKED |
| Private images | Honest503; processor hosting missing; constrained WASM alternative not accepted |
| Lint/types/unit/SQL/Edge/format/build/audit | PASS ?53 unit/122 stubbed SQL/3 Edge, audit0; final browser/smoke appended after completion |
| Responsive recovery UI | Four sizes, axe0/overflow0/console0; desktop/mobile screenshots actually inspected |
| Data/Auth/Storage backup restore, retention/cleanup/deletion, staff abuse matrix | UNVERIFIED; source backup is not hosted restore evidence |
| Public release or billable services | Not authorized or performed |

Next action: configure B privately with `powershell -NoProfile -File scripts/set-staging-email-credentials.ps1 -Account B`. New B: `node scripts/test-staging-persistence.mjs --register-second-account`; existing B: omit flag. Do not paste credentials or codes into chat. Free recovery/provider/processor setup and risks are detailed in [FREE_RELEASE_PLAN.md](FREE_RELEASE_PLAN.md).

[Final live persistence](verification/cloud/persistence-2026-10-12T17-18-14-948Z.json); [lifecycle](verification/cloud/auth-lifecycle-live.json); [full report](CLOUD_ACCEPTANCE_REPORT.md). Historical readiness below is retained as history, not a current pass claim.

---

# BioCircuit release readiness - 2026-10-12

**NOT PRODUCTION READY. Live remaining-route/session acceptance now passes.** Existing staging `ibxubsegrabpspopdgep` and actual registered email account were resumed through normal UI, without signup or account mutation. The verified failure was a /profile networkidle timeout with a retained session, visible content and successful core APIs. Bounded content/data/managed-user readiness fixes the test; no routing/Auth/security redesign needed.

| Gate | Status / scope | Actual evidence / remaining limitation |
| --- | --- | --- |
| Staging identity/schema/functions/RLS | PASS - LIVE VERIFIED, prior checkpoint |19 migrations,29/29 RLS,five native TAP,four JWT functions remain unchanged; no new remote mutation |
| Genuine email registration | PASS - LIVE VERIFIED, original run | Actual preserved email-auth-live.json records registration session/trigger profile/no phone/no roles/first-six-route successes; not replayed |
| Existing-account sign-in and remaining routes | PASS - LIVE VERIFIED | Final20 PASS / 0 FAIL; /profile,/saved,/notifications,/settings,/trust expected behavior/coreAPI/session verified |
| Same-account refresh/session restoration | PASS - LIVE VERIFIED | Actual /profile and /settings refresh with managed getUser identity comparison; no identity recorded |
| UI logout/signed-out refresh/relogin/final logout | PASS - LIVE VERIFIED | Actual token200 x2/logout204 x2, correct session states, final local session absent |
| Phone/academic/role identity boundaries | PASS - LIVE VERIFIED, observed scope | No phone/timestamp; phone_verifiedfalse/not_submitted/roleCount0; profile truthful; Trust denied. Member/staff-positive/negative RPC matrix still unverified |
| Safe diagnostic/history/working-source preservation | PASS - LOCAL ONLY | Original byte-preserved; timestamped allowlisted results; source only runner changed; lint/format pass; no trace/private screenshot/secret dump |
| Wider profile/preferences/export/community persistence | UNVERIFIED / BLOCKED as applicable | Read-only session smoke does not prove writes, duplicate requests, notifications changes, reactions/bookmarks/projects or export; current policy gates remain |
| Time-based token refresh/recovery/global revocation/adverse Auth | UNVERIFIED | Page refresh tested; natural expiry, provider outages and complete invalid/duplicate credential matrix are not claimed |
| Populated cross-user privacy and staff privilege matrix | BLOCKED - USER CONFIGURATION | Additional genuine scoped accounts/fixtures/human review; no privileged role or verification flag fabricated |
| SMS/academic submission/approved membership | BLOCKED - EXTERNAL DEPENDENCY | Phone disabled; email registration cannot submit academics/receive approved-member contribution privileges automatically |
| Scholarly sources/private processor and object lifecycle | BLOCKED - EXTERNAL DEPENDENCY | Legitimate contacts, authorized HTTPS processing, real private upload/link expiry/revocation/compensation still required |
| Deletion/cleanup/retention/backups/restore/Advisor acceptance | BLOCKED - USER CONFIGURATION | Separate safe operational evidence and disposable deletion authorization; previous27 Advisor warnings remain under review |
| Existing local build/unit/SQL/demo/Edge/security evidence | PASS - LOCAL ONLY, previous checkpoint |49unit/122SQL/47demo/build/Edge/audit evidence retained. Not unnecessarily rerun when only runner changed; new live 20 / static checks are current |
| Academic/PDF upload/direct messages/email digests | NOT IMPLEMENTED / UNAVAILABLE | Existing limitations retained |
| Public deployment/production/paid resources | NOT APPLICABLE | Not authorized or performed |

Final actual result: [session diagnostic](verification/cloud/email-auth-diagnostic-2026-10-12T14-10-01-453Z.json), original genuine signup evidence: [preserved report](verification/cloud/email-auth-live-initial-registration-failure.json). [Cloud report](CLOUD_ACCEPTANCE_REPORT.md) records the initial timeout and successful iterations separately. No release gate is closed solely by a UI heading or demo session.

No setup blocker remains for repeating session acceptance: `node scripts/test-email-staging.mjs --resume-existing-account`. Keep existing private credentials local; do not register this identity again. Wider release requires the real permissions/persistence/integration/operational gates above; do not bypass phone/academic/RLS/staff restrictions to clear them. No application/source-style, migration, Edge handler, dependency/lockfile, private credential or Auth setting change was made by this repair. No Git repository/commit

Final preservation evidence: 20 current sanitized JSON reports scanned with zero private-field, personal-UUID or token-pattern findings; 30 original backend/config/package files remain unchanged. Final source preflight copied 132 allowlisted files to ignored `.cloud/backups/2026-10-13T02-11-27-645Z`. This is source recovery only, not hosted database/Auth/Storage backup or exhaustive secret detection. Final ESLint, Prettier and TypeScript checks exited0..
# Current release decision — 2026-10-13 final autonomous completion

**NOT PRODUCTION READY.** [Final evidence and gate matrix](FINAL_COMPLETION_REPORT.md) supersedes historical counts below.

Verified gains:152 actual two-user checks,10 actual delayed-response checks,5 managed refresh/global-revocation checks, and two live owner exports plus encrypted/local core recovery (8 checks). Migration20 removed17 platform performance warnings while preserving predicate intent and grants. Hosted warnings11 (10 scoped definer RPCs + paid breach control); actual error-level0. Four Edge functions remain JWT-protected and29 tables have RLS.

Final17-command regression passes:85unit,122localSQL,26catalog,6planner,6Edge,47demo browser; connected anonymous12 routes/four sizes and recovery four sizes; format/lint/types/build/bundle/audit0. Fresh offline lockfile install265 packages and source backup152 files pass. Original visual source/19 migrations/Edge handlers/lockfile are unchanged. Owner export/local core recovery does not prove full hosted disaster recovery.

Mandatory gates still open:

- Actual delivered recovery and reset/reuse/expiry; customSMTP absent, hosted custom template uninstalled.
- Real phone verification, academic decisions, staff/member positives and populated protected-record isolation; no paid SMS or fabricated flags/roles.
- Authorized scholarly contacts/approved-member proxy/cache and secure TLS image processor/private media lifecycle.
- Confirmed disposable-account deletion, live cleanup/retention/orphan reconciliation, full database/Auth/Storage/off-device recovery, manual assistive technology and representative load.

Next owner action: privately check account A's already-requested recovery email and, only if received, save the actual link/code/new password through the existing secure PowerShell helper. No secrets in chat or repeated signup. If no receipt, an eligible existing free sender is the prerequisite; no purchase/upgrade is authorized.

No public frontend, remote reset, account deletion or paid resource. Historical checkpoints follow.

---

