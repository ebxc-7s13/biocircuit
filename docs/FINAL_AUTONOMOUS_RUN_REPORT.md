# Final autonomous run report — 2026-10-14

> **Final update 09:22Z, 2026-10-14 — password recovery COMPLETE AND LIVE-VERIFIED:** account A's real reset via the delivered link passed 11/11 ([evidence](verification/cloud/delivered-recovery-2026-10-14T09-21-23-999Z.json)). The new password works, the old password is rejected, phone/membership/suspension/roles are unchanged, and link reuse is refused. Release decision unchanged: **NOT PRODUCTION READY** (phone verification, member/staff positives, populated protected records, image processor, full restore, manual a11y/load and authorized deployment remain).


> **Update 08:40Z, 2026-10-14:** two fresh real links (08:13Z and 08:20Z requests) were accepted by hosted Auth, but the page fell back to the request form before the password editor. **The password is still unchanged.** Two application defects caused this, and both are fixed:
> 1. Hosted implicit-flow sessions carry AMR `otp`, not `recovery`. The page now accepts `otp` only within 3600 s after the verified user's `recovery_sent_at`.
> 2. The app shell unmounted the recovery page while reloading community data after `SIGNED_IN`.
>
> New live check `npm run test:recovery-adoption` passes 6/6 against hosted Auth, with no email or password change ([evidence](verification/cloud/recovery-adoption-2026-10-14T08-32-28-763Z.json)). It fails with the fix reverted ([negative control](verification/cloud/recovery-adoption-2026-10-14T08-33-28-486Z-negative-control.json)). Regression **20/20** ([results](verification/final-2026-10-14T08-33-42-742Z/results.json)): 94 unit, 47 demo browser. A real reset still needs one more email after the hourly sender limit resets (~09:21Z). Details: [PASSWORD_RECOVERY_ACCEPTANCE.md](PASSWORD_RECOVERY_ACCEPTANCE.md).


Spec: `BIOCIRCUIT_CLAUDE_FINAL_AUTONOMOUS_RUN_PROMPT.md`. Checklist: [FINAL_AUTONOMOUS_RUN_CHECKLIST.md](FINAL_AUTONOMOUS_RUN_CHECKLIST.md). Target: `biocircuit-staging` / `ibxubsegrabpspopdgep` only.

## 1. Executive summary and release decision

**NOT READY FOR RELEASE.** This is the strongest verified staging candidate so far. The full 19-command regression passes. The live two-account persistence suite passes with 0 failures, after one live defect (avatar 404 console errors) was found, fixed and redeployed.

These gates remain open:
- the real password reset (one fresh email link needed);
- SMS phone verification (paid providers only);
- member, academic-approval and staff positives (no genuine reviewer);
- isolation of populated protected records;
- image-processor hosting;
- a full backup restore;
- manual accessibility and load checks;
- an authorized deployment.

Nothing was purchased, published, reset, registered or deleted. No role or flag was changed.

## 2. Password recovery outcome

**The password was NOT changed.** The encrypted saved input held a correctly formed link: hosted `/auth/v1/verify`, `type=recovery`, exact `redirect_to`. It was already unusable when the reset ran: Auth answered 303 → `error_code=otp_expired` and issued no session.

Before each attempt the original password was confirmed to still work, and no attempt reached the password-update API. The first attempt (06:44Z) logged too little to show whether the link was spent then or earlier. Possible causes: an older email's link was entered, or the link was opened or prefetched before the run. Supabase uses the same code for expired and used links.

Live-verified today:
- delivered-link shape;
- used/expired real link refused (6/6: safe alert, no password editor, URL stripped, original password intact);
- request acceptance (HTTP 200);
- owner-confirmed delivery.

Fixed before the next link:
- the empty `sb` marker that hosted redirects append (now observed live);
- a too-narrow refresh-token shape check;
- faster, diagnosable failure;
- a deadline warning in the helper.

Full detail: [PASSWORD_RECOVERY_ACCEPTANCE.md](PASSWORD_RECOVERY_ACCEPTANCE.md).

