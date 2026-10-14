# Implementation audit

Canonical source: MASTER_IMPLEMENTATION_PROMPT.md (61,655 characters, fully read).

## Observed baseline
- Workspace: D:/personal_projects/my apps/biocircuit-source/biocircuit. No .git directory; git status returns 128 (not a repository). No branch/history/user diff exists to inspect. Preserve all existing files and original localStorage keys.
- React 19.1, TypeScript 5.8.3 strict, Vite 6.3.5, lucide-react; npm lockfile v3; installed dependencies available. Only dev/build/preview scripts. Source consists of App.tsx, main.tsx, styles.css.
- Baseline npm run build PASS: 238.91 kB JS (72.66 gzip), 39.35 kB CSS (9.35 gzip). No existing tests/lint scripts/backend/environment/deployment config.
- Static inspection: local likes/saves/create/search work in code; replies exist only while dialog is mounted. Following is hardcoded; Recent does not sort. Notifications/counts/verification are fabricated fixtures. Many controls only show roadmap toasts. Demo OTP uses fixed code. No actual runtime browser observations yet.
- No routes/history, database, Auth, RLS, storage, integration, moderation, reviewer, projects entities, private profiles or scholarly provider.
- Existing editorial hierarchy and useful biomedical example topics should be preserved. Tiny text, missing dialog focus trap/Escape semantics and conventional top navigation conflict with specification.

## Assumptions and decisions
- Keep React/TypeScript/Vite and npm; implement Supabase as specified. Production requires explicit public configuration. Demo is an isolated, visibly labelled synthetic adapter; no fake OTP. No production resources/deploy/commits authorized.
- No evidence uploads until validation and access policies exist. DMs and generative AI are optional and excluded in favour of secure collaboration requests. System/local font fallbacks avoid external font dependency.
- Command launcher fails before execution with helper_unknown_error setup refresh; alternate Node child_process works and will record actual command results.

## Ordered checklist, dependencies and acceptance
1. [x] Reproducible baseline/toolchain: npm ci, lint, typecheck, tests, build; retain lockfile and capture outputs. Add maintained tools after docs checks.
2. [x] Models, validation, demo/connected adapters, bounded pagination, drafts, errors. Require explicit mode and no fallback to demo after server errors.
3. [x] Design tokens, light/dark, left rail, horizontal leftward desktop canvas, URL/history, mobile 320px reflow, reduced motion/pause, focus/shortcuts. Verify browser navigation/layout and keyboard.
4. [x] Feed/composer/question threads, real saves/reactions/follows/reports, accepted answers, search/filter/order, local draft recovery and offline states. Validate constraints and duplicate/self actions.
5. [x] Project workspaces/logs/members/requests/visibility/archive/ownership; discovery/profile/settings/notifications and policies. Verify owner vs member flows.
6. [x] Supabase normalized schema, constraints/indexes/keyset queries, deny-by-default RLS, privileged transactional RPCs, abuse controls/ledger/audit. Test anonymous/pending/owner/other/reviewer/moderator/admin including cross-account IDs.
7. [x] Phone OTP provider SDK, cooldown/generic errors/CAPTCHA configuration, academic application/appeal/review/suspension and separate private metadata. Real SMS requires configured provider; no simulated verification.
8. [x] Scholarly metadata provider proxy/cache/limits/provenance/canonical links; deterministic ranking/exclusions/explanation/evaluation. Verify official Crossref/OpenAlex/NCBI guidance; do not scrape/full-text redistribute.
9. [x] Upload safety/private storage/account export/delete/phone changes, retention and operations. Server validation mandatory; disabled states explain limitations.
10. [x] Security headers/CORS/redacted errors/dependency scan, tests/E2E/accessibility/responsive/bundle measurements. Fix discovered issues; report unavailable scans separately.
11. [x] Setup/deployment/privacy/operations docs/.env.example and full requirement-by-requirement status/build report. Compare all numbered master sections and 5 A–M. Do not call untested integrations complete.

## Verification commands
npm ci; npm run lint; npm run typecheck; npm test; npm run test:e2e; npm run test:db; npm run build; npm audit; supabase start; supabase db reset; supabase test db.

## External dependencies/risks
Supabase project/Auth/Storage/Edge deployment, SMS provider account/template and regional compliance, CAPTCHA site configuration; production origin; live integration credentials not present. Database execution tooling availability to inspect. Legal review and operational backup/retention jobs required before public launch. Public API quota/cost and SMS pricing depend on provider configuration. No production readiness claim until real provider tests and full release gates pass.

## Execution outcome and evidence

Checked boxes mean the repository work and available verification have been executed; they do not mean live integrations passed. The final requirement table records those separately.

- Baseline preserved under docs/baseline; original browser storage key preserved. Project extended in place, no Git resets/deletions/commits.
- Reproducible pinned npm stack, lint/type checks, 24 unit/component checks, 122 executable PostgreSQL authorization checks, 22 browser checks, four Edge Function type checks and three Edge HTTP checks passed before final documentation polish. Final evidence is in BUILD_REPORT.md and local command logs.
- Native Supabase cannot start because Docker/Podman is absent. CLI installed and status inspected; no remote database was linked or mutated.
- Real SDK phone Auth, hCaptcha, reviewer queues, persistence, provider proxies, private avatars/project images and identity deletion are implemented, but live verification requires a configured Supabase development service and processor.
- PDF/academic evidence uploads are deliberately disabled: safe document validation/scanning is not implemented. Optional DMs/AI/OpenAlex/embeddings were excluded; email/digest delivery needs a verified email identity and provider integration.
- Fixed actual discovered failures: Vite advisory, dialog focus restoration, privacy and authorization bypasses, search pagination/candidate filtering, daily reputation farming, processed-file bounds, image membership race and a dynamic Supabase select type error. Final affected checks rerun.
- Entry gzip 156,652 bytes and CSS 4,513 bytes; connected SDK adds 59,320 gzip bytes. These are measured build sizes, not network timing claims.

## Next external dependencies in order

1. Install/start Docker Desktop or Podman for native Auth/Storage/pgTAP integration, or provision an authorized isolated Supabase development project.
2. Configure SMS/phone Auth, hCaptcha, real operator roles, service contacts and exact origin; apply the versioned schema and deploy four functions as described in SETUP.md.
3. Host the included first-party image processor behind authenticated HTTPS; schedule retention/known-object cleanup, inventory reconciliation and verify backup restore.
4. Execute real role-separated OTP/DB/Storage/source/deletion journeys, hosted header/deep-link checks, legal review and manual screen-reader/physical touch review before public release.

## Material implementation decisions

The existing React/Vite stack remains. PostgreSQL full-text/tag ranking fits the measured scope; no paid AI dependency. Server transactions plus UUID receipts preserve consistent writes. Managed Auth handles real OTP verification, not browser-simulated codes. Academic marks are optional/private, never used for rankings. Privileged role assignment is a trusted operator action. Storage originals are not accepted by image APIs; processed previews preserve explicit scientific-original warnings. Risk details are in SECURITY.md and OPERATIONS.md.
