# Final autonomous run checklist — 2026-10-14

Spec: `BIOCIRCUIT_CLAUDE_FINAL_AUTONOMOUS_RUN_PROMPT.md` (read completely). Target: `biocircuit-staging` / `ibxubsegrabpspopdgep` only. No Git repository exists; nothing committed. Result: [FINAL_AUTONOMOUS_RUN_REPORT.md](FINAL_AUTONOMOUS_RUN_REPORT.md).

## Phase 0 — actual state

- [x] Reports read: AUTONOMOUS_COMPLETION_REPORT, CLOUD_ACCEPTANCE_REPORT/CHECKLIST, RELEASE_READINESS, PASSWORD_RECOVERY_ACCEPTANCE, SECURITY, OPERATIONS and the newest `docs/verification/cloud/` evidence.
- [x] Reconciled discrepancies:
  - The reports said "no reset attempted". In fact an attempt ran at 06:44Z (the helper prompts the operator to run it) and failed before any password update.
  - The persistence suite reported 0 console errors on 2026-10-13. Today it reported 5, traced to the avatar 404 (fixed below).
- [x] Hosted identity ACTIVE_HEALTHY; 4 functions ACTIVE with `verify_jwt=true`; advisors 11 WARN (unchanged).

## Phase 1 — password recovery (priority 1)

| Item | Priority | Status | Acceptance test |
| --- | --- | --- | --- |
| Inspect runner, helper, serve command, tests | P1 | COMPLETE | read before running |
| Encrypted input present and structurally valid (names/booleans only) | P1 | COMPLETE | hosted verify URL, `type=recovery`, exact `redirect_to` |
| Verify state before retry | P1 | COMPLETE — LIVE | original password signs in; no prior attempt reached `/auth/v1/user` |
| Real reset with a delivered link | P1 | COMPLETE AND LIVE-VERIFIED (09:21Z; earlier links used up or refused by fixed defects) | `npm.cmd run recovery:reset` |
| Used/expired real link rejected safely | P1 | COMPLETE AND LIVE-VERIFIED 6/6 | `npm run recovery:used-link` |
| `sb` marker / refresh-token shape hardening | P1 | COMPLETE AND LOCALLY VERIFIED (26/26) | `npx vitest run tests/recovery-arrival.test.ts tests/recovery.test.tsx` |
| Real-link adoption defects (AMR `otp`; app-shell remount) | P1 | FIXED; COMPLETE AND LIVE-VERIFIED via `npm run test:recovery-adoption` 6/6 (negative control fails) | recovery-adoption-2026-10-14T08-32-28-763Z |
| New password works, old fails, flags/roles unchanged, replay refused | P1 | COMPLETE AND LIVE-VERIFIED 11/11 | delivered-recovery-2026-10-14T09-21-23-999Z |

## Phase 2 — remaining free acceptance

| Area | Status | Evidence / blocker |
| --- | --- | --- |
| A. A/B stale-response privacy | COMPLETE AND LIVE-VERIFIED 10/10 | account-switch-race-2026-10-14T07-10-23-188Z |
| A. Two-account persistence (refresh, logout/login, independent clients, cross-user writes, escalation denials, restoration) | COMPLETE AND LIVE-VERIFIED 175 PASS / 0 FAIL / 2 BLOCKED (after avatar fix) | persistence-2026-10-14T07-18-28-119Z |
| A. Populated notifications/bookmarks/applications/roles/avatars/project images | BLOCKED — no legitimate fixtures (12 LIMITED-EMPTY records; not counted as isolation) | same |
| B. Session revocation | COMPLETE AND LIVE-VERIFIED 5/5 | revocation-2026-10-14T07-10-51-419Z |
| B. Safe boundaries (flags/roles/RPC/self-escalation) | COMPLETE AND LIVE-VERIFIED 24/24 | safe-boundaries-2026-10-14T07-10-58-824Z |
| B. Anonymous ingress / CORS / Storage denials | COMPLETE AND LIVE-VERIFIED | test-staging-anonymous output |
| B. Phone verification | BLOCKED — every Supabase SMS provider is paid; no free path | unchanged |
| B. Export/deletion safeguards | LIVE negative checks inside persistence suite; no deletion executed | same |
| C. Scholarly gate | COMPLETE AND LIVE-VERIFIED for denial (429 non-member, 401 anon); provider positives BLOCKED (owner contact consent + approved member) | edge-auth-diagnostic.json |
| D. Avatar "no image" returned 404 → console errors | FIXED, redeployed, LIVE-VERIFIED (0 console errors) | persistence 07-18-28 |
| D. Buckets / retention / reconcile | COMPLETE AND LIVE-VERIFIED (5/5, counts 0) | retention-schedule-2026-10-14T07-11-41-183Z, storage-reconcile-2026-10-14T07-11-44-079Z |
| D. Image processor hosting | BLOCKED — no reliable free Sharp host | unchanged |
| F. npm audit / outdated | 0 vulnerabilities; major upgrades deferred (no advisory) | `npm audit` |
| F. Platform advisors | 11 WARN reviewed, 0 new | final-audit-2026-10-14T07-20-50-060Z |
| G. Full backup restore | BLOCKED — no Docker/pg_dump; PITR paid | unchanged |
| Full regression | see report | `node scripts/run-final-verification.mjs` |
