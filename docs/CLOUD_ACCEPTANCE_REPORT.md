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

# Current two-user cloud acceptance and privacy repair - 2026-10-13

**NOT PRODUCTION READY.** Current results supersede historical account-B blockers below. Only existing staging `ibxubsegrabpspopdgep` (`biocircuit-staging`, ACTIVE_HEALTHY) was used. No frontend publication, paid resource, migration, RLS/grant weakening, staff assignment, fake phone confirmation or academic approval. The significant product change is a targeted frontend account-transition privacy repair; the visual design is unchanged.

## Executive result

- **152 PASS / 0 FAIL / 2 BLOCKED** in the final actual hosted two-user focused run. [Final evidence](verification/cloud/persistence-2026-10-13T01-44-23-179Z.json). Exit2 deliberately means external acceptance gates remain. It is not production acceptance. A's previously passing complete single-account suite was not restarted.
- **10 PASS / 0 FAIL** in the exact real-service delayed-response reproduction after fixing the client race. [Post-fix evidence](verification/cloud/account-switch-race-2026-10-13T01-41-37-845Z.json). These overlap authentication primitives with the main runner and are not162 unique requirements.
- Full local verification: **58 unit/component tests,122 SQL policy checks (Auth/Storage stubbed),3 Edge tests,47 demo browser regressions**, lint/types/format/build/bundle checks pass; npm audit0 reported vulnerabilities. Four connected recovery-page viewport/axe/overflow checks pass without sending another email or changing any password.
- Fresh Docker-free hosted metadata checks: **19 applied migrations,29/29 exposed tables with RLS,0 client DML grant violations,0 definer search-path violations,3 private buckets,0 unvalidated upload policies,2 enabled Auth triggers**. Four deployed functions ACTIVE with verify_jwt=true. Native Advisors: **0 ERROR /28 WARN**, with limitations below.

## Account preparation, actual registration and sessions

Both DPAPI credential files were readable and the configured addresses differed; values were never printed. Initial A sign-in succeeded; initial B sign-in returned400 invalid_credentials. The local helper only saves credentials and does not create an Auth identity. Original evidence is retained at `verification/cloud/two-user-preflight-before-registration.json`; no claim was made that the generic error proved nonexistence.

After source/credential inspection, one explicit ordinary B signup was attempted using `--register-second-account --cross-user-only`. It returned an actual managed session for an identity different from A, with no phone number/confirmation, not_submitted membership and zero staff roles. No administrative Auth API, invented address, extra test identity or signup-to-login fallback was used. The operator subsequently confirmed that only credentials had been saved and requested ordinary signup once; that one signup was already complete and was not repeated. The123-pass initial two-user run preserved this registration evidence. Subsequent148-pass and final152-pass runs used **existing-account sign-in only**, without the registration flag; browser signup requests were0. Latest preflight points to final actual evidence.

A and B logged in through normal BioCircuit UI in distinct simultaneous browser contexts. Actual managed getUser checked each private session against its expected identity internally. Refresh/settings navigation retained each account's own identity and own profile/preferences. A logout remained signed out on refresh; B retained its independent session, including after A logged back in. Both contexts finally logged out. No email, password, token, cookie, personal ID, private field value, request/response body, screenshot or replay trace from these authenticated journeys was recorded.

## Minimum fixtures, persistence, and cleanup

Only clearly labelled nonclinical **private profile** values and ordinary **own preferences** were written through permitted community_action RPCs. Distinct short generated handles/bios serve as canaries. Each account's own hosted read returned its actual populated profile/preferences; normal UI refresh/navigation/login and separate SDK reads matched them.

Private prior-state snapshots were encrypted with Windows DPAPI under ignored `.cloud/` before fixture writes. The final run restored both A and B profile/preferences through ordinary authorized RPCs and independently verified the restored values in hosted tables. No direct/privileged data repair or remote reset.

The first B signup created a blank profile. The current validated profile RPC cannot restore a blank name/null handle, so that first run retained the clearly labelled **private staging-only B profile** and a default preferences row. This is explicitly recorded in the initial123-pass report. Later runs restore that valid baseline. It is not academic verification or user-created data destruction; the original encrypted baseline remains local.

## Proven cross-user boundaries vs limited evidence

| Actual hosted check | Observed result | Scope |
| --- | --- | --- |
| A reads B private profile/preferences and B reads A | Owner READ200,1 populated row; other-user READ200,0 rows | **Populated bidirectional RLS isolation verified** |
| Anonymous known populated A/B private profiles |200,0 rows | Private profiles hidden from anonymous caller |
| Direct foreign member URL through actual browser |Profile unavailable, hosted filtered profile response, current managed identity unchanged | No peer private profile rendered |
| Snapshot caller rows and peer rows |Own private profile/preferences present; peer absent | Actual hosted DTO isolation |
| Search for known peer private handle |Hosted response excludes peer | Private unapproved peer not discoverable; not a claim of full scholarly/member search |
| Cross-account direct writes: profiles/preferences/notifications/bookmarks/applications/roles/avatar/image metadata |42501 denial | Server DML grant protection; protected empty-row cases are not populated object isolation |
| Forged profile/preferences target fields through allowed RPC |Caller operation accepted; every victim profile field and preference canary unchanged | Server derives actor from auth.uid; this correctly need not return an error |
| Phone/membership flag direct write |42501, unchanged false/not_submitted values only | No elevated flag value attempted or assigned |
| Staff-role insert |42501 before constraint, invalid role value | No valid privileged role assigned |
| Unverified application/project/post/comment/reaction/bookmark/review/suspend calls |42501 | Honest membership/staff restrictions for both ordinary identities |
| Restricted project direct DML |42501 | Private project row itself has no legitimate fixture |
| Read-only privileged cleanup/health RPCs |42501 | No maintenance privilege; destructive retention was not executed |
| Export |Caller profile/preferences IDs match internally; foreign selector rejected by RPC signature | Actual own export, no cross-account identity parameter |
| Valid tiny synthetic direct Storage uploads to foreign prefixes in academic-evidence/project-files/avatars |403 denial, upsert=false | Actual native Storage INSERT boundary; no object persisted or overwritten |
| Tampered sub/service-role JWT |401 | Signature/privileged-claim forgery rejected; no trusted staff session fabricated |
| Deletion with KEEP and forged target |400, identities still present | Non-destructive confirmation guard only; never sent final DELETE |

The runner checks the **owner's fixture row count before other-user reads**. Profiles/preferences were populated. Notifications, bookmarks, membership applications/marks, roles, avatars and project images were empty; their peer reads are explicitly **LIMITED - EMPTY FIXTURE**, not privacy passes. Known private project/member/image fixtures, staff roles and real unread notification transitions cannot be created legitimately by these unverified/unapproved accounts. Both broad protected-fixture and authorized-member/source-positive gates remain blocked. No seed, fake qualification or verification bypass was inserted to force positives.

## Verified defect and smallest coherent repair

[Actual failure](verification/cloud/account-switch-race-2026-10-13T01-38-43-580Z.json) retained: managed session stayed B, but displayed private workspace was A. Three genuine hosted A snapshot responses were deliberately delayed across normal UI B sign-in, then released. The test used SPA navigation and bounded relevant API completion, not demo data or a global networkidle assertion. The delayed payload came from authorized A requests; direct B-to-A backend reads remained denied. This was a **frontend stale-response privacy defect**, not a claimed RLS failure.

Two earlier diagnostic attempts timed out before B login because the initial harness delayed only one request. They are retained (`01-34-27`, `01-36-37`) as incomplete diagnostics and are not privacy passes. Holding all initial A requests produced the precise eight-pass/one-failure evidence above. Test global-reference lint errors were corrected without weakening assertions.

`src/data/useCommunity.ts` now:

- synchronously clears private snapshots, identity, search results, cursors, messages and busy state on managed Auth transitions;
- invalidates earlier-account work with an Auth epoch, and older loads with a request generation;
- guards snapshot, mutation, detail, search, pagination, reply and discovery completions/errors so old results cannot repopulate the next account;
- invalidates outstanding work on unmount and clears superseded Auth timers.

Five isolated regression tests cover late initial data, failed anonymous reload, stale detail/discovery, same-query search and late mutation completion. They are **local tests only**. The exact original live race now passes10 checks; the full152-check two-user flow was rerun after the repair. No backend/client identity flags or authorization model changed. No new library or dependency upgrade was needed.

## Remaining free integrations and operations

Current hosted Email=true/email confirmation disabled; Phone=false/phone autoconfirm=false. Staging confirmation-disabled email signup does **not** prove mailbox ownership. Prior real renewal/export evidence remains valid, and both users' own exports were exercised here.

Recovery implementation still requires a genuinely delivered code and successful managed exchange/reset. Its connected UI passed1440x900,1024x768,390x844,320x700 again, with axe0/overflow0/console0/uncaught0/Auth requests0. No new recovery email was sent, no code guessed, and no password changed. Reviewed `supabase/templates/recovery.html` is ready, but remote code-template/SMTP configuration and mailbox access have not been verified. The CLI works for supported Management API database/metadata commands; no Management API token was present in the process environment or documented fallback file. No native credential-store export was attempted to bypass that setup.

Secret-name inspection again found only ALLOWED_ORIGIN among required contact/processor names; no values/digests recorded. Crossref/PubMed Edge responses remain429 from the membership gate; missing processor remains503. Prior direct upstream200 evidence is **provider connectivity only**, not actual app source/cache acceptance. Legitimate operator contacts and approved membership are needed; a private sign-in address was not repurposed as a public source contact. Previously evaluated free WASM processing was not adopted without resource/quality/security evidence. No paid API, SMTP subscription, SMS trial, image hosting resource or plan upgrade.

Native CLI operational checks required supported `--linked --project-ref ibxubsegrabpspopdgep` Management API mode. Initial attempts without that mode failed and are not pass evidence. Successful queries ran BEGIN READ ONLY/ROLLBACK and inspected system catalogs/migration metadata only. No user records, password hashes, database URLs or credentials were dumped; no migration push/reset.

