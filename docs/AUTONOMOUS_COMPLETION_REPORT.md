> **Superseded in part by [FINAL_AUTONOMOUS_RUN_REPORT.md](FINAL_AUTONOMOUS_RUN_REPORT.md) (later on 2026-10-14):** the owner confirmed delivery of the recovery emails. A delivered link was tried but was already used (`otp_expired`), so no password was changed. The avatar no-image 404 was fixed and redeployed, and persistence is now 175/0 live. The single owner action is now in §10 of that report.

# Autonomous completion report — 2026-10-14

**Release decision: NOT PRODUCTION READY.** The staging candidate gained live storage hardening, a working free retention schedule, read-only media reconciliation and Crossref provider contracts. Mandatory identity, recovery-delivery, member/staff, processor and full-recovery gates remain open for external reasons that cannot be solved at zero cost without owner action.

Plan and starting state: [AUTONOMOUS_COMPLETION_PLAN.md](AUTONOMOUS_COMPLETION_PLAN.md). Target throughout: `biocircuit-staging` / `ibxubsegrabpspopdgep`.

## Work performed

### 1. Private bucket document refusal — COMPLETE AND LIVE-VERIFIED
- **Defect:** `academic-evidence` and `project-files` still allowed `application/pdf` (plus JPEG for project files) although document upload is unsupported and unscanned, and `project-images` only ever stores processor PNG.
- **Change:** `supabase/migrations/20261014000100_storage_retention.sql` narrows `project-files` → `image/png`, `academic-evidence` → `image/png,image/jpeg`. The unused client helper `assertUpload` (`src/domain/validation.ts`) no longer accepts genuine PDFs.
- **Safety:** hosted Storage held 0 objects before the change. `scripts/apply-storage-retention.mjs` reverified identity, statically reviewed the SQL (exactly 2 bucket updates, 1 extension, 1 schedule; no insert/drop/grant/revoke/alter), and required the CLI dry run to list only this migration with no seeds or roles. The first apply attempt failed at the CLI transport before any request was recorded; a read-only re-preview confirmed it was still pending, then the retry applied it.
- **Evidence:** [preview](verification/cloud/storage-retention-migration-2026-10-14T03-30-41-847Z.json), [failed transport attempt, retained](verification/cloud/storage-retention-migration-2026-10-14T03-32-36-296Z.json), [re-preview](verification/cloud/storage-retention-migration-2026-10-14T03-35-26-744Z.json), [apply + readback](verification/cloud/storage-retention-migration-2026-10-14T03-38-05-781Z.json) (ledger up to date with 21 migrations; bucket and job readback match), local `test:db` 125/125, `test:cloud-catalog` 27/27.

