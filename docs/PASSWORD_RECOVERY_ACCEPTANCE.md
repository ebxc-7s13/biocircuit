# Password recovery — COMPLETE AND LIVE-VERIFIED (2026-10-14 09:21Z)

**The real password reset for account A succeeded against hosted staging `ibxubsegrabpspopdgep`.** It used the delivered email link (request 09:19:46Z, HTTP 200), the normal connected recovery UI and managed Auth only. No admin API, no database write and no signup. [Evidence](verification/cloud/delivered-recovery-2026-10-14T09-21-23-999Z.json): **11/11 PASS — LIVE**:
- original password signed in before the reset;
- the hosted recovery session belonged to A before any change;
- the password editor was established through managed Auth;
- the link was stripped from the URL;
- hosted password update succeeded;
- the rotated credential was encrypted locally (DPAPI), with an encrypted backup of the original in `.cloud/recovery-original-A-*.xml`;
- **the old password is rejected** (HTTP 400 `invalid_credentials`);
- **the new password signs into the same identity**;
- **phone confirmation, membership, suspension and role count are unchanged**;
- **reusing the link is refused** (no password editor);
- no uncaught exception and no sensitive console output.

Auth sequence: verify 303 → `/auth/v1/user` 200 (identity checks and the update) → logout 204.

Afterwards, the race 10/10, adoption 6/6 and revocation 5/5 live suites passed with the rotated credential. The spent encrypted recovery inputs were deleted. Expired/used real-link refusal was verified live earlier (6/6).

This required fixing two application defects found with real links (AMR `otp` for hosted implicit flow; app-shell remount on `SIGNED_IN`), described below. Still out of scope: the custom email template (Free/default SMTP restriction) and PKCE.

---
# Password recovery — 2026-10-14 afternoon: two real-link defects found and fixed

**Status: PARTIAL — real reset still NOT performed; account A's password is unchanged** (the original password signed in before every attempt and after the final check). Two fresh delivered links (requests 08:13Z and 08:20Z, HTTP 200) were **accepted by hosted Auth**: verify 303 → `access_token, expires_at, expires_in, refresh_token, sb, token_type, type`, and the page offered "Continue recovery". Both attempts then silently returned to the request form before the password editor, so no update was sent. Each link is now used. Evidence: [08:16Z](verification/cloud/delivered-recovery-2026-10-14T08-16-45-755Z.json), [08:24Z](verification/cloud/delivered-recovery-2026-10-14T08-24-23-368Z.json) (four `GET /auth/v1/user` 200, no update request).

## Root causes (application defects, now fixed)

1. **AMR mismatch.** The page required AMR method `recovery`. Hosted Auth's implicit email-link flow issues `models.OTP` for every verify type ([supabase/auth `verify.go`](https://github.com/supabase/auth/blob/master/internal/api/verify.go): `issueRefreshToken(..., models.OTP, ...)`); only PKCE carries `recovery`. Every genuine default-flow link was therefore refused. **Fix** (`src/domain/recovery.ts`, `src/features/Recovery.tsx`): accept `recovery`, or `otp` only when its timestamp falls within 3600 s after the hosted-verified user's `recovery_sent_at` and within 3600 s of now (±120 s skew). A's live user record exposes `recovery_sent_at` (08:13:07Z), and it is retained after verification. Password sessions and OTP sessions issued before a recovery email (for example a phone login) are still refused.
2. **App-shell remount.** Adopting the session fires `SIGNED_IN`. The shell (`src/Workbench.tsx`) then reloads community data and replaced the page with the "Loading research…" skeleton, which unmounted `Recovery` and discarded its in-memory one-time session. The page silently restarted at the request form. **Fix:** `/account/recovery` is never swapped for the loading skeleton (Recovery uses no community data). Also hardened: `SIGNED_IN` is ignored only while the page is adopting its own exchanged session (matters for the code/`verifyOtp` path). The getSession same-session/same-user checks still decide. A different account signing in afterwards still clears the editor.

Why earlier tests missed these: the component tests render `Recovery` in isolation with a mock client that never emits events. The live boundary runs only exercised refusals.

## New live coverage that spends no email: `npm run test:recovery-adoption`