Advisor warnings:10 authenticated security-definer entry points (intentional protected RPCs, reviewed/tested ordinary negatives; scoped staff positives remain open),17 RLS initplan performance warnings,1 disabled leaked-password protection warning. [Official password security](https://supabase.com/docs/guides/auth/password-security) places managed leaked-password protection on Pro and above. **No paid protection was enabled; it remains a known risk**, not a fixed feature. Strong unique credentials/client validation are not a replacement server breach filter. Free server password/rate/CAPTCHA configuration must be reviewed before public release. No full-volume load/independent penetration test is claimed.

Hosted backup/restore, retention/cleanup scheduling, signed object expiry/revocation/compensation, delivered reset, positive deletion and privileged human review remain unverified. Source recovery copies and encrypted test baselines are not database/Auth/Storage disaster recovery. Positive deletion needs an explicitly disposable authorized identity; A/B were preserved.

## Commands and exact current checks

| Command / check | Actual result |
| --- | --- |
| `node scripts/test-staging-persistence.mjs --cross-user-only --register-second-account` |123 pass/0 fail/2 blocked; one explicit ordinary B signup |
| `node scripts/test-staging-persistence.mjs --cross-user-only` |148 pre-fix expanded checks; final152 post-fix pass/0 fail/2 blocked, exit2 |
| `node scripts/test-staging-safe-boundaries.mjs` |17 initial A safeguards pass, before B was registered |
| `node scripts/test-staging-account-race.mjs` | Two incomplete readiness diagnostics; actual privacy failure8 pass/1 fail; after repair10 pass/0 fail |
| `node node_modules/vitest/vitest.mjs run tests/account-transition.test.tsx` |5 targeted regressions pass |
| `node node_modules/vitest/vitest.mjs run` |58/58,13 files |
| `node scripts/test-db.mjs` |122/122, local PostgreSQL/PGlite with Auth/Storage stubs |
| Deno HTTP test / four Edge entry checks |3/3; four typechecks pass |
| `node node_modules/@playwright/test/cli.js test` |47/47,5.5m; labelled demo UI/a11y/interaction regression only |
| `node scripts/test-recovery-staging.mjs` | Four connected viewports pass; no valid Auth request/recovery delivery claim |
| ESLint `src scripts tests`, `tsc -b`, Prettier check |Pass after repairing diagnostic globals and formatting |
| Public config, Vite production build, bundle guard |Pass; initialJS gzip121986 bytes, CSS gzip9993; SDK dynamic chunk remains additional |
| `npm.cmd audit --audit-level=moderate` |0 reported vulnerabilities; not complete security assurance |
| `node scripts/smoke-production.mjs` |Fail-closed setup=true, synthetic fallback=false, remote requests0, uncaught0; local FCP208ms/LCP248ms/CLS0.00238, not connected-field performance |
| CLI projects/functions/secret-name inventories |Exact healthy staging; four active JWT functions; contacts/processor unconfigured |
| CLI `db query --linked --project-ref ... --file supabase/tests/cloud-catalog-api.sql` and read-only ledger query |29/29 RLS,19 migrations; grants/paths/upload-policy checks pass |
| CLI `db advisors --linked --project-ref ... --type all --level warn` |0 error/28 warnings retained |
| Backend/package fingerprint and diagnostic privacy scan |30 original protected files unchanged; current scan evidence records counts/findings |

No new authenticated screenshots/traces were captured. Previously inspected visual design is preserved; current demo browser checks and anonymous recovery captures are separate evidence. No Git repository, branch or commit; no reset/commit/push.

## Files and next best action

Changed `src/data/useCommunity.ts` and `scripts/test-staging-persistence.mjs`. Added `tests/account-transition.test.tsx`, `scripts/staging-boundaries.mjs`, `scripts/test-staging-safe-boundaries.mjs`, `scripts/test-staging-account-race.mjs`; updated the three cloud/release reports and setup/security/build/free-plan notes; retained sanitized JSON histories. No original source files deleted; no dependency/lockfile/migration/Edge source changes.

**B is now registered and usable. Do not register it again.** Repeat focused acceptance with `node scripts/test-staging-persistence.mjs --cross-user-only`; repeat the adverse timing check with `node scripts/test-staging-account-race.mjs`.

Next free external action: in the confirmed staging dashboard, install the reviewed recovery-code template in Authentication -> Email templates -> Reset password; ensure the exact loopback redirect and a permitted free sender, then privately use the real received code through `/account/recovery`. Default sender restrictions are documented in [FREE_RELEASE_PLAN.md](FREE_RELEASE_PLAN.md). Do not paste codes/credentials into chat or buy an SMTP/SMS plan. This does not close the real phone/academic/member/staff, private image or operational recovery release gates.

---

> Final preservation/privacy evidence:30 original backend/config/package fingerprinted files unchanged;13 new sanitized JSON results scanned with0 private-field/UUID/token pattern findings. Current source preflight passed and copied128 allowlisted files to ignored `.cloud/backups/2026-10-12T17-33-06-848Z`. This is source recovery only, not hosted data/Auth/Storage backup or exhaustive secret detection.

> Final verification: existing **47/47 demo browser tests** passed (5.1m). Production missing-configuration smoke passed: setup-required=true, synthetic fallback=false, remote backend requests0, uncaught0, FCP480ms/LCP572ms/CLS0.00238 on an unthrottled local preview; not hosted-feed performance.

## Current checkpoint: free staging persistence and recovery ? 2026-10-12

**NOT PRODUCTION READY.** This checkpoint supersedes historical credential/persistence blockers below only for the explicitly tested scope. Staging identity was rechecked through authenticated CLI inventory: exact reference `ibxubsegrabpspopdgep`, name `biocircuit-staging`, ACTIVE_HEALTHY. No project, billable resource, frontend deployment, migration, RLS/grant change, phone flag, academic approval or staff role was created.

### Real hosted results

- [Final persistence evidence](verification/cloud/persistence-2026-10-12T17-18-14-948Z.json): **47 PASS, 0 FAIL, 3 BLOCKED**. Runner exit **2** explicitly denotes external blockers, not a successful full release. Existing controlled account A used ordinary sign-in; registration was not repeated. Both profile and preference restoration were independently read back from hosted tables.
- Profile name/handle/bio/private visibility and in-app preference changes were written through connected UI/RPC, then verified after refresh and logout/login in a new browser context and by separate SDK hosted reads. Notification-category updates persisted; invalid profile/category inputs left prior values intact. Duplicate request IDs did not overwrite the original profile; reusing a receipt for another action failed.
- Live snapshot, indexed search and project discovery were allowed. Own notifications/bookmarks/applications/image metadata returned empty results under policy; these are **not populated isolation evidence**. Mark-notifications-read was accepted, but no actual unread fixture existed.
- Application/post/comment/reaction/bookmark/project/review/suspend/moderation and service maintenance/health RPCs were correctly denied for the unverified/unapproved ordinary account. Direct DML, unchanged identity-flag writes and an invalid-role INSERT were denied with 42501. No valid privileged role or elevated verification value was attempted.
- Anonymous access to A's **known populated private profile** returned zero rows. Bidirectional A/B access is **BLOCKED**: the user confirmed no second controlled account is configured. No alternate identity, academic/private-project fixture or role was fabricated.
- [Auth lifecycle](verification/cloud/auth-lifecycle-live.json): **6 PASS, 0 FAIL**. Managed refresh returned a real renewed session for the same identity; own export included the caller's actual profile/preferences; immediate repeat export was rate-limited; anonymous export denied. Phone remains absent/unconfirmed, membership unapproved, staff roles absent.
- The actual recovery request returned HTTP200. This proves request acceptance only: **delivery, mailbox ownership, valid recovery-code exchange and successful live password reset remain unverified**. No password was changed or recovery code logged.
- Authenticated scholarly Crossref/PubMed Edge calls returned the current expected429 membership gate. This is neither provider success nor a proven exhausted rate budget. Missing image processor returned503. [Secret-name inspection](verification/cloud/phase2-integration-config.json) found only ALLOWED_ORIGIN among the required operator contacts/processor keys; values were never read into reports.
- [Public upstream probe](verification/cloud/scholarly-upstream-connectivity.json): Crossref and PubMed each returned200 with real title/identifier metadata. These direct free bibliographic requests **do not establish application proxy/cache/approved-member acceptance**.

### Repairs and retained history

Timestamped persistence results were retained: 16:52 (5 passes, one UI timeout), 16:55 (6 passes, preference interaction error), 17:02 (43 passes, Edge401 failure), 17:05 (47 passes, no failed checks), final17:18. The UI checkbox is controlled by server-loaded state: the harness now clicks normally, waits for the real hosted response, then retries the checked-state assertion within15 seconds. Backend persistence assertions remain intact. First-run timeout is retained without inventing a specific cause. The first new recovery UI probe captured no viewports after a late snapshot observer failed; registering the bounded response wait before navigation repaired the harness, with all four final viewports passing. The return-link label was corrected to Return to feed. Final screenshot inspection found the recovery action too close to the 320px bottom navigation; the setup notice was shortened without changing its honest delivery state. All four connected viewport checks passed again, now including a geometric assertion that the action is fully above visible mobile navigation. Lint/types/build/bundle were rerun; the final 320px screenshot was opened and inspected.

The independent SDK session was rejected by managed getUser after browser global logout (HTTP400). Fresh ordinary sign-in restored managed identity and reached the Edge handler. [Sanitized Edge probe](verification/cloud/edge-auth-diagnostic.json) verified ES256/current-user handling/exact CORS. No JWT check, RLS or current-user authorization was disabled.

Original blank profile fields cannot be restored by the validated profile RPC. The early accepted write therefore retained a clearly labelled **private staging-only profile**, documented in16:55 evidence. Subsequent runs restore their valid prior profile/preference values and confirm them with hosted reads. Encrypted baseline snapshots are under ignored `.cloud/`; no bypass/direct privileged cleanup was used. A newly initialized default preference row may remain where no permitted delete operation exists; final run used an existing row.

### Implemented recovery and zero-cost decisions

Added lazy `/account/recovery` and the sign-in recovery link, managed reset request, expiring-code verification via `verifyOtp(type: recovery)`, matching managed identity before password update, confirmation/visibility/loading/error/cooldown states and post-update sign-out. No URL token auto-login, simulated recovery, custom OTP store or new dependency. Recovery state/code/password remains in component memory; refresh requires a fresh recovery flow. Unit tests cover invalid code, malformed email, mismatched confirmation and session identity switching. CAPTCHA enabled remotely remains enforced by Auth; no challenge bypass is implemented.

A reviewed code-email template is at `supabase/templates/recovery.html`; **hosted template/SMTP installation has not been performed**. Default Supabase sender restrictions and the candidate free SMTP path are documented in [FREE_RELEASE_PLAN.md](FREE_RELEASE_PLAN.md). No SMTP account, paid trial, credit card or subscription was activated. Phone OTP remains unavailable: no suitable sustainable free SMS delivery has been verified; email recovery/TOTP cannot substitute for phone ownership.

Evaluated Apache-2.0 magick-wasm0.0.44 in Deno's isolated cache, without changing package/lock files. Local synthetic9MP JPEG processing took1882ms for avatar and5195ms for project output; project PNG was11477025 bytes, above the existing5MB limit. These are local synchronous wall-time/RSS measurements, not hosted CPU acceptance. The current guarded Sharp/TLS processor path was preserved; WASM was **not adopted or deployed** without adversarial and hosted resource evidence.

### Current checks and browser inspection

- ESLint and TypeScript build: pass after fixing the new runner's window.innerWidth reference.
- Vitest: **53/53** (12 files); PostgreSQL/PGlite: **122/122**, Auth/Storage stubbed; Deno HTTP: **3/3**; four Edge entries typecheck.
- Production Vite build and public configuration/bundle guards: pass. Initial JS gzip121802 bytes, CSS gzip9993 bytes; recovery is a lazy1853-byte gzip chunk. Zod annotation-removal warnings are retained, not errors.
- npm audit: **0 reported vulnerabilities**; this is not complete security assurance. Prettier: pass. DPAPI helper PowerShell parser:0 errors after repairing scoped-variable interpolation.
- [Connected recovery UI](verification/cloud/recovery-ui.json):1440?900,1024?768,390?844,320?700; public snapshot200, axe0, horizontal overflow0, console0, uncaught0, Auth requests0. Four screenshots captured under `docs/screenshots/staging/recovery/`; desktop1440 and mobile320 screenshots opened and visually inspected. Screenshot inputs are blank; no private account screenshots/traces were captured.
- Existing47-test demo browser suite and production smoke results are recorded below when completed; these never count as hosted persistence evidence.

### Exact next external actions

1. In a trusted local terminal run `powershell -NoProfile -File scripts/set-staging-email-credentials.ps1 -Account B` and enter a **different email you control** and unique password privately. Do not paste them into chat. For a new B identity, run `node scripts/test-staging-persistence.mjs --register-second-account`; for an existing B, omit that flag. Ordinary signup remains explicit and separate from login. The helper refuses accidental overwrite and uses Windows DPAPI; no Auth admin API is used.
2. To validate recovery, configure the reviewed recovery-code template and exact loopback redirect in staging Auth, with an approved free SMTP sender if the default team-address restriction is unsuitable. Then request/enter the genuinely received code through `/account/recovery`. Keep credentials/codes private. Do not change A's password without updating its DPAPI file privately.
3. Approved-member, actual academic review, populated bookmarks/notifications/private projects/storage lifecycle require genuine phone confirmation and authorized human review. This gate remains unresolved under the zero-cost constraint; it must not be cleared by changing identity flags.
4. Provider proxy success requires legitimate operator CROSSREF_MAILTO/NCBI_EMAIL and approved membership. Private image hosting, live cleanup/expiry/revocation, retention and hosted backup/restore remain unverified. No remote reset/destructive rehearsal is authorized.

### Important files changed

`scripts/set-staging-email-credentials.ps1`, `scripts/staging-private.mjs`, `scripts/test-staging-persistence.mjs`, `scripts/diagnose-staging-edge.mjs`, `scripts/test-staging-auth-lifecycle.mjs`, `scripts/test-recovery-staging.mjs`, `src/features/Recovery.tsx`, `src/features/EmailAuth.tsx`, `src/Workbench.tsx`, `tests/recovery.test.tsx`, `supabase/templates/recovery.html`, the three cloud/release reports, setup/security notes, free-release decision log, sanitized JSON evidence and anonymous screenshots. No source files deleted. No dependency/lockfile changes or Git commit; no Git repository exists.

### Commands actually executed

`node scripts/test-staging-persistence.mjs` (iterative timestamped results, final exit2); `node scripts/diagnose-staging-edge.mjs`; `node scripts/test-staging-auth-lifecycle.mjs`; `node scripts/test-recovery-staging.mjs`; `node node_modules/eslint/bin/eslint.js src scripts tests`; `node node_modules/typescript/bin/tsc -b`; `node node_modules/vitest/vitest.mjs run`; `node scripts/test-db.mjs`; `deno test --allow-env=ALLOWED_ORIGIN,SUPABASE_URL,SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY supabase/functions/http_test.ts`; `deno check` the four deployed entry files; `node scripts/check-config.mjs`; `node node_modules/vite/bin/vite.js build`; `node scripts/check-bundle.mjs`; `npm.cmd audit --audit-level=moderate`; `node node_modules/prettier/bin/prettier.cjs --check src scripts tests supabase/functions *.json *.ts *.js`; `node node_modules/@playwright/test/cli.js test`; `node scripts/smoke-production.mjs`; `node --experimental-strip-types scripts/evaluate-ranking.mjs`; CLI project/secret-name listings; PowerShell parser checks; isolated-cache WASM probes and two public scholarly HTTP probes. No migration/deployment/reset command was repeated.

---

# Cloud acceptance report

## Current live session repair - 2026-10-12

**SESSION TEST REPAIRED AND LIVE VERIFIED. NOT PRODUCTION READY.** Resumed the existing staging account on `ibxubsegrabpspopdgep`; no account was registered again. The original `verification/cloud/email-auth-live.json` now contains genuine registration/session/profile/role and first-six-route successes from the user's intervening run. Earlier statements below that credentials/account tests were unavailable are historical and superseded by this section. The original report was left byte-for-byte unchanged and copied to `email-auth-live-initial-registration-failure.json`.

### Inspection and precise failure evidence

Inspected the current runner, original actual report, route dispatch/navigation, Auth modal/email forms, session adapter, Account/Avatar/Trust components and latest acceptance/release reports before running again. No Git repository exists. Compared 121 source fingerprints with the prior manifest: the only source difference from this repair is `scripts/test-email-staging.mjs`; application routes, styles, Auth client, original 19 migrations and all Edge/security files remain unchanged. Existing DPAPI credential file was available and read only inside the test process, never printed/copied into reports.

First changed-run diagnostic used explicit existing-account UI sign-in and retained the old networkidle strategy. It failed with **TimeoutError**, **route `/profile`**, **step `wait-for-networkidle`**, no allowlisted error code. Session before/after navigation **true/true**, expected profile content **true**, core requests **HTTP200**, uncaught exceptions **0**. Result: **5 passes / 1 failure**, exit1. This identifies a readiness-wait failure, not lost authentication, a missing route, backend core-data permission denial or an incorrect claim that registration failed. We did not infer which unrelated activity prevented global network quiet.

Two avatar function reads returned404 in that diagnostic. The existing handler returns404 when no authorized avatar row is available. A later actual current-user metadata query returned **HTTP200, hasAvatar=false, code=null**, confirming this account's empty-avatar state. No processor upload, signed image link or storage success is claimed. The diagnostic had2 resource console errors from those404s and no uncaught exception; this differs from the final bounded route run's zero console errors.

Initial diagnostic: `verification/cloud/email-auth-diagnostic-2026-10-12T13-59-45-169Z.json`, `docs/session-diagnostic-initial.log`. It records only route/step, allowlisted class/code, booleans and API-path/status metadata, never raw exceptions, request/response bodies, credentials, cookies, personal identifiers or private user records.

### Smallest verified fix

Added explicit **--resume-existing-account**: normal UI email sign-in using the existing privately supplied account; no registration, duplicate-signup/negative-signup calls, profile/preferences fixture writes, verification-flag attempts, new identities, staff grants, deletion or Auth admin API. Registration remains separately available with the default new-account mode. A failed signup is never silently converted to a passing login.

Replaced global networkidle as the default with bounded **15-second** route readiness: expected static content visible, main loading state finished, successful community_snapshot/recommended_page/trust_metadata/milestone-confirmations/managed-user responses, exact route path, no community-load error or REST permission/server error, persisted session still present, and actual managed getUser confirms the same original account. Kept session/backend assertions and added explicit profile phone/academic labels and Trust denial behavior. Corrected direct-refresh sequencing so `/profile` is actually visited before refreshing it.

The optional --diagnose-networkidle retains the old wait solely for deliberate diagnostic reproduction. --route-ready-wait remains compatible; default resume no longer requires that extra flag. Exact currentRoute/currentStep labels identify navigation, each session/content/API assertion, refresh, logout and relogin. Results use timestamped filenames and preserve all prior evidence. HTTP paths are filtered to safe API shapes without query values/IDs; unknown paths are categorized. Error classes/codes are allowlisted; only counts and safe booleans are reported.

This follows official [Playwright waitForLoadState guidance](https://playwright.dev/docs/api/class-page#page-wait-for-load-state), which recommends readiness assertions rather than networkidle for tests. The decisive reason for this change is the actual live diagnostic above; no routing/Auth/backend/security redesign was needed.

### Actual hosted verification

Final command:

```powershell
node scripts/test-email-staging.mjs --resume-existing-account
```

**Exit0,20 PASS / 0 FAIL**, actual connected staging browser + managed SDK, not demo/mocks. Final result: `verification/cloud/email-auth-diagnostic-2026-10-12T14-10-01-453Z.json`, `docs/session-resume-final.log`.

| Actual check | Result / evidence |
| --- | --- |
| Existing-account normal UI sign-in | Managed token endpoint200; actual session, managed user validated |
| Account/profile/role boundary | No phone/phone confirmation; profile phone_verified=false, membership=not_submitted, suspended=false; role count0 |
| `/profile` | Expected own-profile content, phone not verified/academic not_submitted labels, same verified session and successful core APIs |
| `/saved` | Saved-content screen loaded; same verified session/core APIs; no bookmark write inferred |
| `/notifications` | Notifications screen loaded; same verified session/core APIs; no notification write inferred |
| `/settings` | Settings screen and actual logout control loaded; same verified session/core APIs |
| `/trust` | Expected denied-access message for this unstaffed account, no role granted; same verified session/core APIs |
| Direct browser refresh on `/profile` | Session restored, expected content and successful APIs; managed getUser confirms same account |
| UI logout then direct refresh | Logout204, local session absent; refresh stays signed out |
| UI sign-in again then `/settings` refresh | Token endpoint200; actual same managed user/session restored after refresh |
| Final UI logout | Logout204, browser persisted session absent |
| Current-user avatar metadata | HTTP200, no avatar row, no private path/identifier recorded |
| Browser counters during bounded test | **0 console errors,0 uncaught exceptions,0 signup requests**, no exception class recorded |

Final browser HTTP counts: public_snapshot200 x6; token200 x2; managed user200 x31; community_snapshot200 x31; recommended_page200 x31; trust_metadata200 x31; milestone_confirmations200 x31; logout204 x2. Per-route evidence records session true before/after, expected content true and response statuses. These counts are transport observations, not published-content writes or time-based refresh-token-expiry testing.

Intermediate bounded run passed 19 checks (exit0) in `email-auth-diagnostic-2026-10-12T14-02-51-430Z.json`; final default-mode verification first passed 19 in `email-auth-diagnostic-2026-10-12T14-05-31-895Z.json`. Added the actual own-avatar lookup and precise profile/Trust assertions before the final 20 pass run. Registration was never replayed: final signupRequests=0. The already-passing first six route-acceptance assertions were not repeated; /feed is used only as the normal UI sign-in entry.

### Commands, preservation and release scope

- `npm.cmd exec -- prettier --write scripts/test-email-staging.mjs`, `npm.cmd run lint`, `npm.cmd run format:check`: final exit0. Logs: session-runner-format/lint/format-check.log.
- Initial diagnostic resume exit1 was retained; evidence-based bounded resume and final default resume exit0 as above. Each completed live report is separate, original preserved byte-for-byte.
- No full local unit/demo/SQL/build/Edge suite was repeated: only a test runner changed, application/schema/handlers/dependencies stayed unchanged, and their previous passing evidence is historical. The new actual live checks and affected static checks are current evidence.
- Files changed: test runner and current documentation; added timestamped diagnostic JSON, original-report preservation copy and ignored execution/source-recovery logs. No existing source deleted. No Git commit, Docker, frontend publication, paid resource, production change, migration/function deployment or remote database mutation.
- No screenshots/traces/HAR or storage dumps were taken for this session repair; private identity/credential/session values remain outside evidence. Existing original screenshots/user files were preserved.

Final review: four timestamped diagnostics scanned, **0 forbidden credential/identity fields and 0 credential/email/UUID pattern findings**; original evidence byte-preserved and all **27 migration/Edge source files unchanged**. Conservative review only, no private credential file inspected by this scan. Evidence: `verification/cloud/session-repair-review.json`. Error-code allowlisting was then centralized for future record fields; affected lint/format checks passed without unnecessarily repeating the successful live flows.

There is **no remaining blocker for the requested remaining-route, refresh, logout and relogin acceptance**. Genuine original registration is verified by the preserved user's run; this repair verifies existing-account lifecycle. Remaining release gates include actual permitted profile/preferences/export persistence beyond read-only session smoke, real invalid/duplicate credential cases, populated cross-user private isolation, SMS/academic review/approved-member/staff-positive workflows, token expiry/recovery/global-revocation adverse cases, scholarly contacts/providers, image processor/private-object lifecycle and operational recovery/previous Advisor findings. None were relabeled complete.

**Next action for repeating only session acceptance:** use the exact --resume-existing-account command above with the existing private credential file; do not register this account again. No new setup is required for that command. Wider release work must respect current phone/academic/role restrictions; email still grants no phone confirmation, academic approval or staff role.

---

## Previous free-email implementation checkpoint - 2026-10-12

**Email/password UI is implemented; real-account acceptance is BLOCKED pending controlled private credentials. NOT PRODUCTION READY.** Continued in the existing project and preserved the social-first visual design, all 19 migrations, four deployed Edge Functions, RLS/grants and academic/phone/role restrictions. No remote database or Auth setting was changed by the agent in this extension. No account, phone number, verification timestamp, academic approval, staff role or successful persistence was fabricated. No Docker, paid service, frontend publishing or production change.

### Actual hosted configuration

Existing public config was guarded against exact staging target `ibxubsegrabpspopdgep`, connected mode and the existing public publishable key; values were never printed. Actual GET `/auth/v1/settings` returned **HTTP200**, `external.email=true`, `mailer_autoconfirm=true` (email confirmation disabled), `disable_signup=false`, `external.phone=false`, `phone_autoconfirm=false`. This verifies the user's saved Email settings. It does not prove registration or email-address ownership. Evidence: `verification/cloud/email-auth-settings.json` and `email-auth-live.json`. Existing ignored public env file was not rewritten.

Reviewed Auth, managed-client/session configuration, gateway/useCommunity, routes, profile validation/editor, existing tests and actual SQL trigger/policy/RPC paths. Installed supabase-js 2.117.3 supports the official `signUp`/`signInWithPassword` APIs; no dependency upgrade was needed. [Password Auth guidance](https://supabase.com/docs/guides/auth/passwords), [signUp reference](https://supabase.com/docs/reference/javascript/auth-signup), [password sign-in reference](https://supabase.com/docs/reference/javascript/auth-signinwithpassword).

### Implementation and preservation

- Added reusable EmailAuth forms inside the existing account dialog. Valid email, unique registration password 12-128 characters, compatible existing-password login, accessible show/hide toggle, loading/disabled/in-flight duplicate prevention, generic invalid-credential/duplicate-account/transport/rate/CAPTCHA errors, and explicit no-session confirmation handling. Passwords are not trimmed, printed or saved in drafts. No connected demo fallback.
- Login/register navigation clears the password and returns the native dialog to the beginning, fixing the screenshot-observed narrow-phone scroll position. Reused existing actions typography/colors/layout to preserve design and the strict CSS budget.
- Existing managed SDK persistSession/autoRefreshToken and Auth-state reload subscription were retained. Existing Settings logout/global-revocation controls remain intact. Actual signed-in restoration/logout is not claimed verified without real credentials.
- Existing phone OTP remains in its own details section with current challenge requirements. Email users are shown phone **Not verified** once their actual profile exists; academic submission is unavailable until genuine phone confirmation. No academic fields/marks are requested from phone-unverified users. Existing verified/demo onboarding remains intact.
- New-account profile editor normalizes the database's actual nullable handle to an empty controlled input. Existing server-safe profile RPC is unchanged.
- Added an ignored Windows-DPAPI credential intake workflow and a guarded real-account acceptance runner. The interactive prompt was syntax-checked, not invoked. Its password is Windows-user encrypted; email remains private personal data. No actual credential file currently exists.

Important files created: `src/features/EmailAuth.tsx`, `tests/email-auth.test.tsx`, `scripts/set-staging-email-credentials.ps1`, `scripts/test-email-staging.mjs`, `scripts/test-email-auth-ui.mjs`. Existing source modified: `src/features/Auth.tsx`, `src/features/Account.tsx`, `src/domain/validation.ts`, `src/styles.css`. Updated required reports plus SETUP/CLOUD_SETUP. No source deleted, dependency or lockfile changed. Original migrations/Edge handlers/security behavior remain unchanged. No Git repository/commit.

### Real-account status - no fabricated integration pass

Executed `node scripts/test-email-staging.mjs`: **exit2**, actual hosted settings PASS and controlled-email/password prerequisite BLOCKED. No valid signup/password request, account creation, sign-in/out, authenticated browser session or successful authenticated API operation was performed. The asynchronous request for a controlled email received no response, and no private local credential file was supplied. The agent cannot infer an email address the user controls or put a password in chat.

The prepared runner uses private credentials only in memory, refuses an unexpected target/Auth setting/occupied loopback port, registers through the actual UI, checks session/refresh/logout/re-login, and probes own profile/preferences/snapshot/notifications/export plus member/staff/service-only denials and invalid/duplicate/malformed/short-password cases. **These account probes are implemented but NOT EXECUTED.** It never approves academics, sets phone flags, assigns staff roles or deletes accounts. A filtered empty other-user query is limited evidence; a separate actual private test identity/populated fixtures remain required for full two-user isolation.

### Actual connected browser and screenshot evidence

`node scripts/test-email-auth-ui.mjs` final **exit0** at **1440x900,1024x768,390x844,320x700**: login/register navigation, password toggle, local malformed-email/short-password validation, native dialog scroll/reachability and refresh of anonymous feed worked. **0 axe violations, no horizontal page overflow, 0 console errors, 0 uncaught errors, 16 actual public_snapshot HTTP200 responses, 0 signup/token requests.** At320px, the existing Open navigation -> Account control is used; it is not a missing route or broken button. This is real connected anonymous UI validation, not real registration.

Captured eight fresh screenshots: `docs/screenshots/staging/email-auth/{login,register}-{1440,1024,390,320}.png`. Final screenshots actually opened/inspected: login1440,register1440,login390,register320. Initial desktop/mobile captures revealed password-control vertical mismatch, touching action buttons and mode-switch scroll position; fixed, recaptured and inspected. Native vertical dialog scrolling intentionally exposes controls below narrow first viewports.

Browser-harness failures were repaired without weakening assertions: axe required explicit browser.newContext; desktop-only account selector failed on mobile; narrow320 needs the existing navigation drawer. Initial selector errors retained in `email-ui-initial-{mobile,narrow}-selector.log` and axe diagnostic in `email-ui-debug.log`. Final evidence: `verification/cloud/email-auth-ui.json`, `docs/email-ui-final.log`.

### Tests actually executed

| Command | Actual result / scope |
| --- | --- |
| `npm.cmd run check` | Final exit0: lint, TypeScript, **49 unit/11files**, **122 local SQL assertions**, production build8.59s. Local Auth/Storage stubs are not actual account tests. |
| `npm.cmd run test:e2e` | **47passed,4.2m**, existing isolated **demo** browser regressions; not live persistence/session evidence |
| `npm.cmd exec -- vitest run tests/email-auth.test.tsx` | **7passed**,2.88s after class/style reuse; isolated Auth mocks clearly labeled unit fixtures |
| `npm.cmd run build` | Final post-budget-repair exit0, TypeScript included; **8.40s**, `email-build-final.log` |
| `npm.cmd run check:bundle` | Final exit0: entry JS**121719 gzip bytes**, CSS**9993 gzip bytes**. Original180kB/10kB assertions retained. |
| `npm.cmd run lint` / `format:check` | Final exit0, including secure runner guards |
| `npm.cmd run typecheck:edge` / `test:edge` | Exit0, all four handlers; **3 tests / 0 failures,71ms**, handlers unchanged |
| `npm.cmd audit` | Exit0, **0 reported vulnerabilities**; no security certification implied |
| `npm.cmd run test:production` | Exit0: no-config setup-required, no demo fallback/remote request/uncaught error. Local unthrottled FCP232ms/LCP272ms/CLS0.002377, not production performance. |
| `node scripts/test-email-auth-ui.mjs` | Final exit0; actual anonymous connected UI/four sizes/16HTTP200/axe0/console0, no account created |
| `node scripts/test-email-staging.mjs` | Exit2: saved actual Email settings verified, real-account acceptance blocked by missing private credentials |
| PowerShell Parser.ParseFile on credential prompt | 0 syntax errors; interactive credential collection NOT EXECUTED |

Initial new-harness lint errors (bare innerWidth, unused credential reassignment) were fixed and rerun. The first bundle check measured10036 CSS gzip bytes; CSS reuse reduced it to 10008, then redundant declarations were removed to reach 9993. No budget was raised, test removed or assertion weakened. Non-fatal installed Zod Rollup annotation warnings remain. Logs: ignored `docs/email-*.log`; initial errors/overage retained. The full49 test/47 demo suites passed before the final CSS-only budget cleanup; affected unit/static/build/connected browser checks were repeated afterward.

### Final source and artifact review

Compared all **19 original migration files and eight Edge/shared/config/test files** with the prior recovery fingerprints: **0 changes**. Evidence: verification/cloud/email-auth-preservation.json. Fresh frontend artifacts and the three required reports: **20 files,0 privileged-key/PAT/private-key/service-role-JWT pattern findings**; this conservative scan is not exhaustive security assurance. Evidence: verification/cloud/email-auth-artifact-scan.json. Final cloud:preflight exited0, copied **121 allowlisted files** to .cloud/backups/2026-10-12T04-39-49-691Z with the19migration hashes. Actual env/session/credential files and the new PowerShell prompt helper are outside that source-copy allowlist; the helper remains in scripts. This is source recovery, not a hosted data/Auth backup. No Git initialization or commit.

### Policy distinctions and exact next action

Source-reviewed expectations, **not actual newly authenticated passes**:

| Identity/state | Current allowed boundary / restriction |
| --- | --- |
| Anonymous | Public snapshot/search only; no private/profile mutation or membership grant |
| Email authenticated, phone unverified | Own profile/preferences/notification reads and current-user export expected under current RPC/RLS, subject to suspension/rate limits; no phone or academic approval |
| Phone confirmed, academic not submitted | May submit a genuine academic application; membership still separate |
| Academic pending/rejected/needs evidence | Does not receive approved-member contribution privileges |
| Approved member | Existing member-only post/reply/reaction/bookmark/project workflows; requires genuine human review |
| Reviewer/moderator/admin/service | Distinct existing grants/scopes; email registration assigns none |

**First action in your own trusted terminal, from this root:**

```powershell
.\scripts\set-staging-email-credentials.ps1
```

Enter a dedicated email you control and a unique 12+ character password into the private credential prompt, never chat. Then the agent can run `node scripts/test-email-staging.mjs` and inspect real signup, restored sessions, permitted persistence and actual denials. A successful run writes a clearly labeled nonclinical private profile/own preferences; it does not delete the account. If you already created this account elsewhere, tell the agent only that fact before running the new-account registration test. Keep the ignored credential file private and remove it when no longer needed. SETUP/CLOUD_SETUP explain the workflow.

Email acceptance needs no Twilio upgrade, Docker, SMTP confirmation delivery or frontend publication under the verified staging configuration. Actual SMS/academic/member-positive/staff-positive/second-user tests remain blocked without genuine prerequisites; no security restriction will be bypassed to enable them. Source contacts, authorized HTTPS processor, recovery and27 previous Advisor warnings remain release gates. **Email forms and anonymous UI verified; real authentication/persistence is still BLOCKED, production release remains BLOCKED.**

---

## Previous migration/deployment checkpoint - 2026-10-12

**The staging schema and four JWT-verified functions are deployed. NOT PRODUCTION READY.** Only the confirmed `biocircuit-staging` project, `ibxubsegrabpspopdgep`, was changed. CLI authentication, local linking, native database checks and anonymous connected acceptance now work. The snapshot 404 is fixed. Delivered OTP, actual academic review, authenticated persistence, scholarly provider success, private upload lifecycle and operational recovery remain unverified pending external configuration and legitimate accounts.

No frontend was published. No other project, production service, remote reset/history repair, purchase, seed, account creation, academic approval, privileged role assignment, real data deletion or security bypass was performed. No credentials or private academic information were recorded. Earlier evidence follows below as explicitly historical; it does not describe current blockers.

### Audit, identity and safe migration sequence

Read the current acceptance/checklist/readiness, SETUP, SECURITY and OPERATIONS documents, staging directive, all 19 migrations, four Edge handlers and shared modules. Reviewed RLS, client grants, definer search paths, indexes/constraints, private buckets, trigger dependencies, deliberate obsolete-function/index replacements, budgets and seed. No Git repository exists; no commit or Git initialization occurred.

Installed Supabase CLI **2.120.0** returned authenticated inventory containing exact name/ref and **ACTIVE_HEALTHY** status. Linked the existing Supabase directory to that ref. Ignored `.env.local` uses connected mode, that project's canonical URL and its actual public publishable key only. Its three variable names are `VITE_APP_MODE`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`; values are not reproduced. hCaptcha site key is absent. Runtime privileged keys were not copied into the frontend.

Before mutation, native read-only inventory established **0 public app tables, 0 views, 0 buckets, 0 application Auth triggers, no private schema and no migration schema**. Managed platform schemas were preserved. Remote ledger had no applied app versions. Supported dry-run exited 0 with exactly the 19 existing filenames, `seeds=[]`, `roles=[]`. Reviewed its complete output, then freshly checked identity, linked ref and migration hashes before push. Applied exactly that plan with `--skip-vault`, without seed/reset/repair. Push exited 0. Remote history after push and at final verification matches **all 19 local versions**.

Actual command family, from this existing root (all Supabase commands invoked with `npm.cmd exec -- supabase`):

```powershell
npm.cmd exec -- supabase --version
npm.cmd exec -- supabase projects list --output-format json
npm.cmd exec -- supabase link --project-ref ibxubsegrabpspopdgep --output-format json
npm.cmd exec -- supabase migration list --project-ref ibxubsegrabpspopdgep --output-format json
npm.cmd exec -- supabase db query --linked --project-ref ibxubsegrabpspopdgep --file supabase/tests/cloud-before-migrate.sql --output-format json
npm.cmd exec -- supabase db push --project-ref ibxubsegrabpspopdgep --dry-run --skip-vault --output-format json
npm.cmd exec -- supabase db push --project-ref ibxubsegrabpspopdgep --skip-vault --yes --output-format json
```

Inventory and CLI output were captured locally and reduced to non-secret target metadata rather than dumping the whole account inventory. The installed CLI's Management API query requires `--linked`; an initial query without it was rejected, and the plan/documentation were corrected. The initial projects parser assumed a top-level array and mixed a missing-link stderr message with JSON; it was corrected to read the actual `.projects` wrapper before any schema mutation.

### Native database evidence (actual hosted service)

`db query --linked --project-ref ibxubsegrabpspopdgep` executed the catalog and pgTAP files. The API returns the last nonempty result for separate SELECT statements; the first catalog attempt therefore did not provide all gates, and the first TAP attempt only exposed assertion 5. Added read-only `cloud-catalog-api.sql` to return every gate in one JSON result. Combined the **same five** TAP assertions with UNION ALL so all are observable. No assertion was removed or weakened. Retested equivalence locally and reran both against actual hosted PostgreSQL.

Verified hosted catalog:

- **29 application tables, all 29 RLS enabled**; no client DML/TRUNCATE/TRIGGER/REFERENCES grants; no unsafe/missing definer search paths.
- Three buckets are private with expected MIME and size constraints. Academic evidence/document upload remains unavailable despite the private bucket's presence. No client Storage object policy permits direct upload.
- Both actual Auth triggers are enabled; 49 public indexes; `public_snapshot(text)` exists.
- Anonymous academic read/member mutation is denied; ordinary authenticated cleanup/retention execution is denied by actual grants. These structural grants are not a two-user identity test.
- Native pgTAP returned **ok 1 through ok 5**. Extension/test changes were inside a rolled-back transaction; no reset or user record mutation.
- Final bounded counts: Auth users, profiles, posts, projects, Storage objects and taxonomy rows are **all 0**. No sample content was loaded into staging. The optional 11-label taxonomy seed is still a separate reviewed setup step.

Evidence: `verification/cloud/resume-migrations.json`, `resume-native-catalog.json`, `resume-native-pgtap.json`, `resume-empty-data.json`; ignored raw dry-run/push logs: `docs/resume-dry-run.log`, `docs/resume-migration-push.log`.


Actual postmigration native commands:

```powershell
npm.cmd exec -- supabase db query --linked --project-ref ibxubsegrabpspopdgep --file supabase/tests/cloud-catalog-api.sql --output-format json
npm.cmd exec -- supabase db query --linked --project-ref ibxubsegrabpspopdgep --file supabase/tests/rls.test.sql --output-format json
npm.cmd exec -- supabase db advisors --linked --project-ref ibxubsegrabpspopdgep --type all --fail-on error --output-format json
```

### Snapshot diagnosis and connected adapter repair

Exact failing resource was **POST `https://ibxubsegrabpspopdgep.supabase.co/rest/v1/rpc/public_snapshot`**, with the existing `before_cursor` argument, expecting SQL `public.public_snapshot(text)`. Before migration the actual response was **404 / PGRST202** and the native schema/ledger were empty. Applying the original schema installed the expected RPC; the identical SDK call then returned **200, null error**. This was a missing resource, not an invented route or demo workaround. Evidence: `resume-snapshot-diagnosis.json`.

The first post-migration browser run uncovered a separate bug: guests also requested **`/rest/v1/rpc/recommended_page`**, which reads member-only preferences, returning **401 / 42501**. A direct actual SDK request confirmed that denial. Updated only `src/data/gateway.ts` so recommendations are requested after a real session exists; guests request the authorized public snapshot. Authenticated recommendation behavior and database permissions remain intact. Added two gateway regression tests, preserving existing assertions. No table grant, RLS policy or backend handler changed to hide an error.

Final connected browser run: **12 routes, four sizes, 34 staging requests, every request HTTP 200 public_snapshot, 0 console errors, 0 uncaught errors, 0 unexpected backend requests**. Routes: Feed, Explore, Questions, Projects, Journal, Collaborators, Profile, Saved, Notifications, Settings, Trust, Policies. Search focus, modal Escape/focus return, browser history, reduced-motion handling passed. **0 axe violations and no horizontal page overflow** at 1440x900, 1024x768, 390x844 and 320x700. No demo fallback.

Captured and actually opened/inspected all four fresh `docs/screenshots/staging/anonymous-{1440,1024,390,320}.png` images. Existing social-first layout/art direction remains coherent and shows genuine empty/guest states. Preserved pre-migration captures in `docs/screenshots/staging/before-migrations/`. Anonymous screenshots do not prove populated or authenticated workflows. Evidence: current `connected-anonymous.json`, `docs/resume-connected-final.log`; the intermediate 401 run is retained in `docs/resume-connected.log`.

### Four Docker-free Edge deployments

Reviewed all four handlers/configs; preserved JWT verification, actual `getUser`, role/object checks, exact-origin CORS, bounded streamed requests, private Storage and server-only privileged clients. Local four-handler typecheck and three Edge tests passed. Initial custom secret inventory was empty (names inspected only). Configured only the non-secret **ALLOWED_ORIGIN=http://127.0.0.1:5190** using an ignored env file. No service-role key, processor token, provider contact or private credential was retrieved or printed.

After target/link verification before each mutation, executed:

```powershell
npm.cmd exec -- supabase secrets set --env-file .cloud/functions-origin.env --project-ref ibxubsegrabpspopdgep --output-format json
npm.cmd exec -- supabase functions deploy scholarly-search --project-ref ibxubsegrabpspopdgep --use-api --output-format json
npm.cmd exec -- supabase functions deploy account-delete --project-ref ibxubsegrabpspopdgep --use-api --output-format json
npm.cmd exec -- supabase functions deploy avatar --project-ref ibxubsegrabpspopdgep --use-api --output-format json
npm.cmd exec -- supabase functions deploy project-images --project-ref ibxubsegrabpspopdgep --use-api --output-format json
npm.cmd exec -- supabase functions list --project-ref ibxubsegrabpspopdgep --output-format json
```

All deployments exited 0 using API bundling; no Docker. Actual final inventory: **all four ACTIVE, version 1, verify_jwt=true**. Evidence: `resume-functions.json`, ignored per-function `docs/resume-deploy-*.log`. This establishes deployment and anonymous ingress behavior, not authenticated successful handler execution.

### Actual live HTTP acceptance

New bounded `node scripts/test-staging-anonymous.mjs` completed **39 live assertions, all PASS, exit 0**:

- Actual bounded public snapshot/search; seven sensitive/private table reads and eight member/privileged RPCs denied **401 / 42501**.
- Anonymous role escalation and phone/membership flag writes denied. Invalid managed Auth bearer denied; requesting the private REST schema denied **406 / PGRST106**.
- Each deployed function: exact-origin preflight **200** with controlled origin/no-store; wrong-origin preflight **403**; missing and invalid JWT POST **401**. JWT rejection may occur at the platform gateway; authenticated handler branches remain untested.
- Direct anonymous Storage uploads using real harmless tiny valid WebP/PNG content denied **403 / RLS** in avatars/project-files. No object was created. This verifies the denial, not a successful image processor/Storage round trip.
- Managed Auth public settings **200**, phone enabled **false**, phone autoconfirm **false**. No OTP or phone flag was simulated. Private provider credentials were not inspected; no provider configuration is inferred from public settings.

Evidence: `resume-anonymous-http.json`, `docs/resume-anonymous-http.log`. Existing `npm.cmd run test:cloud-http` separately produced **7 live anonymous passes and 8 BLOCKED prerequisite records**, exit 2, no failed assertion: seven real role identities plus the cross-account workflow are unavailable. `http-results.json` is current post-deployment evidence. No temporary sessions or write fixtures were used.

### Advisors and remaining security/performance review

Actual `db advisors --linked --project-ref ibxubsegrabpspopdgep --type all --fail-on error --output-format json` exited 0 with **0 ERROR and 27 WARN**: ten `authenticated_security_definer_function_executable` and seventeen `auth_rls_initplan`. Evidence: `resume-advisors.json`.

Authenticated SECURITY DEFINER RPC entry points are deliberate: direct client writes are revoked and those routines perform UID/eligibility/scoped-role/object checks with fixed search paths. Reviewed their source; nevertheless real distinct-user and staff negative tests are still required before accepting release risk. Do not remove those checks or grant client DML to clear a scanner. RLS initplan warnings concern per-row Auth calls; no policy rewrite was made without measured workloads. Review representative query plans under actual role load and, if justified, use a new forward migration rather than editing the applied chain. Official [Advisor guidance](https://supabase.com/docs/guides/observability/advisors) supports assessing intentional findings; the specific 0029 documentation URL was inaccessible during this run. A zero-error exit does not certify security or production readiness.

### Commands and actual local verification

| Executed command | Actual final result / scope |
| --- | --- |
| `npm.cmd run check` | Exit 0: lint, TypeScript, **42 unit tests / 10 files**, **122 local SQL assertions**, production build **11.88s**. Local Auth/Storage are stubbed; not native service acceptance. |
| `npm.cmd run test:cloud-catalog` | Exit 0, **26 local catalog assertions**, including single-result adapter equivalence |
| `npm.cmd run typecheck:edge` | Exit 0, all four handlers checked |
| `npm.cmd run test:edge` | Exit 0, **3 passed / 0 failed**, 135ms |
| `npm.cmd run format:check` | Exit 0 |
| `npm.cmd run check:bundle` | Exit 0, final entry JS **120114 gzip bytes**, CSS **9941**; SDK remains a separate chunk |
| `npm.cmd audit` | Exit 0, **0 reported vulnerabilities**; not full security assurance |
| `npm.cmd run test:production` | Exit 0, isolated missing-config smoke; no demo fallback, remote request or uncaught error. Local unthrottled FCP452ms/LCP536ms/CLS0.002377, not production performance. |
| `npm.cmd run test:staging-browser` | Exit 0; actual connected 12 routes/four sizes/axe0, 34 HTTP200 requests, console 0 / uncaught 0 |
| `node scripts/test-staging-anonymous.mjs` | Exit 0, 39 live anonymous assertions |
| `npm.cmd run test:cloud-http` | Exit 2, 7 live passes/8 prerequisite blockers, no failures; authenticated tests not executed |
| `npm.cmd run cloud:preflight` / `cloud:plan` | Both exit 0, local source recovery/print-only plan; do not imply a remote backup or repeat deployment |

Ignored execution logs are `docs/resume-*.log`. Initial `check` encountered a 5000ms dynamic-import timeout and fork-worker failure (35 passing/1 failing test plus worker error); retained in `resume-check-initial-timeouts.log`. The same pipeline reran sequentially after browser activity completed and passed all 42; no test assertion, timeout or configuration was weakened. Non-fatal Rollup annotation warnings in installed Zod remain in build output. PowerShell inline Node quoting also failed during an early diagnostic and was corrected using stdin. Earlier **47 passing demo Playwright tests are historical, not rerun or relabeled live this turn**; focused actual connected verification covered the changed adapter. No install, dependency upgrade or unrelated repeated test was needed.

### Preservation and important files

Compared the 115-file pre-push source manifest: **all 19 migrations and all eight Edge/shared files unchanged**. Six existing source/check files changed: `src/data/gateway.ts`, `tests/gateway.test.ts`, `scripts/cloud-plan.mjs`, `scripts/test-cloud-catalog.mjs`, `scripts/test-connected-staging.mjs`, `supabase/tests/rls.test.sql`. Added `scripts/test-staging-anonymous.mjs` and `supabase/tests/cloud-catalog-api.sql`. No source file deleted, dependency added/removed/upgraded or lockfile changed. Existing visual CSS/components/routes were preserved.

Updated these acceptance/checklist/readiness reports and cloud/setup/security/operations guidance. Added sanitized `verification/cloud/resume-*.json` and fresh screenshots, preserving historical captures. Ignored local config/link state/logs/build artifacts and ALLOWED_ORIGIN-only `.cloud/functions-origin.env` are operational files, not browser secrets. Final secret-free source recovery: **117 files**, `.cloud/backups/2026-10-12T03-17-47-658Z`; source fingerprints/migration hashes in `preflight.json`. This is source recovery, not a database/Auth backup. No Git branch/working-tree status is available because this directory has no Git repository.

### Final artifact/static review

Fresh emitted frontend artifacts and the three updated required reports: **20 files scanned, 0 privileged-key/PAT/private-key/service-role-JWT pattern findings**. Public publishable keys are allowed; this is a conservative pattern scan, not exhaustive secret assurance. Evidence: `verification/cloud/resume-artifact-scan.json`. The final Docker-free print-only Advisor plan was corrected to retain the installed CLI's required `--linked` flag; final lint, format and cloud:plan all exited 0 (`resume-lint-final.log`, `resume-format-final.log`, `resume-plan-final.log`). Full 42-test/build verification above preceded this command-string-only correction; affected static/plan checks were rerun.

### Remaining gates and exact next action

1. In the confirmed project's [Authentication Providers](https://supabase.com/dashboard/project/ibxubsegrabpspopdgep/auth/providers), configure an **already-owned supported SMS provider** privately, including required sender/template approvals, then enable phone Auth while retaining phone confirmation. Do not enable fixed test OTP mappings or phone autoconfirm. Provider selection/credentials are unavailable to the agent; nothing was purchased. Report only the provider name in conversation, never credentials or OTPs. Official [phone Auth guide](https://supabase.com/docs/guides/auth/phone-login).
2. Configure real managed hCaptcha and allowed loopback domains, set only the public site key in `.env.local`, and review exact Auth site/redirects, expiry/cooldown and server-side verification/rate limits. [CAPTCHA guide](https://supabase.com/docs/guides/auth/auth-captcha). No wildcard, fake site key or bypass.
3. Supply legitimate server-side `CROSSREF_MAILTO` and `NCBI_EMAIL` through trusted secret tooling; optional `NCBI_API_KEY` stays server-side. No fake service contact/source success.
4. Select an already-authorized always-on first-party HTTPS Node/Sharp processor host; provision `/avatar` and `/project-image`, exact endpoint secrets and a shared server-only token (minimum 32 characters). No host/TLS/resource was created. Current eight-second Edge timeout makes a sleeping free service unsuitable. Existing processor code/tests and detailed setup are in CLOUD_SETUP.md.
5. Establish consenting dedicated managed Auth accounts, delivered-code phone verification and actual human academic decisions; scoped staff bootstrap remains an explicit trusted administrator step. Then run the real JWT harness and connected authenticated journeys. Do not fabricate verified flags, qualifications or approvals. Only separately confirmed disposable accounts may undergo deletion tests.
6. Complete source/cache/rate/adverse tests, private object upload/replacement/removal and 60-second signed-link expiry/revocation, export/global logout/deletion/ownership refusal, cleanup retries/orphans/retention schedule and safe backup/restore rehearsal. No destructive schedule or restore has been installed. Resolve Advisor risk under actual permissions/query load before release.

All feasible independent migration/deployment/native catalog/anonymous and local checks above were executed. These external prerequisites prevent further authenticated real-service acceptance. Document/academic upload, direct messaging and email digests remain unavailable as recorded in earlier implementation status. **Staging foundation operational; authenticated product and production release acceptance remain BLOCKED.**

---

## Historical evidence retained below

The following section describes earlier dates only. Its login, empty-schema, function404 and migration/deployment blockers have been resolved above; other unverified real-service prerequisites remain open.


## Previous staging execution — 2026-10-11

Read `BIOCIRCUIT_STAGING_EXECUTION_PROMPT.md` completely and executed all independent local preparation and read-only hosted checks available without CLI authentication. Confirmed target: **`ibxubsegrabpspopdgep`**, [Dashboard](https://supabase.com/dashboard/project/ibxubsegrabpspopdgep). **NOT PRODUCTION READY.** Migration dry-run/push, function deployment and authenticated application acceptance remain blocked. No frontend was published, service purchased, remote database reset, RLS disabled, credential exposed or cloud setting changed.

### Actual identity, connection and managed-service observations

The authenticated user Dashboard was inspected through browser tooling. General Settings showed actual project name **`biocircuit-staging`** and Project ID **`ibxubsegrabpspopdgep`**. Data API settings showed the actual `https://ibxubsegrabpspopdgep.supabase.co/rest/v1/` endpoint. The user's designation establishes intended staging isolation; production/data-sharing isolation was not independently audited. Public Table Editor showed **No tables or views**. This is a live UI observation, not a migration-ledger or native SQL audit.

Copied only the existing **publishable** key from its scoped API Keys row, without revealing it in logs or reports. Wrote ignored `.env.local` with exactly `VITE_APP_MODE`, `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Values are connected mode, the verified endpoint and that actual public key. No service-role/secret key, CAPTCHA placeholder or simulated verification was added. The ignored `.cloud/staging.json` records actual non-secret metadata and loopback origin `http://127.0.0.1:5190`; requested-target identity is now verified. No CLI-linked reference exists.

Real SDK `public_snapshot` returned **404 / PGRST202**. Managed Auth settings returned **200**, with **phone disabled** and **phone autoconfirm false**. No OTP was sent, provider configured or phone flag bypassed. Four function routes returned 404 in unauthenticated ingress observations; deployed-handler authentication remains unverified. Security Advisor and Performance Advisor each displayed **0 errors, 0 warnings, 0 suggestions**. These are pre-schema observations; repeat after migration and real configuration. Zero findings on the empty app schema do not establish application security. Advisor DOM inspection briefly timed out; a documented AX fallback and a loaded DOM snapshot yielded actual counts. The user's original General Settings tab was restored and verified.

Read-only CLI `projects list --output-format json` repeatedly returned **exit 1, authentication required**, including the final recheck. Raw inventory, login URLs/codes and credentials were suppressed. Official interactive login was opened in a trusted local PowerShell terminal (process 2864). Dashboard sign-in does not authenticate the CLI. No link, remote migration list, native catalog query, supported remote dry-run, push, function deploy or secrets command was executed. No authenticated browser session/cookie was extracted to bypass this gate.

### Work completed while CLI authentication is pending

- Preserved all **40** earlier backend/security fingerprints, including all **19 migrations**, four Edge Functions/shared modules and security-sensitive connected code. No frontend design, RLS, migration, handler, Auth or privacy behavior was rewritten. No Git repository exists; no commit or initialization was performed.
- Reviewed the unchanged ordered migration chain, managed Auth/Storage dependencies, structural obsolete-function/index replacements, definer search paths, grants, private bucket rules and seed. Ordinary dry-run/push now **omit seed by default**. The existing 11-label taxonomy seed remains a separate optional reviewed step. No seed was applied remotely.
- Added read-only `supabase/tests/cloud-before-migrate.sql`, reporting bounded catalog counts without user data. Local catalog tests validate five pre-migration observations and ten post-migration assertions against all 19 migrations in PGlite. Managed Auth/Storage are stubbed there; native hosted verification is still required.
- Strengthened the target guard and negative unit test: reject unverified requested identities, another requested reference or conflicting CLI link. Guarded `cloud:plan` now exits 0 using verified Dashboard metadata; it prints commands and performs no cloud mutation. Actual authenticated inventory, ledger and dry-run must still precede push.
- Added bounded anonymous ingress and connected-browser harnesses. They never create users, approve academics, write community fixtures, send OTP or simulate successful persistence.
- Made production missing-configuration smoke testing reproducible after real staging config exists: build into ignored `.cloud/missing-config-*`, override only subprocess public config and preserve `.env.local` and normal `dist`. Original no-fallback/no-request/no-error assertions remain intact.
- Refreshed a secret-free source recovery copy: `.cloud/backups/2026-10-11T04-00-40-650Z`, **115 files**, with 19 ordered migration hashes. Actual env files, CLI state, sessions, targets, logs and user data are excluded. The manifest records only the three `.env.local` variable names. This is source recovery, not a hosted database/Auth backup.
- Reconfirmed installed CLI **2.120.0** supported dry-run and `functions deploy --use-api`, which bundles without Docker. Planned deployment retains `verify_jwt=true` and handler `getUser` checks. No unsafe bypass, reset, prune, migration repair or paid service was used.

### Actual anonymous live/browser evidence

`npm.cmd run test:staging-ingress` observed seven requests without API key, JWT, cookies or user content; redirects refused, 15-second limits, response bodies not logged. Auth health **401**, REST root **401**, Storage bucket route **400**, each of four function POST `{}` routes **404**. Scope: public gateway responses only. Evidence: `docs/verification/cloud/staging-ingress.json`.

`npm.cmd run test:staging-browser` used the actual publishable key/endpoint and connected adapter. All **12 routes** rendered: Feed, Explore, Questions, Projects, Journal, Collaborators, Profile, Saved, Notifications, Settings, Trust and Policies. No demo fallback or unintended page horizontal scrolling was observed. Search keyboard focus, modal Escape/focus return, browser history and reduced background motion passed. Four viewports passed automated axe with **0 violations**: **1440×900, 1024×768, 390×844, 320×700**.

The browser observed **34 staging requests, all 404**, **34 resource console errors**, **0 uncaught errors**, **0 unexpected Supabase-host requests**. These 404s are real missing-RPC errors, displayed through the existing retry/error UI. They are **not successful feed loading or persistence**, and console output is not claimed clean. Evidence: `docs/verification/cloud/connected-anonymous.json`, `docs/staging-connected.log`.

All four screenshots were opened and visually inspected: `docs/screenshots/staging/anonymous-1440.png`, `anonymous-1024.png`, `anonymous-390.png`, `anonymous-320.png`. Desktop navigation/right rail, tablet reflow, mobile bottom navigation and visible backend error remain coherent; topic-strip clipping is intentional internal scrolling, not page overflow. Captures use reduced motion and anonymous empty/error state. Populated/authenticated staging screenshots are blocked until schema and genuine accounts exist. No Dashboard screenshot containing account metadata or key values was retained.

### Current commands actually executed

Node **22.23.2**, Deno **2.9.6**, CLI **2.120.0**. Existing installed lockfile/dependencies retained; `npm ci` documented, not rerun. No package versions changed.

| Command / check | Actual final result / scope | Evidence |
| --- | --- | --- |
| `npm.cmd run check` | Exit 0: lint, app TypeScript, **40 tests / 10 files**, **122 SQL authorization checks**, config guard, production build **14.98s** — LOCAL ONLY | `docs/staging-final-check.log` |
| `npm.cmd run lint`, `npm.cmd run format:check` | Both exit 0 after harness repairs — LOCAL ONLY | `docs/staging-final-lint.log`, `docs/staging-format.log` |
| `npm.cmd run test:cloud-catalog` | Exit 0, **15 measured assertions**, all 19 migrations; managed Auth/Storage stubs — LOCAL ONLY | `docs/staging-catalog.log` |
| `npm.cmd run typecheck:edge`, `npm.cmd run test:edge` | Both exit 0; four handlers checked; **3 passed / 0 failed**, 58ms — LOCAL ONLY | `docs/staging-edge-types.log`, `docs/staging-edge-tests.log` |
| `npm.cmd run test:e2e` after connected config | Exit 0, **47 passed / 0 failed**, 5.1 minutes, explicitly synthetic demo adapter — LOCAL ONLY | `docs/staging-e2e-after-config.log` |
| `npm.cmd run test:staging-browser` | Exit 0, actual anonymous SDK/render/error/keyboard/axe checks above — LIVE VERIFIED only within that limited scope | `docs/verification/cloud/connected-anonymous.json` |
| `npm.cmd run test:staging-ingress` | Exit 0, seven real gateway responses above — LIVE VERIFIED ingress only | `docs/verification/cloud/staging-ingress.json` |
| `npm.cmd run check:bundle` | Exit 0, entry JS **120,112 gzip bytes**, CSS **9,941**; additional connected SDK chunk **59,320 gzip bytes**, excluded from entry budget | `docs/staging-bundle.log` |
| `npm.cmd audit --audit-level=moderate` | Exit 0, **0 reported vulnerabilities**; not complete security assurance | `docs/staging-audit.log` |
| `npm.cmd run test:production` | Exit 0, isolated missing-config production build; setup required, no demo fallback, 0 remote requests/uncaught errors; FCP **560ms**, LCP **648ms**, CLS **0.002377** (unthrottled local) | `docs/staging-production.log`, `docs/verification/production-smoke.json` |
| `npm.cmd run evaluate:ranking` | Exit 0, 1,000 synthetic candidates/20 runs; precision@10 1; median **3.718ms**, p95 **36.671ms**; not human/provider relevance or latency | `docs/staging-ranking.log` |
| `npm.cmd run cloud:preflight`, `npm.cmd run cloud:plan` | Both exit 0, local recovery/validation and print-only plan; no remote execution | `docs/staging-preflight.log`, `docs/staging-plan-gate.log` |
| CLI `projects list --output-format json` | Exit 1, authentication required — BLOCKED; output safely reduced | Local observation, no raw inventory retained |
| Backend preservation | **40 fingerprints unchanged**, no migration/handler/security regression | `docs/verification/cloud/staging-preservation.json` |

Initial new harness run failed because axe requires an explicitly created BrowserContext; repaired using current official [axe guidance](https://github.com/dequelabs/axe-core-npm/blob/develop/packages/playwright/error-handling.md), preserving accessibility assertions. The next full check stopped on two lint errors from unqualified `innerWidth`; changed callbacks to `window.innerWidth`, reran lint and complete check successfully. The mistakes are retained in `docs/staging-connected-initial-error.log` and `docs/staging-final-check-initial-lint.log`. One command used the nonexistent `bundle:check` script; corrected to supported `check:bundle`, exit 0, original log retained as `docs/staging-bundle-command-error.log`. No tests were removed, assertions weakened or timeouts inflated. Nonfatal dependency annotation/color warnings remain; no application build error.

Final conservative emitted-dist/required-report scan inspected 16 files and found 0 privileged-key/PAT/private-key/service-role-JWT patterns; public publishable keys are expected in the client build. Evidence: `docs/verification/cloud/staging-artifact-scan.json`. This is not exhaustive secret assurance.

### Important current files changed

| Files | Purpose |
| --- | --- |
| `scripts/cloud-target.mjs`, `tests/cloud-target.test.ts` | User-confirmed requested-target identity and negative access guard |
| `scripts/cloud-plan.mjs`, `docs/CLOUD_SETUP.md`, `docs/SETUP.md` | No seed by default; verified current target and Docker-free safe sequence |
| `supabase/tests/cloud-before-migrate.sql`, `scripts/test-cloud-catalog.mjs` | Read-only pre-migration inventory and five added measured assertions |
| `scripts/staging-ingress.mjs`, `scripts/test-connected-staging.mjs`, `package.json` | Bounded actual anonymous ingress/connected browser commands; no new dependencies |
| `scripts/smoke-production.mjs` | Isolated missing-config build preserves real env/dist and original assertions |
| Required acceptance/checklist/readiness docs | Actual evidence, scoped passes and unclosed release gates |
| Ignored `.env.local`, `.cloud/{staging,requested-target}.json` | Actual public-only staging config and non-secret target metadata |
| `docs/verification/cloud/*.json`, local ignored logs/screenshots | Sanitized observations, hashes, test evidence and actual captures |

No source files were deleted. Existing visual redesign, backend integration, privacy rules and shared interaction controls remain intact. Historical preparation details below are retained for provenance; **this current section and RELEASE_READINESS.md supersede earlier missing-reference/configuration status**.

### Remaining release gates and exact next action

Migration ledger/native inventory/dry-run/push, native pgTAP/RLS/Storage policies, all four actual deployed Edge handlers, real consenting role-separated managed accounts, delivered OTP/CAPTCHA, academic human review, community persistence/points/moderation, scholarly proxy/cache/upstream results, private file/revocation/expiry, HTTPS processor, export/delete/global sign-out, cleanup/retry/orphan inventory and recovery rehearsal remain **BLOCKED — USER CONFIGURATION**. Anonymous rendering does not close those gates. The role-aware HTTP harness was not rerun against the known missing schema/undeployed handlers; its post-deployment assertions must run after prerequisites. Earlier exit-2 prerequisite evidence is historical, not a current successful live test.

Subsequent external inputs include an actual SMS provider and any sender/region approvals, real hCaptcha settings, legitimate Crossref/NCBI service contact, genuine account/role/human-review evidence and an authorized always-on HTTPS Node/Sharp processor with server-only token. No contact, approval, service availability or SMS delivery was invented. Free sleeping processor tiers may conflict with the eight-second timeout; no hosting or billing change was authorized. Existing signed links may survive member removal for up to 60 seconds; actual lifecycle remains unverified. Scanned academic-document ingestion, email digest delivery and direct messaging remain unavailable. Destructive retention schedules and production backup/restore are outside the completed evidence.

**One next action:** complete official Supabase CLI login in the trusted local terminal already opened; press Enter if its login prompt is waiting and finish the browser/local flow. Equivalent root command: `npm.cmd exec -- supabase login`. Keep credentials/codes in that local flow; do not send them in chat. After login, the agent must recheck CLI project identity, link this exact ref, inspect ledger and native inventory, run/review the supported dry-run without seed, and only then apply reviewed staging changes. The project is already confirmed; do not create another project or supply its ID again.

## Earlier cloud preparation evidence (historical)

Audit and local preparation performed 2026-10-11 in `D:/personal_projects/my apps/biocircuit-source/biocircuit`. The complete `BIOCIRCUIT_CLOUD_ACCEPTANCE_PROMPT.md` is authoritative. The accepted social-first UI is preserved. **Local preparation passes; every hosted acceptance gate remains BLOCKED — USER CONFIGURATION. BioCircuit is not production ready.**

Observed baseline: React/TypeScript/Vite, Supabase SDK 2.117.3, CLI 2.120.0, 19 ordered migrations, taxonomy-only seed, four verify_jwt=true handlers with explicit current Auth getUser checks, separate demo/connected adapters, Node/Sharp processor and bounded Storage cleanup worker. Earlier reports describe local synthetic/PGlite verification only. Current visual report and actual screenshot evidence were inspected. No Git repository exists, so original user files are preserved through a local allowlisted snapshot instead of a Git reset or initialization.

Initial safety findings: `.env`/`.env.*` and `*.log` were ignored, but the actual Supabase `supabase/.temp` cache and additional session/backup paths needed explicit exclusions. Setup documentation led with Docker and omitted API-based function deployment. Those local preparation gaps are repaired. Installed CLI help confirms `db push --dry-run`, `functions deploy --use-api`, `db query --project-ref --file`, `db advisors` and `secrets set --env-file`. The hosted path needs no container runtime. Read-only CLI project inventory returned exit 1 because authentication was unavailable; no target project was designated. These are observed configuration gates, not proof of a service defect.

No cloud schema/function mutation, real OTP, hosted RLS, Storage/provider operation, account deletion, cleanup schedule or public deployment has been performed. No existing production resource was targeted. No billable service was created. No secret values were printed or put in the evidence.

## Inspection and observed state

Read the full cloud prompt, master implementation prompt, social redesign specification, visual art-direction specification, root/docs build reports, implementation status, setup/security/operations documentation and visual report. Inspected repository/hidden configuration names, installed scripts/config, source adapter/Auth boundaries, all 19 migrations, seed, four Edge handlers/shared modules, processor/cleanup scripts and all existing unit/component/database/browser tests. The root build report duplicates the docs report body. Optional `BIOCIRCUIT_AUTONOMOUS_VISUAL_POLISH.md` was absent and is not a blocker. No applicable AGENTS.md was found.

The current code has separated synthetic and connected adapters; missing connected configuration fails closed. The local TOML's Auth/SMS settings are not proof of hosted Auth settings. Actual `.env`/`.env.local` files were absent at inspection; placeholders remain in `.env.example`. There is no `.git` repository. `git status --short` returned exit 128, “not a git repository.” No Git initialization, reset, clean, commit or push occurred. The project lockfile/dependency versions were retained; no dependencies were installed, removed or upgraded during this task. Existing installed dependencies were sufficient for checks.

Screenshots actually opened during this task:

- Retained `docs/screenshots/art-direction/final-dark/desktop-feed.png` (1440×900) and `mobile-feed.png` (390×844), showing the accepted synthetic UI with its explicit demo notice.
- Fresh `docs/screenshots/setup-required.png`, generated by this task's production smoke: connected production without configuration shows SETUP REQUIRED, a meaningful error and no demo person/data substitution.
- Fresh demo browser screenshots `docs/screenshots/redesign/desktop-feed.png` (1440×1000) and `narrow-feed.png` (320px viewport, full page) were opened and inspected after the passing Playwright run. None of these images proves a hosted session or live backend.

## Migration, privilege and seed review

All expected files are present in order; SHA-256 hashes are in `docs/verification/cloud/preflight.json`. They were not changed:

| Migration suffix (sequence 01–19) | Reviewed responsibility |
| --- | --- |
| schema | Auth-triggered profiles, relational tables, RLS, private academic/project buckets and least-privilege helpers |
| operations | Authenticated transactional RPCs, receipts, role/ownership checks, notifications and community operations |
| discovery | Private scholarly cache and bounded source/search access |
| trust_extensions | Subscriptions, versions, contribution rules and service-only retention |
| search_pagination | Cursor/search/admin aggregate RPCs; intentionally replaces obsolete search function |
| project_logs | Search-vector backfill and replacement GIN index; bounded project log behavior |
| integrity | Contribution/self/pair/day integrity and restricted role behavior |
| avatars | Private WebP bucket, safe path records and member-scoped reads |
| moderation_privacy | Closes private-project moderation access and enforces current visibility |
| provider_budget | Shared conservative source reservation and bounded queue |
| notification_preferences | Category preferences, subscription/topic/mention rules and bounded notification generation |
| content_appeals | Author appeal and staff resolution scope; owner-confirmed project deletion |
| personal_export | Current-UID-only data export |
| public_pagination | Intentionally replaces the obsolete snapshot signature with a bounded cursor overload |
| paper_reports | Source report role scope and metadata integrity |
| project_images | Private project image metadata and actual collaborator access |
| storage_cleanup | Bounded privileged tombstones/acknowledgement; intentionally replaces obsolete image budget signature |
| export_images | Current-user export includes own image records |
| image_integrity | Uploader path integrity and membership recheck at upload commit |

No migration truncates/deletes application tables to simplify setup. Intentional obsolete function/index drops are structural replacements, not data resets. The chain relies on the migration ledger; it is not individually rerunnable. Fresh-project bucket conflict handling does not repair an unsafe pre-existing bucket. Therefore deployment requires a genuinely new isolated project, reviewed remote ledger/dry-run and post-push catalog checks. No remote migration repair/reset was attempted. Seed SQL contains 11 taxonomy labels only; no people, roles, verification, OTP, patient data or fake scholarly records.

The local catalog gate executes all migrations and the read-only hosted query in PGlite. Ten measured assertions cover table count/RLS, actual client write privileges (including truncate/trigger/reference), empty definer search paths, private bucket count/flags/limits/MIME lists, absence of direct Storage INSERT/ALL policies, enabled Auth triggers and privileged RPC denial. The existing 122-check authorization suite exercises real PostgreSQL policies/constraints with **stubbed managed Auth and Storage**. Neither constitutes live RLS acceptance. The five native pgTAP assertions are prepared for hosted SQL submission, but were not executed on hosted PostgreSQL.

## Changes made and architecture decisions

No UI, domain/backend implementation, migration, RLS policy or Edge behavior was rewritten. The 40 existing backend/security fingerprints match exactly (`docs/verification/cloud/backend-preservation.json`). Local backup excludes actual environment/session files, CLI credentials/cache, generated reports and user data; source-copy integrity is hashed. Latest copy: `.cloud/backups/2026-10-11T03-07-44-959Z`, 112 allowlisted files. Earlier preparation copy is retained. This is a source recovery copy, not a hosted database/Auth backup or Git history.

| File(s) created/modified | Purpose |
| --- | --- |
| `.gitignore` | Ignore `.cloud`, CLI temp/branches, Netlify state, credentials/secrets and private key files; retain tracked placeholder example |
| `.env.example` | Cloud-first/local-origin guidance, placeholders only, demo preserved |
| `package.json` | Four preparation/test scripts; dependencies unchanged |
| `scripts/cloud-target.mjs` | Validate actual staging designation, 20-letter reference, canonical endpoint/loopback origin, linked-ref mismatch, public key and ignored session path |
| `scripts/cloud-plan.mjs` | Print target-specific reviewed command sequence; execute no remote mutation; missing target exits 2 |
| `scripts/cloud-preflight.mjs` | Verify ordered migration/ignore rules, inspect env names only, make allowlisted recovery copy and hash manifest |
| `scripts/cloud-http.mjs` | Guarded real HTTP/JWT subset, sanitized reports, separate missing prerequisites/failed live calls, explicit optional fixture writes and own-run cleanup |
| `scripts/test-cloud-catalog.mjs`, `supabase/tests/cloud-catalog.sql` | Test the read-only hosted structural query locally, with measured assertion count |
| `tests/cloud-target.test.ts` | Three guard tests for target/endpoint/isolation/key/session-path rejection |
| `tests/processor-http.test.ts` | Four real loopback HTTP tests for token denial, route restriction, image decode/MIME rejection and oversized request denial |
| `README.md`, `docs/SETUP.md`, `docs/OPERATIONS.md` | Prefer hosted staging without containers; preserve optional native stack; clarify hosted defaults, API bundling and schedule/publish boundaries |
| `docs/CLOUD_SETUP.md` | Exact staged workflow, secret handling, OTP/role/source/Storage/browser/recovery matrices and troubleshooting |
| `docs/CLOUD_ACCEPTANCE_CHECKLIST.md`, this report, `docs/RELEASE_READINESS.md` | Ordered status/evidence and explicit unverified release gates |
| `docs/verification/cloud/{preflight,backend-preservation,http-results}.json` | Secret-free local hashes and blocked prerequisite evidence |
| Ignored `docs/cloud-*.log`, local `.cloud/backups/`, browser evidence | Actual command logs, source recovery and local screenshots; no secrets |

No files were deleted. No existing assertions were removed, skipped or weakened. No new public Vite variables or libraries were introduced. `cloud:preflight` uses a conservative source-secret pattern check; it is not an exhaustive secret scanner. Ignore rules were inspected statically; with no Git repository there is no tracked-file ignore enforcement to claim.

The HTTP harness never creates Auth users or fabricates OTP/approval. It requires actual managed `getUser`, approved/phone-confirmed ordinary members, different real IDs and real roles for supplied sessions. It checks anonymous snapshot/mutation/academics, four function unauthenticated responses, wrong-origin requests, other-user private reads, client role/flag writes, and optional persisted question/reply/answer/notification/ledger/private-project fixtures. Writes are explicitly opt-in. It cleans only successfully created fixture IDs; failure is recorded. Missing identities remain blocked and exit 2, failed live calls exit 1. Its separate `notCovered` statement preserves remaining live scenarios. The harness has only been exercised at the local prerequisite gate; successful live requests cannot be claimed.

## Actual commands and results

Initial audit printed the ordered checklist and immediately continued. CLI version/help and current official documentation were checked before relying on options. Node was 22.23.2, Deno 2.9.6 and Supabase CLI 2.120.0. Exact cloud-help commands inspected: `supabase --version`, `login --help`, `projects list --help`, `link --help`, `migration list --help`, `db push --help`, `functions deploy --help`, `secrets set --help`, `db query --help`, `db advisors --help`. Read-only `projects list --output-format json` was captured without exposing raw account inventory and returned authentication unavailable. No link/push/deploy command ran.

The first `npm.cmd run check` and `npm.cmd run test:e2e` overlapped on this workstation. The baseline logs are preserved, rather than replaced with successful output: gateway test hit its 5-second timeout; two Vitest workers failed to start; browser navigation for `/` hit 30 seconds while 46 tests passed. These were timed-out runs, not passing baselines. Sequential rerun passed all 39 unit tests and 122 SQL checks without increasing timeouts or changing assertions; the full browser rerun result is below. A new-file Prettier warning was fixed and checked again.

| Exact command | Actual result / scope | Evidence |
| --- | --- | --- |
| `npm.cmd run check` (sequential) | Exit 0: lint, TypeScript, **39 tests / 10 files**, **122 database checks**, prebuild guard and production build pass — LOCAL ONLY | `docs/cloud-final-check.log` |
| `npm.cmd test -- tests/cloud-target.test.ts tests/processor-http.test.ts` (after final test adjustment) | Exit 0, **7 passed / 2 files** — LOCAL ONLY, actual loopback HTTP, no hosted processor | `docs/cloud-targeted-tests.log` |
| `npm.cmd run lint` (after final harness edits) | Exit 0 — LOCAL ONLY | `docs/cloud-final-lint.log` |
| `npm.cmd run format:check` (after formatting) | Exit 0, all matched files formatted — LOCAL ONLY | `docs/cloud-format-check.log` |
| `npm.cmd run test:cloud-catalog` | Exit 0, **10 measured structural assertions**, all 19 migrations — LOCAL ONLY, Auth/Storage stubs | `docs/cloud-catalog.log` |
| `npm.cmd run typecheck:edge` | Exit 0, all **four handlers** — LOCAL ONLY | `docs/cloud-edge-types.log` |
| `npm.cmd run test:edge` | Exit 0, **3 passed / 0 failed** — LOCAL ONLY | `docs/cloud-edge-tests.log` |
| `npm.cmd audit --audit-level=moderate` | Exit 0, **0 vulnerabilities** reported — LOCAL ONLY, not complete security assurance | `docs/cloud-audit.log` |
| `npm.cmd run check:bundle` | Exit 0, initial JS **120,049 gzip bytes**, CSS **9,941 gzip bytes**; connected SDK chunk excluded from entry budget | `docs/cloud-bundle.log` |
| `npm.cmd run evaluate:ranking` | Exit 0, 1,000 synthetic candidates / 20 runs, precision@10 1; median 1.834ms, p95 28.055ms — not human relevance/network latency | `docs/cloud-ranking.log` |
| `npm.cmd run test:production` | Exit 0, actual local Chromium missing-config state; no synthetic fallback, **0 backend requests / 0 uncaught errors**, FCP 572ms, LCP 672ms, CLS 0.002377 — unthrottled local only | `docs/cloud-production.log`, `docs/verification/production-smoke.json`, fresh setup screenshot |
| `npm.cmd run test:e2e` (sequential rerun) | Exit 0, **47 passed / 0 failed**, 6.5 minutes; automated axe, demo interactions, responsive/history/focus/motion coverage — LOCAL ONLY, not connected staging | `docs/cloud-final-e2e.log` |
| `npm.cmd run cloud:preflight` | Exit 0, 19 migration hashes, no actual env files, 112 recovery files — LOCAL ONLY | `docs/cloud-preflight.log`, preflight manifest |
| `npm.cmd run cloud:plan` | Exit 2, **BLOCKED — USER CONFIGURATION**, no valid target, no remote operation | `docs/cloud-plan.log` |
| `npm.cmd run test:cloud-http` | Exit 2, **BLOCKED — USER CONFIGURATION**, no valid target/config; **zero live acceptance requests** | `docs/cloud-http-gate.log`, `docs/verification/cloud/http-results.json` |
| Backend fingerprint comparison | All **40** prior hashes unchanged — LOCAL ONLY | `docs/verification/cloud/backend-preservation.json` |

The production build transformed 2,166 modules and finished in 46.52s. Rollup emitted nonfatal Zod pure-annotation placement warnings, removed those comments and produced the bundle; no application build error occurred. Browser/terminal environment also emits a nonfatal NO_COLOR/FORCE_COLOR warning. Dependencies were already installed; `npm ci` was documented but not run in this task. Native local Supabase/Docker tests, hosted pgTAP, managed Auth/SMS/CAPTCHA, real provider/Storage calls and Advisors were not run and are not counted as passing.

## Remaining gates, risks and resume action

See [RELEASE_READINESS.md](RELEASE_READINESS.md) for every explicitly unverified live category. No staging project was guessed or adopted. Local CLI authentication is unavailable. Once the new isolated target is supplied, verify its actual name/ref, authenticate locally, inspect remote ledger and dry-run, then apply/deploy only that intended staging project. Cloud setup includes the complete remaining real-user and browser matrix, not just this harness's subset.

Separate subsequent prerequisites: hosted phone provider and regional approvals/cost decisions, hCaptcha credentials/domain settings, real consenting role-separated accounts and human academic review, scholarly service contact settings, an authorized always-on HTTPS first-party processor, real private Storage signed-link lifecycle, disposable-account export/deletion/revocation tests, actual Advisors and recovery tests. Their values must be entered locally/Dashboard, never in chat or reports.

Storage's existing signed URLs can survive member removal until their 60-second expiry. The tombstone worker is bounded and acknowledges only successful removals; actual hosted retry/object removal and orphan inventory are unverified. Failed compensation can leave unrecorded orphans, so queue success alone is insufficient. No destructive retention/cleanup schedule was installed. Academic credential/PDF ingestion remains disabled pending reviewed validation/scanning. Source timeouts/429/malformed-response simulations must not be labeled genuine provider events. Free-tier pause/quotas/SMS billing and processor sleep/latency need current plan review, not a free-hosting promise. No production backup/restore was attempted.

Current official sources were reviewed: [migrations](https://supabase.com/docs/guides/deployment/database-migrations), [functions/deployment](https://supabase.com/docs/guides/functions/deploy), [secrets](https://supabase.com/docs/guides/functions/secrets), [Auth headers](https://supabase.com/docs/guides/functions/auth-headers), [phone Auth](https://supabase.com/docs/guides/auth/phone-login), [CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha), [rate limits](https://supabase.com/docs/guides/auth/rate-limits), [private bucket fundamentals](https://supabase.com/docs/guides/storage/buckets/fundamentals), [production checklist](https://supabase.com/docs/guides/deployment/going-into-prod), [billing](https://supabase.com/docs/guides/platform/billing-on-supabase), [Sharp install](https://sharp.pixelplumbing.com/install/) and [Render free-service behavior](https://render.com/docs/free). The free sleeping processor tier conflicts with the current eight-second timeout; no host has been provisioned or purchased. All hosted findings/settings remain unknown.

**Earlier next action, now resolved by the confirmed reference:** Provision and designate a new isolated staging project. The user has supplied `ibxubsegrabpspopdgep`; the current remaining first action is local CLI login, described above. No additional project needs to be created.

Final preservation evidence: 20 current sanitized JSON reports scanned with zero private-field, personal-UUID or token-pattern findings; 30 original backend/config/package files remain unchanged. Final source preflight copied 132 allowlisted files to ignored `.cloud/backups/2026-10-13T02-11-27-645Z`. This is source recovery only, not hosted database/Auth/Storage backup or exhaustive secret detection. Final ESLint, Prettier and TypeScript checks exited0.
# Final autonomous acceptance checkpoint — 2026-10-13

**NOT PRODUCTION READY.** [Complete current evidence, commands and gate matrix](FINAL_COMPLETION_REPORT.md). This checkpoint supersedes older migration/advisor/test counts below within its stated scope.

- Confirmed staging `ibxubsegrabpspopdgep` remains ACTIVE_HEALTHY. Reviewed migration20 changes only17 RLS UID evaluations; supported exact-plan dry run, apply and no-pending readback succeeded. Original19 migrations and Edge handlers remain unchanged. Hosted29/29RLS, no client DML/unsafe definer paths, three private buckets/four active JWT functions.
- [Fresh A/B evidence](verification/cloud/persistence-2026-10-13T06-50-17-816Z.json):152 live passes,0 failures,2 blocked categories. Known populated profile/preference isolation and persistence both directions, independent contexts/refresh/logout/login; original fixtures restored. Signup0, console0/exceptions0. Empty protected records are not populated isolation proof.
- [Delayed actual response](verification/cloud/account-switch-race-2026-10-13T06-54-21-850Z.json):10/10. [Managed revocation](verification/cloud/revocation-2026-10-13T07-15-07-340Z.json):5/5; A global logout rejects another A refresh while B renews. Existing access JWT validity until expiry is documented.
- [Export/local recovery](verification/cloud/personal-recovery-2026-10-13T07-09-54-141Z.json):8 checks. Actual owner exports encrypted with DPAPI; core profile/preferences reconstructed and read back in independent local PostgreSQL after20 migrations. No full database/Auth/Storage or off-device recovery claim.
- [Advisor readback](verification/cloud/final-audit-2026-10-13T06-43-15-298Z.json):17 performance warnings fixed;11WARN remain (10 intentional guarded definer RPCs,1 unavailable paid breach feature). Separate error-level query0. Each RPC disposition is in the final report; no warning suppression.
- Real Crossref/PubMed upstream metadata requests returned200. Application search/cache remains blocked by genuine member fixtures and authorized contacts. Actual processor503 stays honest. Added local image expansion/rotation/dimension checks and cleanup batch/path/retry/dry-run safeguards.
- Recovery preflight exits2/no artifact; latest preview customSMTP=false. No hosted custom-template installation, mailbox access, additional mail request or successful reset. Phone/academic/staff flags unchanged.
- [Final regression](verification/final-2026-10-13T07-16-52-955Z/results.json):17/17 commands exit0.85unit/122SQL/26catalog/6planner/6Edge/47demo; four Edge type checks;12 connected anonymous routes/four sizes/34snapshot200; four connected recovery sizes. Format/lint/types/build/bundle/production/source checks pass, npm audit0; isolated offline265-package install succeeds.
- Fresh anonymous1440/320 and recovery390/320-action screenshots inspected. Original frontend, original backend sources and lockfile preserved;152-file source backup. No dependency addition, reset, account deletion, paid resource, commit or frontend publication.

Mandatory gates remain: delivered recovery/reset; legitimate phone/academic/staff/member positives and protected fixtures; scholarly contacts/cache; TLS processor/private media lifecycle; deletion/retention/orphan reconciliation and full database/Auth/Storage recovery. One next private owner action is specified in the final report; no more signup.

Historical checkpoints follow.

---

