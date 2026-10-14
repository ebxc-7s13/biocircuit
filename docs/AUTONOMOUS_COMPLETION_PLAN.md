# Autonomous completion plan — 2026-10-14

Directive: `BIOCIRCUIT_CLAUDE_AUTONOMOUS_COMPLETION_PROMPT.md`. Target: Supabase `biocircuit-staging` / `ibxubsegrabpspopdgep` only. Zero-cost only; no publication, reset, paid service, signup, role/flag fabrication or account deletion.

## Starting state (verified, not assumed)

| Item | Actual observation at start (2026-10-14T03:23Z) |
| --- | --- |
| Workspace | Windows 11, PowerShell 5.1 + Git Bash, Node 22.23.2, npm 10.9.8, Deno 2.9.6, bundled Supabase CLI 2.120.0. **No Git repository** (no branch/commit to report; none created). |
| CLI authentication | Working (existing CLI credential store; no token exported or printed). |
| Hosted identity | `biocircuit-staging`, ACTIVE_HEALTHY. [Audit](verification/cloud/final-audit-2026-10-14T03-23-41-538Z.json) |
| Schema | 20 migrations applied, 29/29 public tables with RLS, 0 client write grants, 0 unsafe definer search paths, 3 private buckets, 0 Storage client policies. Matches the 2026-10-13 report — no drift. |
| Edge Functions | 4 ACTIVE, all `verify_jwt=true`. |
| Advisors | 11 WARN (10 reviewed definer RPCs + paid-only leaked-password protection), 0 ERROR. |
| Integration secrets | Only `ALLOWED_ORIGIN` present. `CROSSREF_MAILTO`, `NCBI_EMAIL`, `NCBI_API_KEY`, processor URLs/token absent. |
| Storage | 0 objects in any bucket. |
| Scheduler | `pg_cron` 1.6.4 and `pg_net` available, neither installed. |
| Referenced docs | All named reports exist (`docs/BUILD_REPORT.md`, `IMPLEMENTATION_STATUS.md`, `IMPLEMENTATION_AUDIT.md`, `OPERATIONS.md`, …). `AUTONOMOUS_COMPLETION_PLAN.md` / `_REPORT.md` did not exist and were created. |

## Prioritized open requirements

| # | Requirement | Feasible at zero cost now? | Decision / acceptance | Result |
| --- | --- | --- | --- | --- |
| 1 | Private buckets still accepted `application/pdf` although document upload is intentionally unsupported/unscanned | Yes | Forward migration narrowing MIME allowlists; static review + CLI dry run must show only this migration; hosted readback | **DONE — LIVE** |
| 2 | Retention "script is not a schedule" | Yes — Supabase Free `pg_cron` | Schedule existing service-only `prune_retained_data()`; prove the exact command executes on hosted Postgres without affecting data; clients denied | **DONE — LIVE** (first natural run pending) |
| 3 | Orphan reconciliation after failed upload compensation | Yes (read-only) | Shared SQL for local fixtures + hosted aggregates; never auto-repair | **DONE — LOCAL fixtures + LIVE (empty store)** |
| 4 | Crossref provider branch had no contract tests (PubMed did) | Yes | Extract to `_shared/crossref.ts` without behavior change; offline Deno contracts; redeploy and confirm identical live gate responses | **DONE — LOCAL + LIVE gate unchanged** |
| 5 | Recovery delivery | Partially — inference only | Re-analyse evidence: 4 hosted `/recover` 200s vs documented `email_address_not_authorized` for non-team recipients under default SMTP | **Owner inbox check still required** |
| 6 | Scholarly contacts | Owner decision | Setting `CROSSREF_MAILTO`/`NCBI_EMAIL` publishes an address to providers; not done without explicit consent | BLOCKED (owner) |
| 7 | Approved-member / staff / phone positives | No | No legitimate approved fixture; no paid SMS; no flag fabrication | BLOCKED |
| 8 | Image processor hosting | No (prior analysis re-confirmed: native Sharp not supported on Edge; free hosts sleep/limit CPU) | Keep honest 503 | BLOCKED |
| 9 | Storage cleanup schedule | No safe SQL-only path (Storage API + service credential needed) | Keep manual worker; reconciliation detects drift | DEFERRED FOR SAFETY |
| 10 | Full DB/Auth/Storage backup restore | No (`pg_dump`/Docker absent; PITR paid) | Retain owner-export/local core restore evidence | PARTIAL |
| 11 | Full regression | Yes | All existing suites + new live read-only checks | See report |

Progress and evidence: [AUTONOMOUS_COMPLETION_REPORT.md](AUTONOMOUS_COMPLETION_REPORT.md).