`scripts/test-recovery-adoption-staging.mjs` presents A's real hosted ordinary session as a default recovery fragment:
- **Unmodified app:** refuses it.
- **Adoption leg:** with only the AMR method check stubbed in the test browser, the real flow (hosted getUser, setSession, SIGNED_IN, shell reload, getSession checks) must reach the password editor. It then cancels, sends no update request, and confirms the original password still works.

Results:
- **6/6 PASS — LIVE** ([evidence](verification/cloud/recovery-adoption-2026-10-14T08-32-28-763Z.json)).
- **Negative control:** with the shell fix temporarily reverted, the same check **fails** ([evidence](verification/cloud/recovery-adoption-2026-10-14T08-33-28-486Z-negative-control.json)). The fix was then restored.
- Unit tests now include the real-client event ordering (link and code paths; both failed before the fix) and the `otp`/`recovery_sent_at` rules: recovery tests **31/31**.

## Remaining step

The default sender allows 2 emails per hour (08:13Z and 08:20Z used). From about **09:21Z (14:51 IST)**:
1. `npm.cmd run recovery:request`.
2. Copy the newest link address without opening it.
3. `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/set-staging-recovery-input.ps1 -Account A -Mode Link`.
4. `npm.cmd run recovery:reset`, or ask Claude to run it.

---
# Password recovery — 2026-10-14 delivered-link run

**Status: PARTIAL — real reset NOT performed.** Account A's password was **not changed**. The delivered link saved through the private helper had already been used (`otp_expired`) when the reset ran, so hosted Auth issued no recovery session. A fresh link is the only missing input. Fixes and diagnostics made today ensure the next link is used safely.

## What is now proven live (actual hosted Auth, account A)

| Requirement | Result | Evidence |
| --- | --- | --- |
| Recovery email delivery | **CONFIRMED BY OWNER**: four 2026-10-13 emails and later 2026-10-14 emails reached A's inbox. Claude did not access the mailbox. | owner statement |
| Request through the real UI | PASS — LIVE: HTTP 200 at 04:36:29Z and 06:41:18Z (request acceptance only) | [04:36](verification/cloud/recovery-request-2026-10-14T04-36-29-837Z.json), [06:41](verification/cloud/recovery-request-2026-10-14T06-41-18-651Z.json) |
| Delivered link shape | PASS — LIVE: hosted `/auth/v1/verify`, `type=recovery`, `redirect_to` exactly `http://127.0.0.1:5190/account/recovery` (structural check only; no value recorded) | [used-link run](verification/cloud/expired-recovery-2026-10-14T07-08-56-825Z.json) |
| Expired/used real link refused | PASS — LIVE 6/6: verify 303 → `#error=…&error_code=otp_expired&…&sb=` (empty `sb`), no session, safe alert, no password editor, URL stripped, original password still signs in, no uncaught exception | [run 1](verification/cloud/expired-recovery-2026-10-14T07-08-30-345Z.json), [run 2](verification/cloud/expired-recovery-2026-10-14T07-08-56-825Z.json) |
| State checked before retrying | PASS — LIVE: the original password signed in before each attempt; no attempt reached the password-update API | [06:44](verification/cloud/delivered-recovery-2026-10-14T06-44-47-057Z.json), [07:07](verification/cloud/delivered-recovery-2026-10-14T07-07-18-783Z.json) |
| Callback ready before the link is opened | PASS — LOCAL: `npm run recovery:serve` 5/5 at the exact origin | [health](verification/cloud/recovery-serve-health.json) |
| Successful reset, new password works, old rejected, flags/roles unchanged, reused successful link refused | **NOT YET VERIFIED** — needs one fresh unused link | — |

## Diagnosis

1. **Owner's first click (2026-10-13 link):** Auth redirected with `otp_expired` because the link was older than the hosted `otp_expiry` (3600 s). Three of the four links had also been superseded by later requests. The redirect target was the exact allowlisted URL, not `site_url` (`http://localhost:3000`), so the redirect configuration was correct. No token exchange happened. `ERR_CONNECTION_REFUSED` was a second, independent cause: nothing served 127.0.0.1:5190 outside test scripts. Fixed by `npm run recovery:serve`.
2. **06:44Z attempt (saved 06:43Z input):** `test-delivered-recovery-staging.mjs` confirmed the original password, opened the link, then timed out waiting for "Continue recovery". That version recorded only the step name. The 07:07Z rerun with structural diagnostics showed verify 303 → `otp_expired`, so the link was already consumed or expired. Supabase returns the same code for both, so the exact cause of the earlier failure **cannot be determined**. Possible causes: the 06:44 navigation used it, a link from an older superseded email was entered, or the link was opened or prefetched before the script ran. No password was changed in either attempt.
3. **Latent defects fixed before the next link:**
   - `sb` marker: hosted redirects append an empty `sb` (now observed live). The fragment allowlist accepts exactly one empty `sb` and still rejects any non-empty one.
   - Refresh-token shape: the structural check was `[A-Za-z0-9_-]{12,512}`, which could reject a longer or dotted token from a newer Auth release. It is now `[A-Za-z0-9._~-]{8,2048}`. Authorization is unchanged: hosted `getUser`, the recovery AMR and same-session checks remain the gates.

