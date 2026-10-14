# Deployment and operations

## Current acceptance scope

Use [CLOUD_SETUP.md](CLOUD_SETUP.md) for the Docker-free isolated staging path and [RELEASE_READINESS.md](RELEASE_READINESS.md) for live gates. Keep the frontend local during cloud acceptance. The later deployment and schedule examples below are preparation, not authorization to publish, purchase hosting or install destructive retention/cleanup jobs. Hosted Auth settings, Advisor results, backups and restore behavior require actual staging evidence.

## Environment isolation and deployment

The frontend is a static Vite build; Supabase provides identity, PostgreSQL, private Storage and Edge Functions. Keep separate projects/secrets for local integration, preview and production. The demo suite uses synthetic state; the separate connected staging browser harness now verifies actual anonymous empty states against the hosted backend. On 2026-10-12, the confirmed staging project `ibxubsegrabpspopdgep` received all 19 reviewed migrations and four API-based JWT-verified Edge deployments, with exact local ALLOWED_ORIGIN. No other project, public frontend deployment, DNS change, purchase, commit or Git push occurred. Authenticated/operational release gates remain blocked; do not run schedules, restores or release steps merely because staging deployment succeeded.

1. Finish external setup and real service acceptance in SETUP.md on a development project.
2. Review migration diffs and run the complete checks plus native Supabase tests. Take a verified backup before applying changes to an existing database.
3. Configure production public variables, then npm ci, npm run build and npm run check:bundle. Only dist is a frontend deployment artifact. Server processors, secrets and Supabase folders are not browser assets.
4. Choose an HTTPS static host that supports history fallback and response headers. public/_redirects and public/_headers are compatible preparation files for Netlify/Cloudflare Pages style hosting. Other hosts must translate the same settings; Vite preview does not apply those hosting headers.
5. Use one exact ALLOWED_ORIGIN per backend environment. Configure Auth site/redirects and hCaptcha domains. If using a Supabase custom API domain, add that precise domain to CSP connect-src/img-src.
6. Apply reviewed pending migrations through the trusted CLI, initialize taxonomy only as a separately reviewed step, deploy changed Edge Functions and configure their server secrets. Keep verify_jwt enabled; handlers also verify the actual current Auth user.
7. Bootstrap independently scoped operators, configure retention/backups, then run real OTP/application/member/moderation/provider/Storage/export/deletion tests. Verify actual hosted CSP/CORS/SPA deep-link behavior.
8. Release only after reviewing IMPLEMENTATION_STATUS.md blockers. This repository is prepared; no production-readiness claim is made.

## Database and schema recovery

Migrations are ordered, versioned, additive where possible and executable together in the PostgreSQL suite. Public tables deny client writes; private helper functions have fixed search paths and explicitly scoped privileges. Do not edit an applied migration: create a new forward migration. Do not disable policies to resolve a failed setup.

Before deploying to a nonempty environment, inventory its existing schema and data, back up database and Storage separately, test restore to a disposable environment, and verify foreign keys/policies/roles afterwards. Managed database backups do not stand in for a copy of Storage objects. Choose backup frequency and recovery point/time targets with the operator based on data volume and cost. No real backup or restore was executed here.

For an application regression, redeploy the previous frontend first if compatible. For a migration failure, inspect the transaction and migration ledger, repair with a reviewed forward migration, or restore a verified backup under a maintenance window. Never run local reset commands against production.

## Retention and deletion

Schedule public.prune_retained_data() daily using a trusted service/managed cron identity. It clears optional marks 90 days after a decision, removes minimal audit records after 365 days, and prunes expired provider cache and old request receipts. Minimal eligibility information remains until account deletion; final-decision evidence is not collected while evidence uploads are disabled. Review pending-application retention separately before launch.

**Installed on staging (2026-10-14)** by forward migration `20261014000100_storage_retention.sql`: Supabase Free's `pg_cron` (schema `pg_catalog`, no paid add-on) runs job `biocircuit-retention` daily at 03:17 UTC as `postgres`, executing `public.prune_retained_data()` and bounding `cron.job_run_details` to 30 days. Where `pg_cron` is unavailable (local PGlite) the migration skips the schedule. Browser roles cannot execute the function or use the `cron` schema.

Verify with `npm run test:retention-schedule` (live, read-only except one always-rolled-back execution of the exact job command; aggregate counts only). Inspect run history for failures after the first scheduled run:

~~~sql
select status, count(*) from cron.job_run_details d join cron.job j using (jobid)
where j.jobname = 'biocircuit-retention' group by status;
~~~

At installation no staging row was old enough to be affected, so the first real pruning effect has not been observed yet.

Account deletion requires explicit DELETE, real Auth verification and transfer of all owned projects. Storage is removed in bounded batches before deleting Auth; nested/unexpected storage or exhausted cleanup limits fail before identity deletion. FK cascades remove applications, personal preferences/interactions, authored posts/replies and related records. Owned projects remain protected by a restrict FK until transferred. Audit actors are nulled on deletion; records follow the configured retention policy. Confirm the exact provider behavior on a development service before release.

Processed avatars use randomized paths; replacement removes the previous object. A service-only tombstone queue and bounded worker (npm run storage:cleanup) retry known deleted/replaced objects; schedule and monitor this worker externally. No Storage cleanup schedule is installed: deleting objects requires the Storage API with a service credential, which a SQL-only cron job cannot do safely, so this remains a manual operator step. Failed uploads with failed compensating removal are detected by `npm run storage:reconcile` (read-only, `supabase/tests/storage-reconcile.sql`), which reports aggregate orphan objects, records missing their object, stale queue entries and any object in the disabled evidence bucket; it never repairs automatically and exits 2 on drift. Private project images use the same decoded-image service and require current project membership. Academic evidence and PDF/document uploads stay fail-closed pending a reviewed document validation/scanning workflow.

## Outages and observability

Frontend errors and Edge responses are generic and redact provider internals. Missing environment configuration, offline state, rate limits, empty results and retry controls are visible. Mutations refresh server-confirmed state and use transactional request IDs; never display fake success after a rejected write.

Use Supabase's operational dashboards for database/Auth/functions status and SMS provider delivery logs. Do not log OTPs, bearer tokens, phone numbers, marks, evidence, private post bodies or raw upstream URLs containing API keys. Third-party error/session recording is off by default; review collection, redaction, retention and consent before enabling it. There is no analytics or AI tracking dependency.

For a broken optional integration, remove its server-side configuration or disable its function at the platform level, show the existing unavailable state, and preserve core community data. Do not replace it with fabricated responses. Provider searches use 8-second timeouts, bounded pages, 24-hour cache and a distributed conservative two-requests/second budget. Cache misses still require an eligible user and per-user search budget. Provider limits shared with unrelated applications can still return errors.

## Reputation and abuse operations

Only accepted answers award points initially: default 20, administrator-adjustable 0–100 for future events. Unique source/event constraints and transactional receipts deduplicate awards and retries. Reopening, deletion and moderation invalidate points. Restoring content does not automatically restore reputation. Award creation is serialized per recipient, capped at five new events/day and one asker–recipient pair/day, counting invalidated events too.

Managed phone/CAPTCHA limits, per-user RPC budgets, self-interaction denial, symmetric blocks, bounded notification fanout and moderation reduce abuse. These controls do not establish that collusion or multi-account fraud is impossible; operators still need review and escalation procedures. Do not add a global leaderboard or rank by grades/institution prestige.

## Costs and legal configuration

SMS, CAPTCHA account tiers, database/storage/egress limits, processor hosting, domain and monitoring depend on the selected providers and usage. Scholarly APIs also have quotas and attribution requirements. No current price or forever-free promise is asserted. No services were purchased.

Confirm operating-region privacy and SMS requirements, including any India sender/template requirements, with the chosen provider and qualified review. The platform is a professional research community, not a clinical care system or an independently certified health-data compliance service. Public launch needs privacy/retention/contact policies owned by the operator.

## Password recovery runbook (staging)

1. `npm run recovery:request`: one email to the selected existing account. The default sender allows 2 per hour. A link expires 3600 s after the request, and each new request supersedes older links.
2. Copy the link address from the newest email without opening it. Save it with `scripts/set-staging-recovery-input.ps1`; the input is DPAPI-encrypted.
3. `npm run recovery:reset` performs the reset through the real UI, rotates the encrypted credential with an encrypted backup, and verifies old/new passwords, unchanged flags and replay denial. `npm run recovery:used-link` is a negative check that changes nothing.
4. `npm run recovery:serve` serves the callback at the exact allowlisted origin for manual use. Stop it before running suites that reserve the same port (for example `test-staging-persistence.mjs`).