### 2. Retention schedule — COMPLETE AND LIVE-VERIFIED (first natural run pending)
- **Decision:** Supabase Free includes `pg_cron` (1.6.4 available, verified read-only); installed in `pg_catalog` per [Supabase Cron docs](https://supabase.com/docs/guides/cron/install). No paid add-on, no new service.
- Job `biocircuit-retention`, `17 3 * * *`, owner `postgres`, runs the existing service-only `public.prune_retained_data()` and bounds `cron.job_run_details` to 30 days. Before scheduling I checked that no trigger or foreign key blocks its deletes.
- `npm run test:retention-schedule` (new): **5/5 PASS — LIVE** twice ([first](verification/cloud/retention-schedule-2026-10-14T03-41-00-464Z.json), [regression](verification/cloud/retention-schedule-2026-10-14T04-00-00-624Z.json)). The exact job command executed on hosted Postgres inside a rolled-back transaction; eligible rows were 0 in every category; anon/authenticated cannot execute retention or use the `cron` schema; no failed runs.
- **Caveat:** no natural scheduled run has happened yet (the next is 2026-10-15 03:17 UTC), and no row is old enough to be pruned, so a real pruning effect is unobserved.

### 3. Media reconciliation — COMPLETE AND LOCALLY VERIFIED; LIVE run on empty store
- New `supabase/tests/storage-reconcile.sql` + `npm run storage:reconcile`: read-only aggregate counts of orphan objects, records missing objects, stale queue entries and evidence-bucket objects; exits 2 on drift, never repairs.
- Local PGlite fixtures prove each category is detected. Live: all counts 0 ([evidence](verification/cloud/storage-reconcile-2026-10-14T04-00-05-047Z.json)). Because staging holds no media this is trivially clean, not proof of lifecycle correctness.
- Storage **cleanup** remains unscheduled — deleting objects needs the Storage API with a service credential; a SQL-only job cannot do it safely. DEFERRED FOR SAFETY (manual `npm run storage:cleanup`).

### 4. Crossref provider contracts — COMPLETE AND LOCALLY VERIFIED; deployed, live gate unchanged
- Extracted the Crossref branch of `scholarly-search` into `supabase/functions/_shared/crossref.ts` (same logic; both providers now share one persist/cache path; Crossref now caches only year-filtered papers). New `supabase/functions/crossref_test.ts`: 3 offline contracts — bounded rows/cursor/year filter/mailto, provenance, malformed-DOI and off-year drop, exact DOI path, unknown DOI → empty, budget denial before any fetch, 429/503/malformed → failure, empty result.
- `test:edge` 9/9, `typecheck:edge` pass. Redeployed `scholarly-search` with `--use-api` → v2 ACTIVE, `verify_jwt=true`; other functions untouched.
- Live [diagnostic](verification/cloud/edge-auth-diagnostic.json) identical to the [prior one](verification/cloud/edge-auth-diagnostic-before-2026-10-14.json): signed-in non-member A → 429 member gate, exact CORS; anonymous ingress → 401 for all four functions.
- `CROSSREF_MAILTO`/`NCBI_EMAIL` remain unset: configuring them publishes an owner address to third parties and needs explicit owner consent. Approved-member proxy/cache positives remain BLOCKED.

### 5. Password recovery — BLOCKED BY EXTERNAL CONFIGURATION (re-analysed)
No email was requested, no mailbox accessed, no password changed. Four 2026-10-13 hosted `/recover` requests for A returned 200, not Supabase's documented `email_address_not_authorized` (default-SMTP non-team recipient). This is an **inference**: A's address is likely eligible, so an inbox check is meaningful. Details in [PASSWORD_RECOVERY_ACCEPTANCE.md](PASSWORD_RECOVERY_ACCEPTANCE.md).

### 6. Advisors and dependencies
After migration: **11 WARN, unchanged** (10 reviewed definer RPCs + paid-only leaked-password protection), no new warning from `pg_cron` ([audit](verification/cloud/final-audit-2026-10-14T03-42-07-901Z.json)). `npm audit` 0 vulnerabilities — a separate category from platform warnings.

## Regression (actual commands)

`node scripts/run-final-verification.mjs` → **19/19 exit 0** ([results](verification/final-2026-10-14T03-47-29-595Z/results.json)):
format, lint, typecheck, unit **85/85** (15 files), SQL **125/125** (local PGlite, stubbed Auth/Storage), catalog 27, RLS planner 6, Edge 9, Edge types, demo browser **47/47** (synthetic), connected anonymous browser (live), recovery UI 4 viewports (live, 0 Auth requests), build, bundle, audit 0, production fail-closed smoke, source backup (159 files to ignored `.cloud/backups/2026-10-14T03-59-37-705Z`), retention schedule (live), storage reconcile (live).

Additionally: `node scripts/test-staging-account-race.mjs` **10/10 PASS — LIVE** with existing A/B sign-in only ([evidence](verification/cloud/account-switch-race-2026-10-14T04-00-34-242Z.json)). The 152-check two-user persistence suite was **not rerun**: no frontend state, data gateway, RLS or profile code changed; its 2026-10-13 result stands as historical evidence.

Defects diagnosed: one transient Vitest worker-startup timeout (passed on rerun, and in the full suite); my own first Crossref fixture returned 21 items, which Crossref never does (`rows=20`) — the fixture was corrected, not the assertion weakened; one transient CLI transport failure before apply (described above).

## Files

New: `supabase/migrations/20261014000100_storage_retention.sql`, `supabase/functions/_shared/crossref.ts`, `supabase/functions/crossref_test.ts`, `supabase/tests/storage-reconcile.sql`, `scripts/apply-storage-retention.mjs`, `scripts/test-retention-schedule.mjs`, `scripts/storage-reconcile.mjs`, `docs/AUTONOMOUS_COMPLETION_PLAN.md`, this report, sanitized evidence under `docs/verification/`.
Modified: `supabase/functions/scholarly-search/index.ts`, `src/domain/validation.ts`, `tests/domain.test.ts`, `scripts/test-db.mjs`, `scripts/test-cloud-catalog.mjs`, `scripts/test-rls-initplan.mjs` (no longer assumes migration 20 is last), `scripts/cloud-preflight.mjs` (expects reviewed 21-migration chain), `scripts/run-final-verification.mjs`, `package.json` (scripts only; no dependency change), `docs/OPERATIONS.md`, `docs/SECURITY.md`, and the four acceptance reports. No frontend UI/visual file changed. No Git repository exists; nothing committed or pushed.

## Final assessment

1. **Works against real staging:** ordinary email accounts A/B, sessions, refresh/revocation, populated profile/preference isolation, stale-response privacy (10/10 today), RLS/grant catalog, JWT-protected functions with honest member gating, document-refusing private buckets, scheduled retention (command executes; first run pending), read-only reconciliation, anonymous connected routes, recovery request/invalid-artifact boundaries.
2. **Local/demo only:** member/staff/moderation/reputation positives (local SQL + demo browser), image decode/re-encode processor, cleanup worker, Crossref/PubMed provider contracts, reconciliation drift detection, local core restore.
3. **Two accounts isolated?** Yes for populated profiles/preferences, sessions and stale responses (live). Applications, marks, notifications, bookmarks, roles, private projects and images remain unproven with populated rows — no legitimate fixtures exist.
4. **Still blocked:** recovery delivery (owner inbox / free SMTP sender), SMS phone verification (paid), academic approval and staff fixtures (genuine reviewer process), scholarly proxy positives (contacts + approved member), image processor hosting (no reliable free Sharp host), Storage cleanup scheduling (service credential), full DB/Auth/Storage restore (no pg_dump/Docker; PITR paid), paid breached-password check.
5. **Zero cost?** Yes. `pg_cron` is included in Supabase Free; no billing enabled, nothing purchased, no new project, no publication, no reset, no signup, no role/flag change, no account deletion.
6. **Controlled release?** **No.** Required gates: delivered recovery reset; real phone or an accepted alternative identity policy; a genuine reviewer and approved member exercising member/staff positives; populated protected-record isolation; a hosted image processor or explicit removal of image features; a full backup/restore rehearsal; manual assistive-technology and load checks; an authorized public deployment.

## Single owner action

Privately check account A's inbox for the BioCircuit/Supabase password-reset email already requested on 2026-10-13. If it arrived, save the real link (or code) and a new unique password with `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/set-staging-recovery-input.ps1 -Account A -Mode Link` (or `-Mode Code`), then ask for the reset continuation to be run. Do not paste any of it into chat. If nothing arrived, report only that fact.