## Changes

- `src/domain/recovery.ts`: `sb` marker and refresh-token shape (above). `tests/recovery-arrival.test.ts`: exact `otp_expired` fragment rejected, empty/non-empty `sb`, dotted/short/unsafe refresh tokens. Recovery tests **26/26**.
- `scripts/test-delivered-recovery-staging.mjs`: records verify status, redirect parameter **names** and the allowlisted error code. It waits for either "Continue recovery" or the alert, so a dead link fails fast with a cause. Password logic is unchanged.
- `scripts/test-expired-recovery-staging.mjs`: `--consumed` (`npm run recovery:used-link`) reuses the already-used saved link as a negative test. Records `sb` shape (empty/non-empty) only.
- `scripts/set-staging-recovery-input.ps1`: before collecting input, shows the newest request's deadline (or warns if it expired) and says to use only the newest email without clicking it. `-Expired` mode for old links.
- `scripts/serve-recovery.mjs` (`npm run recovery:serve`, `--check-only`), `scripts/request-staging-recovery.mjs` (`npm run recovery:request`), `npm run recovery:reset`.

## Remaining step (owner, ~2 minutes, within one hour of the request)

1. `npm run recovery:request` (sends one email to A; the default sender allows 2 per hour).
2. In the **newest** email, right-click "Reset Password" → Copy link address (do not click).
3. `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/set-staging-recovery-input.ps1 -Account A -Mode Link`, then enter the link and a new 12+ character password twice (hidden input).
4. Immediately run `npm run recovery:reset` (or ask Claude to). The script:
   - uses the link once through the real UI;
   - checks the recovery session belongs to A, then updates the password;
   - saves the new credential encrypted, with an encrypted backup of the old one (`.cloud/recovery-original-A-<ms>.xml`);
   - checks that the old password is rejected and the new one works;
   - checks phone, membership, suspension and roles are unchanged, and that reusing the link is refused.

---
# Password recovery — 2026-10-14 re-analysis

**Status: BLOCKED BY EXTERNAL CONFIGURATION (owner inbox check).** No new recovery email was requested in this run (default sender is limited to 2/hour and earlier requests already exist), no mailbox was accessed and no password was changed.