## 3. Live staging checks vs local tests

| Check | Kind | Result |
| --- | --- | --- |
| Account-switch stale-response privacy (A/B sign-in only) | LIVE | 10/10 — [evidence](verification/cloud/account-switch-race-2026-10-14T07-10-23-188Z.json) |
| Two-account persistence | LIVE | **175 PASS / 0 FAIL**, 12 LIMITED-EMPTY, 2 OBSERVED, 2 BLOCKED; both accounts restored and re-read — [evidence](verification/cloud/persistence-2026-10-14T07-18-28-119Z.json) |
| Session revocation | LIVE | 5/5 — [evidence](verification/cloud/revocation-2026-10-14T07-10-51-419Z.json) |
| Safe boundaries (flags, roles, privileged RPC) | LIVE | 24/24 — [evidence](verification/cloud/safe-boundaries-2026-10-14T07-10-58-824Z.json) |
| Anonymous ingress, CORS, Storage denials | LIVE | pass (`node scripts/test-staging-anonymous.mjs`) |
| Edge JWT/member gates | LIVE | unchanged: scholarly 429 non-member, 401 anonymous, exact CORS — [diagnostic](verification/cloud/edge-auth-diagnostic.json) |
| Retention schedule | LIVE | 5/5 (no natural run observed yet in these checks) — [evidence](verification/cloud/retention-schedule-2026-10-14T07-11-41-183Z.json) |
| Storage reconciliation | LIVE read-only | all counts 0 (empty store) — [evidence](verification/cloud/storage-reconcile-2026-10-14T07-11-44-079Z.json) |
| Advisors / functions | LIVE | 11 WARN unchanged; 4 functions ACTIVE, `verify_jwt=true` — [audit](verification/cloud/final-audit-2026-10-14T07-20-50-060Z.json) |
| Recovery: used real link | LIVE | 6/6 — [evidence](verification/cloud/expired-recovery-2026-10-14T07-08-56-825Z.json) |
| Full regression | mixed | **19/19** — [results](verification/final-2026-10-14T07-20-56-959Z/results.json). Covers 89 unit/component tests (15 files), SQL 125 (local PGlite, stubbed Auth/Storage), catalog 27 (local), planner 6, Edge 9, demo browser 47 (synthetic), connected browser (live anonymous), recovery UI at 4 viewports (live, 0 Auth requests), build, bundle, audit 0, production fail-closed smoke, source backup (162 files), retention and reconcile (live) |

## 4. Two-account privacy and persisted data

Live with A and B signed in (B by sign-in only; 0 signup requests):
- profile and preference writes persist across refresh, logout/login and independent clients;
- cross-user reads and writes are refused;
- role escalation and phone/membership flag edits are refused;
- the stale-response race regression holds.

Notifications, bookmarks, applications, roles, avatars and project images have **no populated rows**. These 12 records are labelled LIMITED, not counted as proof. Ordinary accounts cannot create them legitimately, and no seed was inserted.

## 5. Security and platform warnings

- **npm:** `npm audit` 0 vulnerabilities. `npm outdated` lists majors (vite 8, typescript 7, plugin-react 6, lucide 1.x) and patches. None carries an advisory, so they are deferred rather than blanket-upgraded.
- **Supabase advisors:** 11 WARN unchanged.
  - 10 × `authenticated_security_definer_function_executable`: reviewed definer RPCs with fixed `search_path` and internal checks.
  - 1 × `auth_leaked_password_protection`: paid-only feature.
- **Defect fixed:** the `avatar` Edge Function returned **HTTP 404 for "no avatar yet"**. Every profile view by a user without an image logged a browser console error, which failed the live persistence suite (5, then 2 errors). Now a missing row returns `200 {url:null}`, and a lookup error returns 503 instead of 404.
  - Before redeploying, the deployed source was downloaded and was byte-identical to local (CR stripped), so the redeploy changed only this.
  - Redeployed with `--use-api`; `verify_jwt=true` read back.
  - The live rerun showed 0 console errors.
  - Auth, CORS, suspension check and RLS client are unchanged.
- These scans are not a penetration test.

## 6. Integrations

- **Completed:** managed email Auth, sessions, revocation, RLS, JWT functions, free `pg_cron` retention, read-only reconciliation, request side of recovery.
- **Blocked:**
  - Crossref/PubMed positives: `CROSSREF_MAILTO`/`NCBI_EMAIL` need owner consent to publish a contact, plus an approved member.
  - SMS: Twilio, MessageBird, Vonage and Textlocal are paid; trials are excluded.
  - Custom recovery email template: Free/default-SMTP restriction.
  - Image processor hosting: no reliable free Sharp host.

## 7. Files changed this run

- `src/domain/recovery.ts`, `tests/recovery-arrival.test.ts`: `sb` marker and refresh-token shape; tests.
- `supabase/functions/avatar/index.ts`: no-avatar 200, lookup error 503 (deployed).
- `scripts/test-delivered-recovery-staging.mjs`: structural diagnostics, fast fail.
- `scripts/test-expired-recovery-staging.mjs`: `--consumed`, `sb` shape.
- `scripts/set-staging-recovery-input.ps1`: deadline warning, `-Expired`.
- `scripts/test-staging-persistence.mjs`: sanitized console-error classes (status, path, step); clear `reserve-exact-frontend-origin` step.
- `scripts/serve-recovery.mjs`, `scripts/request-staging-recovery.mjs`: callback server and request command.
- `package.json` (scripts only): `recovery:serve`, `recovery:request`, `recovery:reset`, `recovery:used-link`.
- Docs: this report, the checklist, PASSWORD_RECOVERY_ACCEPTANCE, CLOUD_ACCEPTANCE_REPORT/CHECKLIST, RELEASE_READINESS, AUTONOMOUS_COMPLETION_REPORT, SECURITY, OPERATIONS.

## 8. Commands and results (actual)

- `node scripts/test-delivered-recovery-staging.mjs` → exit 1: link `otp_expired`, password unchanged.
- `node scripts/test-expired-recovery-staging.mjs --consumed` → 6/6 (twice).
- `npx vitest run tests/recovery-arrival.test.ts tests/recovery.test.tsx` → 26/26.
- `node scripts/test-staging-account-race.mjs` → 10/10.
- `node scripts/test-staging-persistence.mjs` runs:
  1. Port conflict with my own recovery server; no writes.
  2. 174/2 (console errors).
  3. 174/2, classified as avatar 404.
  4. After the fix: **175/0**.
- Revocation 5/5. Safe boundaries 24/24. Anonymous pass. Edge diagnostic unchanged. Audit pass. Retention 5/5. Reconcile clean.
- `npm run test:edge` 9/9. `npm run typecheck:edge` pass.
- `node scripts/run-final-verification.mjs` → **19/19**.
- Secret-pattern scan of 70 changed files: only file hashes and unit fixtures matched.

## 9. Remaining blockers

| Blocker | Why no secure free option |
| --- | --- |
| Real reset | Needs a fresh, unused delivered link; only the owner's inbox has it |
| Phone verification | Every Supabase SMS provider bills; fake OTP is prohibited |
| Member/staff/academic positives | Need a genuine reviewer decision; manual flags/roles are prohibited |
| Populated protected-record isolation | Depends on the above fixtures |
| Image processor | No reliable free host for Sharp; local processor is not cloud evidence |
| Scholarly positives | Owner consent for a published contact address + an approved member |
| Full restore | No Docker/pg_dump locally; PITR is paid |
| Leaked-password check | Paid feature |
| Accessibility/load, deployment | Manual assistive-technology testing and an authorized publication decision |

## 10. Owner-only actions

1. **Password reset (about 2 minutes):**
   1. `npm run recovery:request`.
   2. Right-click "Reset Password" in the **newest** email and copy the link address (don't click).
   3. `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/set-staging-recovery-input.ps1 -Account A -Mode Link`.
   4. Run `npm run recovery:reset` at once (or ask Claude), within the hour.
2. Optional: consent to a scholarly contact address; appoint a genuine reviewer.