New evidence analysis (no new requests): four separate hosted `POST /auth/v1/recover` requests for account A on 2026-10-13 (05:43–05:49Z, each more than 60 s apart) returned **HTTP 200** ([example](verification/cloud/password-recovery-2026-10-13T05-49-20-685Z.json)). Supabase documents the error code [`email_address_not_authorized`](https://supabase.com/docs/guides/auth/debugging/error-codes) — "Email sending is not allowed for this address as your project is using the default SMTP service" — for recipients outside the project's organization. No such error was observed. **Inference, not proof:** A's address is likely an eligible team address and the messages were likely handed to the built-in mailer, so the owner's inbox check is meaningful. API acceptance is still not delivery; receipt, reset, new-password login, old-password denial, replay denial and real expiry remain unverified. The hosted custom template remains uninstalled (custom SMTP required).

Unchanged: hosted minimum password length 12, exact redirect allowlist, generic request notices, local recovery UI/tests. Single owner action: see [AUTONOMOUS_COMPLETION_REPORT.md](AUTONOMOUS_COMPLETION_REPORT.md#single-owner-action).

---
# Free password recovery acceptance

## Baseline — 2026-10-13

Specification `BIOCIRCUIT_FREE_PASSWORD_RECOVERY_PROMPT.md` read completely. Existing staging is `ibxubsegrabpspopdgep`; accounts A/B already exist and must not be registered again. Prior two-user acceptance (152 passes, two external gates) and delayed-response privacy regression (10 passes) remain separate evidence.

Existing implementation: public `/account/recovery`, managed `resetPasswordForEmail`, numeric `verifyOtp(type: recovery)`, `getUser` identity check before `updateUser`, strong password/confirmation validation, request cooldown, verification attempt limit and sign-out after reset. URL session detection is disabled. Four mocked component tests and four connected anonymous viewport checks previously passed. Request200 did not prove delivery or reset.

Defects/limits under inspection: local code-only template has minimal email structure; hosted installation was previously unverified; no callback link handling; recovery identity is not tied to a particular session; asynchronous completions/unmount/cancellation need review; generic unknown-account errors and token URL sanitation need tests. Preserve all visual design and authorization policies.

The existing CLI supports authenticated selective `config diff/push` and `config pull --dry-run`. First read-only staging preview succeeded; allowed redirects are empty and email OTP length is8. Browser connector attempts for Edge, Chrome and in-app browser all returned unavailable; headless Playwright remains available for application tests. No credential export or external account creation.

## Execution checklist

- [x] COMPLETE: exact healthy staging identity and hosted sender/configuration preview.
- [x] COMPLETE: current official free-sender research; existing-account SMTP credential availability remains unproven.
- [x] COMPLETE: recovery client/template refinement and exact hosted loopback redirect installation/readback.
- [ ] BLOCKED: hosted custom template installation requires a configured custom SMTP sender on this new free project.
- [ ] BLOCKED: actual receipt, successful reset, new/old-password login and genuine used/expired-artifact acceptance.
- [x] COMPLETE within stated scope: callback, session, cancellation, validation, privacy, accessibility and build checks.
- [x] COMPLETE: next independent free gate, hosted password minimum raised6→12 and read back; release reports updated.

## Actual results

**NOT PRODUCTION READY.** No actual password reset, account registration/deletion, paid service, frontend publication or database reset occurred. No delivery/receipt is claimed.

- [11 live checks](verification/cloud/password-recovery-2026-10-13T05-49-20-685Z.json) passed: real UI recover200, identical unknown reserved-address notice, no password editor from request acceptance, malformed/incomplete artifact sanitation, explicit hash continuation and actual hosted invalid-hash403. A's phone, private membership and staff-role boundaries remained unchanged.
- [10 final boundary-only checks](verification/cloud/password-recovery-2026-10-13T06-16-24-548Z.json) passed without sending another email. A's genuine ordinary managed password session was presented as a recovery fragment: hosted getUser verified the token, but absent recovery AMR prevented adopting it or opening the password editor. URL fragments were scrubbed before interaction. All negative contexts were monitored for exceptions and sensitive console output. The11/10 runs overlap; they are not21 unique requirements.
- [Real receipt preflight](verification/cloud/delivered-recovery-2026-10-13T06-08-31-391Z.json): BLOCKED, private delivered-artifact input absent. No secrets were read, no Auth request/reset/credential overwrite occurred. A request200 is not mailbox receipt or confirmation that the recipient is an authorized team address.

## Hosted configuration: what changed and what did not

Installed exact redirect `http://127.0.0.1:5190/account/recovery` using supported installed CLI2.120.0 selective `config diff/push` in an ignored isolated workdir. Original allowlist was empty; no existing redirects were removed. [Actual update/readback](verification/cloud/recovery-config-2026-10-13T05-33-49-506Z.json) records only `auth.additional_redirect_urls` updated; subsequent fresh read was up_to_date. It did not install template content despite that historical JSON field's generic `contentReadback` label; the current script labels redirect readback explicitly.

Hosted template installation was attempted through the same authenticated supported CLI after preview/source review. Auth returned **HTTP400 / ConfigPushAuthUpdateStatusError**, classified as the free/default-sender template restriction; no raw platform response was logged. [Current official June2026 policy](https://supabase.com/changelog#changes-to-email-template-customisation-on-free-tier) prohibits custom templates for new free projects using default SMTP. No fake SMTP was enabled and no plan was upgraded. The rejected combined Auth request did not install the redirect; the separate redirect-only update did.

[Latest read-only preview](verification/cloud/recovery-config-2026-10-13T06-08-29-913Z.json): custom SMTP=false, exact redirect matches, hosted subject differs from the reviewed local subject. **Local recovery.html is NOT installed in hosted staging.** Current configurator blocks unattended template retries until SMTP is genuinely configured. It uses the existing CLI credential store; no access-token export.

Next independently feasible security improvement: hosted minimum password length was6 while client validation required12. Preview contained exactly this leaf. [Actual change/readback](verification/cloud/recovery-password-policy.json) proves `auth.minimum_password_length=12`; no account's password changed, no provider, phone, membership, role, RLS or SQL change. Paid leaked-password protection was not enabled. This metadata check is not a claim that a successful reset or every server password policy has been exercised.

## Free sender decision and trade-offs

1. Prefer the already-configured **Supabase default sender** for bounded controlled staging receipt if the recipient is already an authorized organization/team address. Official [SMTP limits](https://supabase.com/docs/guides/auth/auth-smtp): currently2 messages/hour, team-only and best-effort. Never add a team member to bypass delivery. Actual recover200 is insufficient to prove this eligibility. The client now supports the default sender's genuine managed link; custom templates are separately restricted.
2. No existing SMTP credentials or owned verifiable sending domain were available. An existing controlled inbox is a consumer Gmail candidate (boolean only recorded; address kept private). **Conditional zero-cost staging customization choice:** an already-owned, approved **dedicated** free Gmail sender with an eligible app password. [Google app-password requirements](https://support.google.com/accounts/answer/185833) require2-Step Verification and may be unavailable with Advanced Protection, organization restrictions or security-key-only setups. [Gmail SMTP settings](https://support.google.com/mail/answer/7104828): authenticated smtp.gmail.com/TLS587. [Consumer limits](https://support.google.com/mail/answer/22839) include500/day and temporary delivery blocks; keep staging rate limits far lower. No subscription, Workspace upgrade or domain is needed for the consumer account. Eligibility/authentication/delivery are **NOT VERIFIED**. Do not repurpose the BioCircuit login password or provision a personal mailbox credential automatically: app passwords are broadly privileged; use an approved dedicated sender, keep the credential only in trusted Supabase SMTP settings and revoke it when finished. No account security settings were changed.
3. [Resend Free](https://resend.com/pricing) lists3000/month/100 per day; its [test domain](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain) is own-account-recipient-only. Its [SMTP guide](https://resend.com/docs/send-with-smtp) lists a verified-domain prerequisite even though examples use test addresses. Domainless SMTP compatibility was not assumed proven; no provider credential/verified owned domain exists and no domain was bought. Paid overages/add-ons remain off.
4. [Brevo Free](https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans) lists300/day without a time limit/card, but requires a privately activated transactional account and authorized sender. [Sender compliance](https://help.brevo.com/hc/en-us/articles/14925263522578-Comply-with-Gmail-Yahoo-and-Microsoft-s-requirements-for-email-senders) includes authentication/replacement behavior for free-address senders. No account, activation, SMTP credential or deliverability was assumed. This is a fallback to investigate privately if the dedicated Gmail route is unavailable, not a proven integration.

No API email library, paid Auth Hook, metered automation, AI service or extra dependency was added. Built-in delivery may complete the reset without a custom template if an actual message arrives; customization still requires a genuine free SMTP configuration.

## Implementation and security choices

- `src/domain/recovery.ts` captures supported token-hash queries and default recovery fragments in memory only, restricts purpose/format/duplicates, scrubs query/fragment with replaceState before router startup, and exposes no general URL session detection. Correct provider SHA224 hash format56 hex and current refresh-token minimum12 came from official Auth source and actual diagnostics.
- `src/main.tsx` performs early sanitation. `index.html` adds no-referrer protection before asset loading. No separate recovery code/hash/context flag enters local/session storage, analytics, report or screenshot. After managed verification, SDK session persistence remains the established architecture, including the validated session bearers from a default link. This is not a claim that authenticated session tokens are absent from SDK local storage.
- `src/features/Recovery.tsx` preserves design; adds explicit Continue recovery, invalid/error handling, cancellation and existing-code entry without a resend. Hash/code exchange uses managed verifyOtp(type=recovery). Default fragment path requires hosted getUser verification and the [signed recovery AMR method](https://supabase.com/docs/guides/auth/jwt-fields) before setSession. Unsigned claims/local flags/ordinary sessions cannot open the editor. Editor binds to managed user and stable session ID; same-session refocus and token refresh remain allowed (installed SDK may re-emit SIGNED_IN), different-session login/logout invalidates it. Late/unmounted async work is ignored. Client strength/confirmation validation remains12-128 characters; Auth update errors stay generic.
- Generic request notice is identical for success, unknown account and provider errors, without claiming receipt. Duplicate in-flight requests,60-second cooldown and five-code attempt limit remain; backend expiry/rate limits/CAPTCHA are never bypassed. Existing-code entry is not verification. Actual successful update uses SDK signout; revoked refresh tokens do not imply immediate revocation of every already-issued access JWT.
- Template is accessible inline table HTML with only documented Token/TokenHash/RedirectTo variables. TokenHash link uses the app's allowlisted recovery route and explicit confirmation to reduce scanner consumption. No user metadata, marks, profile data, custom domain, images, trackers or remote script. Provider tracking must remain disabled.
- Local real-delivery helper uses Windows DPAPI for artifact/new password. Continuation validates exact staging/local URLs, selected account identity **before** update, preserves an encrypted original credential copy, saves rotated credentials privately after actual success, and tests old/new login plus reuse. It makes no administrative API or signup call. This positive harness is **prepared/static checked only**, never claimed as an executed reset. A separate truly expired real artifact is still required for actual expiry acceptance.

## Verification actually executed

| Check | Result |
| --- | --- |
| `npm.cmd run format:check`, `lint`, `typecheck` | PASS |
| `npm.cmd test` |76/76 in14 files; includes22 recovery tests (mocked/local, not receipt evidence) |
| `node node_modules/@playwright/test/cli.js test` |47/47 in5.4m; existing demo regression/a11y/motion suite |
| `node scripts/test-password-recovery-staging.mjs` |11 live passes/one external gate; no successful reset |
| Same runner `--boundary-only` |Final10 live passes/one external gate; no email sent |
| `node scripts/test-recovery-staging.mjs` |1440x900,1024x768,390x844,320x700; public snapshot200, axe0, overflow0, console0, exceptions0, Auth requests0; all actions reachable above fixed mobile rail after native scroll |
| `node scripts/test-delivered-recovery-staging.mjs --preflight-only` |BLOCKED exit2, no actual receipt input; no password write |
| Native CLI selective config preview/update/readback |Exact redirect and minimum12 verified; custom template rejected400 |
| `npm.cmd run build`, `check:bundle` |PASS; initialJS gzip122505 bytes, CSS9993; recovery lazy2710; connected SDK adds59320 gzip bytes |
| `npm.cmd audit --audit-level=moderate` |0 reported vulnerabilities |
| `npm.cmd run test:production` |PASS, missing configuration fails closed; setup=true, synthetic=false, remote requests0, exceptions0; local FCP324/LCP380ms/CLS0.002377, not live-feed performance |
| PowerShell helper parser |0 syntax errors; interactive receipt input not executed |
| Database/Edge verification |Prior122 localSQL/3Edge checks retained; source unchanged, not rerun in this recovery-only task; full positive hosted member/staff gates still blocked |

Failures were retained, not relabelled: initial forks worker startup timed out, then thread/default runs passed. Harness initially used two incorrect schema names, assumed recover200 had a JSON body and selected a global status role; fixed against actual migrations/response/scope. Two connected harnesses briefly competed for the same local port; sequential runs passed. Initial fragment validation rejected provider's12-character refresh token; official source confirmed the format, it was corrected and genuine-session negative acceptance passed. No assertions were removed. No A/B registration or password mutation was used to fix test readiness.

Screenshot files `docs/screenshots/staging/recovery/{1440x900,1024x768,390x844,320x700}.png` and phone `*-actions.png` were captured. Desktop/tablet/phone images were actually opened and inspected. Long320px actions require native scroll; scrolled action capture proves reachability, initial capture preserves hierarchy. No authenticated screen or private artifact was captured. Source backup allowlist now includes HTML/PowerShell so the template/helpers are recoverable, excluding all actual credentials and local cloud state.

## Precise next action

First check the **controlled A inbox privately**, including spam, for the already requested email; do not send repeated requests to work around quotas. If it arrived, in the existing project terminal run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/set-staging-recovery-input.ps1 -Account A -Mode Link
# Or -Mode Code if the installed sender actually included a code.
node scripts/test-delivered-recovery-staging.mjs
```

Enter the actual artifact and new unique password only in the local secure prompts. The full continuation changes the selected staging password and protects the corresponding DPAPI credential; do not run it blindly again after success. No link/code/password belongs in chat. A submitted browser-local marker or fabricated code is not acceptable.

If no message arrives, supply a genuinely approved free sender: for an eligible already-owned dedicated consumer Gmail account, create a dedicated app password privately with2SV, then set **existing staging Dashboard → Authentication → Emails/SMTP**: host smtp.gmail.com, TLS587, username/sender the full approved sender address, password the app password, sender name BioCircuit. Keep free plan, low quotas and no tracking. Never use the Google account password or a Workspace/paid relay. Do not disable2SV/Advanced Protection to force availability; use the documented fallback instead. Credential creation and mailbox verification require the account owner; current dashboard browser connector and Gmail connector are unavailable.

After a genuine sender is configured:

```powershell
node scripts/configure-staging-recovery.mjs
# Review the sanitized preview: only recovery subject/exact redirect changes.
node scripts/configure-staging-recovery.mjs --apply-reviewed
```

That pushes reviewed `supabase/templates/recovery.html` to hosted Auth and checks fresh hosted content equality through the CLI encoder. Until this succeeds, local HTML is only preparation. Then request once through the UI and use the actual delivered artifact. No production-readiness declaration until delivery/reset/reuse/expiry and the other protected/integration/operational gates genuinely pass.

Automatic review rejected an initial raw local configuration read (replaced with target assertion/sanitized inspection) and an invocation of the reset-capable harness without evidenced receipt input (replaced with explicit preflight-only). No rejected action executed; no secret was exposed. The remaining blocker is actual owner-controlled receipt/sender configuration, not permission for routine phases. No Git repository/branch/commit; no commits made.


## Important files and final preservation

Modified `src/features/Recovery.tsx`, `src/main.tsx`, `index.html`, `supabase/templates/recovery.html`, `tests/recovery.test.tsx`, `scripts/test-recovery-staging.mjs`, `scripts/cloud-preflight.mjs`. Added `src/domain/recovery.ts`, `tests/recovery-arrival.test.ts`, `scripts/configure-staging-recovery.mjs`, `scripts/test-password-recovery-staging.mjs`, `scripts/test-delivered-recovery-staging.mjs`, `scripts/set-staging-recovery-input.ps1` and this report. Updated cloud acceptance/checklist/release reports and SETUP/SECURITY/FREE_RELEASE_PLAN. No dependency, lockfile, migration, Edge Function or existing source deletion. Removed only task-created unnecessary raw settings captures from ignored `.cloud/recovery-settings/`; sanitized evidence histories remain.

[Final privacy/preservation evidence](verification/cloud/recovery-privacy-preservation.json):19 new recovery JSON files conservatively scanned with0 private-field/personal-ID/token findings;30 protected source files compare unchanged against the prior `.cloud/backups/2026-10-13T02-11-27-645Z` backup. Current allowlisted source recovery copied140 files to `.cloud/backups/2026-10-13T06-16-04-300Z`. Neither source recovery nor pattern scanning proves hosted disaster recovery or complete security.
# Final autonomous continuation — 2026-10-13

Recovery remains **BLOCKED BY EXTERNAL CONFIGURATION** while independent work continued. [Latest full report](FINAL_COMPLETION_REPORT.md). Actual artifact preflight `delivered-recovery-2026-10-13T06-35-31-216Z.json` exits2 before reset; fresh supported configuration preview `recovery-config-2026-10-13T07-15-14-077Z.json` verifies customSMTP=false. No mailbox access, additional mail request or password change. The local template is still not installed in hosted Auth. Receipt/reset/old-password rejection/new-password login/reuse/real expiry are unverified.

Fresh connected recovery regression passes at1440×900,1024×768,390×844,320×700 with axe/overflow/action reachability, Auth requests0 and console/exceptions0.390px initial and320px action screenshots actually inspected. Full85-unit/47-demo suites pass; these are not delivery proof. Separate actual global sign-out verifies A refresh revocation while B survives. Owner exports were encrypted and restored only to local profile/preference fixtures, not used as password recovery.

Follow the existing private receipt/sender instructions below. No paid SMTP/domain, identity bypass or fabricated artifact is a substitute. Final report lists all remaining release gates.

---

