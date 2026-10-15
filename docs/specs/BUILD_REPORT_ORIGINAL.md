# BioCircuit build report

Date: 2026-10-10. Workspace: D:/personal_projects/my apps/biocircuit-source/biocircuit.
Canonical specification: MASTER_IMPLEMENTATION_PROMPT.md (61,655 characters, read in full before architecture changes).

## 1. Executive summary

The existing React/TypeScript/Vite prototype has been extended into a modular biomedical research workbench, with real routes, accessible desktop horizontal navigation and mobile reflow, community operations, project workspaces, private eligibility review, scoped trust tools, attributed scholarly discovery, explainable ranking, account controls and a Supabase integration architecture. Nineteen executable SQL migrations, four authenticated Edge Functions, a first-party image processor and bounded cleanup worker are included. Local synthetic data is isolated and explicitly labelled; production never substitutes demo data for a failed or unconfigured service.

Available local verification passed: lint, strict frontend TypeScript, 24 unit/component tests, 122 PostgreSQL authorization/integrity checks, four Edge Function type checks, three Edge HTTP tests, formatting, production build and bundle/configuration checks. The full browser suite has 22 tests; the final complete rerun passed (evidence below). A reproducible fresh npm ci installed 265 packages and audited 266, reporting zero known advisories. These results do not establish production readiness.

The full production definition of done remains unmet: native Supabase requires an unavailable container runtime; real phone OTP/hCaptcha, deployed database/Auth/Storage/functions, scholarly proxies, processor hosting, cleanup/retention schedules and backup restore require external configuration and integration tests. Credential evidence/PDF uploads and email/digest delivery are not enabled. Optional direct messages, OpenAlex, semantic embeddings and AI summaries are intentionally omitted. No paid resource, public deployment, remote data change, Git commit or push occurred.

## 2. Initial audit and preservation

The original project had React 19.1, TypeScript 5.8.3, Vite 6.3.5 and lucide-react, one large App.tsx, main.tsx and styles.css. It contained local post creation/likes/saves/search, transient reply state, hardcoded follower/notification counts and verification, a fixed OTP, roadmap-only controls, no database/routes/Auth/test/lint/env/deployment setup. Static findings were recorded as static findings before browser testing. Baseline npm build passed at 238.91 kB JS / 72.66 kB gzip and 39.35 kB CSS / 9.35 kB gzip; no baseline tests existed.

The initial ordered audit is docs/IMPLEMENTATION_AUDIT.md and was printed before implementation. Original App, styles, README and PRODUCT_VISION are archived in docs/baseline; the original biocircuit-posts storage key is untouched. No Git repository exists: git status returns 128, so a branch, recent history, original diff, tracked/untracked classification and commit hash are unavailable. Original workspace files were preserved and modified in place; no second project or generic template was created. No existing source file was deleted.

The initial dependency audit failed to reach the registry under restricted execution (docs/baseline-audit.json contains that actual error). Later registry access succeeded and exposed a Vite advisory; the compatible 6.4.4 update resolved it in the tested lockfile. Default command execution sometimes failed before launch; reviewed execution and npm.cmd on PowerShell provided working commands without changing system execution policy.

## 3. Features implemented

- Warm paper/ink biomedical identity, spectral accents, distinct typography, night-lab theme, restrained microscopy background, pause/reduced-motion/touch static behavior, semantic left rail, contextual controls, bottom progress/actions, horizontal panels moving left on desktop, native vertical reading and compact mobile navigation.
- Router/history/direct detail routes, focus/title handling, canvas keyboard arrows, slash/C/question-mark shortcuts that pause during typing/dialogs, native modal focus trapping/Escape/return, loading skeletons, offline/errors/retry, useful empty and denied states.
- Feed modes, persisted mode selection, topic/type/unanswered/search/sort filters, bounded server cursors and dedupe, authoritative server interaction counts, real likes/bookmarks/follows/subscriptions/block/mute/report/share links, author edit/delete, helpful replies, accepted answers and resolution summaries.
- Plain-text typed composer with preview, local unsynced draft recovery, bounded title/body/tags/methods/tried/resolution, source/DOI/project/paper links, dated project log types and patient-data/IP reminders. Text rendering never executes HTML/code. Documents remain unavailable rather than fake-attached.
- Projects with methods/equipment/stage/needs/tags/license/data-governance/repository, public/private access, dated logs, collaborator-confirmed milestones, requests with expertise/availability, owner accept/decline/removal/transfer/archive/delete and bounded discovery. Private PNG/JPEG images use decoded previews, current member authorization, commit-time membership/path checks and expiring reads; live Storage is unverified.
- Member profiles/qualifications/interests/methods/availability/visibility, settings, own contribution ledger/derived total, unread/read notification centre and enforced in-app categories, blocked/muted lists, theme/motion controls, draft clearing, server UID-scoped export, explicit project-transfer requirement for account deletion.
- Managed phone OTP and hCaptcha wiring, resend/attempt UI, separate phone confirmation and private academic eligibility states, minimal onboarding/resume, optional private marks, degree/result pathways, manual ambiguous-program review, reviewer reasons/resubmission/appeals/expiration, account suspension and role revocation.
- Reviewer, moderator, administrator and journal-editor trust scopes; reports/content appeals/restoration, source correction reports, taxonomy, bounded future accepted-answer point rules, private audit records and aggregate health. Frontend visibility is never the authorization boundary.
- Crossref/PubMed metadata adapters: title/author/topic/DOI/PMID/year, canonical identifiers/links, authors/venue/publication precision/source/retrieval time, honest availability/possible-correction labels, per-user and distributed provider budgets, cache and pagination, paper save/unsave/discussions/source reports. No full text, invented paper results or AI summaries.

The 66-row docs/IMPLEMENTATION_STATUS.md compares every numbered master section and feature area 5A–M, with explicit files, local evidence, limitations and external setup.

## 4. Architecture and technology decisions

React/TypeScript/Vite and npm were retained. App now delegates to Workbench; feature modules are split from domain validation/models/ranking and data adapters. React Router provides actual history, Zod bounded forms, existing lucide icons remain, and motion/reduced-motion utilities plus CSS drive restrained effects. Six feature chunks and the Supabase SDK are lazy loaded; no 3D renderer or per-frame React state updates. Custom bounded snapshots and explicit mutation orchestration fit current state needs without adding overlapping Redux/query libraries.

The synthetic adapter has its own localStorage namespace and clearly labelled participants; it has no real OTP or scholarly provider claims. Connected mode uses the managed SDK and authenticated transactional RPCs. Production defaults connected and displays setup errors without synthetic fallback. The SDK initializes once through a shared lazy promise and Auth subscriptions/timers/listeners clean up.

Supabase Auth establishes number control; PostgreSQL/RLS enforces application membership, object permissions and roles. Privileged SDK clients live only in Edge/maintenance code. A first-party Node/Sharp service re-encodes images; the frontend never receives its token. API keys and source contacts remain server-side.

Recommendations first filter permission/block/moderation/mute constraints, then score explicit topical interests, freshness, methods/sources/resolution and apply author diversity. PostgreSQL text search/tags meet the measured starting need. No paid model/embedding dependency was justified; no private material goes to an AI provider. The evaluation uses controlled synthetic labels, not a real human relevance benchmark.

## 5. Database schema and migrations

Nineteen ordered, version-controlled migrations execute together in PostgreSQL/PGlite. Twenty-nine public application tables have RLS: profiles, membership_applications, roles, topics, preferences, blocks, follows, projects, project_members, collaborations, papers, paper_saves, posts, comments, reactions, bookmarks, helpful, notifications, reports, contributions, audit, subscriptions, post_versions, contribution_rules, milestone_confirmations, avatars, content_appeals, paper_reports and project_images. Private schema contains request receipts/rate budgets, scholarly cache/provider reservations and Storage garbage collection.

Schemas include UUID/FK/unique/check constraints, timestamps, cursor indexes, indexed search vectors and enforceable polymorphic questions/logs/paper associations. Direct client writes are denied; narrowly authorized RPCs validate UID, ownership, member/role state, input bounds and rate budgets. Security-definer functions use fixed empty search paths and explicit grants. Self interactions and duplicate ledger events are denied; recipient awards serialize and cap five/day and one asker-recipient pair/day, including invalidated events. Reopening/deletion/moderation invalidate points. Restoration does not silently restore them.

Migration groups:
1–3 core schema/transactional operations/scholarly cache and ranking;
4–7 trust/version history/search/project log types/indexes/award integrity;
8–10 private avatars/private moderation boundary/distributed provider budget;
11–15 notification categories/content appeals/complete personal export/anonymous cursors/source reports;
16–19 private project images/known-object cleanup/export additions/commit-time upload integrity.

Private buckets: academic-evidence (disabled ingestion), project-files and avatars. Browser storage writes are denied; active image functions decode/re-encode before service storage writes, and authorize scoped records before issuing 60-second links. Project images are private even for public projects, limited to active members. Removing a collaborator revokes further link requests, while an already issued URL may remain usable for its remaining 60-second lifetime.

Taxonomy seed is deterministic and harmless; real user verification/privileged roles are never seeded. Synthetic demo/test participants exist only in their isolated adapters/test fixtures. Native Supabase/pgTAP tests are supplied but have not run because Docker/Podman is unavailable. PGlite uses explicit Auth/Storage schema/role stubs and cannot prove their deployed API behavior.

## 6. Authentication, OTP, eligibility, uploads and practical security

Real SDK phone OTP is wired, not simulated. Local Auth config specifies six digits, 300-second expiry, 60-second resend cooldown and bounded sends/verification/signup. hCaptcha is mandatory when configured. Managed Auth must enforce expiry/attempts/rates; a frontend five-attempt cap is only UX. Phone confirmation mirrors actual Auth state. Academic approval is a separate private manual decision; grades are optional and never public/ranking inputs. Clients cannot assign roles, suspension, phone verification or membership.

Executed negatives cover pending/anonymous/member/reviewer/moderator/admin access, guessing private IDs, private profile/application/notification/bookmark/project/image reads, private project moderation bypass, editing others' posts, accepted-answer permissions, self votes, duplicate receipts, daily/pair farming, suspended staff, source-report scopes, scoped appeals and data export. Local image checks exercise spoofed/malformed/oversized inputs and actual PNG/WebP decoding/re-encoding. SQL additionally rejects post-processor membership revocation and forged uploader paths.

Edge Functions have current-user getUser authentication, separate scoped/privileged clients, exact-origin CORS, streamed request limits that reject spoofed content lengths, generic errors and no-store responses. Sources use fixed official endpoints, bounded identifiers, 8-second timeouts, a conservative distributed two-requests/second reservation and 24-hour cache. No unsafe SQL string interpolation or raw HTML rendering is used. Safe external URLs reject credentials/unsafe schemes. APIs use bearer auth, not CSRF-sensitive application cookies.

Image service accepts PNG/JPEG up to 5 MB, decodes actual pixels, rejects malformed/animated inputs, limits ten million input pixels, strips metadata, sets time/concurrency/request limits and normalizes avatar WebP or project PNG. The latter preserves aspect ratio at max 2048 pixels; scientific originals must be retained separately. Credential/PDF scanning is not implemented and those flows stay disabled. Known deleted/replaced objects enter a service-only tombstone queue. A bounded maintenance worker is included but not deployed/scheduled; failed new-object compensation can still leave unrecorded orphans and requires inventory reconciliation.

Build-time public names are allow-listed; privileged keys rejected without printing values. Generated bundle patterns were scanned. npm reports no known advisories, but these checks are neither a complete secret scanner nor a penetration test. CSP/header preparation denies framing/objects/unsafe scripts and restricts external origins; Vite preview does not install actual hosting headers. Manual assistive-technology review, real JWT/PostgREST/Storage concurrency tests, regional SMS/legal review, operational fraud response and deployed header tests remain mandatory. Details: docs/SECURITY.md.

## 7. Important files created, modified or deleted

Modified existing files: src/App.tsx, src/main.tsx, src/styles.css, README.md, PRODUCT_VISION.md, package.json, package-lock.json, vite.config.ts, index.html and .gitignore. These integrate the workbench, styles, toolchain/scripts, metadata, build manifest and environment exclusions. Existing strict TypeScript config remains compatible; formatting normalized relevant root configuration. Original copies of user-facing baseline files are in docs/baseline.

New important implementation/test/operation files, grouped by their purpose above:

- public/_headers
- public/_redirects
- public/favicon.svg
- scripts/avatar-processor.mjs
- scripts/check-bundle.mjs
- scripts/check-config.mjs
- scripts/cleanup-storage.mjs
- scripts/evaluate-ranking.mjs
- scripts/smoke-production.mjs
- scripts/test-db.mjs
- src/Workbench.tsx
- src/components/Dialog.tsx
- src/components/ErrorBoundary.tsx
- src/data/demo.ts
- src/data/discovery.ts
- src/data/gateway.ts
- src/data/scholarly.ts
- src/data/useCommunity.ts
- src/domain/models.ts
- src/domain/pubmed.ts
- src/domain/ranking.ts
- src/domain/search.ts
- src/domain/validation.ts
- src/env.d.ts
- src/features/Account.tsx
- src/features/Auth.tsx
- src/features/Avatar.tsx
- src/features/Composer.tsx
- src/features/Feed.tsx
- src/features/Journal.tsx
- src/features/Member.tsx
- src/features/ProjectImages.tsx
- src/features/Projects.tsx
- src/features/Trust.tsx
- supabase/config.toml
- supabase/functions/_shared/http.ts
- supabase/functions/_shared/pubmed.ts
- supabase/functions/account-delete/index.ts
- supabase/functions/avatar/index.ts
- supabase/functions/deno.json
- supabase/functions/http_test.ts
- supabase/functions/project-images/index.ts
- supabase/functions/scholarly-search/index.ts
- supabase/migrations/20261010000100_schema.sql
- supabase/migrations/20261010000200_operations.sql
- supabase/migrations/20261010000300_discovery.sql
- supabase/migrations/20261010000400_trust_extensions.sql
- supabase/migrations/20261010000500_search_pagination.sql
- supabase/migrations/20261010000600_project_logs.sql
- supabase/migrations/20261010000700_integrity.sql
- supabase/migrations/20261010000800_avatars.sql
- supabase/migrations/20261010000900_moderation_privacy.sql
- supabase/migrations/20261010001000_provider_budget.sql
- supabase/migrations/20261010001100_notification_preferences.sql
- supabase/migrations/20261010001200_content_appeals.sql
- supabase/migrations/20261010001300_personal_export.sql
- supabase/migrations/20261010001400_public_pagination.sql
- supabase/migrations/20261010001500_paper_reports.sql
- supabase/migrations/20261010001600_project_images.sql
- supabase/migrations/20261010001700_storage_cleanup.sql
- supabase/migrations/20261010001800_export_images.sql
- supabase/migrations/20261010001900_image_integrity.sql
- supabase/seed.sql
- supabase/tests/rls.test.sql
- tests/avatar.test.ts
- tests/config.test.ts
- tests/dialog.test.tsx
- tests/domain.test.ts
- tests/e2e/accessibility.spec.ts
- tests/e2e/workbench.spec.ts
- tests/gateway.test.ts
- tests/pubmed.test.ts

New root configuration/documentation: .env.example, .prettierrc.json, eslint.config.js, vitest.config.ts, playwright.config.ts, BUILD_REPORT.md. New documentation: docs/IMPLEMENTATION_AUDIT.md, docs/IMPLEMENTATION_STATUS.md, docs/BUILD_REPORT.md, docs/SETUP.md, docs/SECURITY.md, docs/OPERATIONS.md, docs/baseline/*, docs/screenshots/{desktop-feed,night-lab,mobile-feed,setup-required}.png and docs/verification/production-smoke.json. Local command logs are under docs/*-final.log and ignored by Git patterns. Generated dist, node_modules, test-results and reports are local artifacts, not authored source. No existing file was deleted.

## 8. Dependencies and compatibility

Pinned runtime/build dependencies:

- @supabase/supabase-js 2.117.3
- @vitejs/plugin-react 4.4.1
- lucide-react 0.468.0
- motion 14.1.0
- react 19.1.0
- react-dom 19.1.0
- react-router-dom 7.18.4
- typescript 5.8.3
- zod 4.6.5

Pinned development/verification/processor dependencies:

- @axe-core/playwright 4.13.0
- @electric-sql/pglite 0.5.8
- @eslint/js 10.0.1
- @playwright/test 1.64.0
- @testing-library/react 16.3.3
- @testing-library/user-event 14.6.7
- @types/node 26.6.5
- @types/react 19.1.2
- @types/react-dom 19.1.2
- eslint 10.12.0
- jsdom 30.1.2
- prettier 3.9.10
- sharp 0.35.5
- supabase 2.120.0
- typescript-eslint 8.71.1
- vite 6.4.4
- vitest 5.0.3

React/TypeScript/lucide/Motion and the compatible Vite React plugin were retained. Supabase provides real managed identity/data operations; Router adds routes; Zod adds validation. Vite changed from 6.3.5 to 6.4.4 to fix the observed advisory without moving major frameworks. Testing Library/Vitest/jsdom test behavior, Playwright/axe test browser/a11y flows, PGlite executes offline PostgreSQL authorization, ESLint/typescript-eslint and Prettier enforce source checks, Sharp implements first-party decoded image processing, and pinned Supabase CLI makes native setup reproducible. No existing required runtime package was removed. Node >=22.12 is required (tested 22.23.2), Deno 2 (tested 2.9.6) for Edge code; native stack needs Docker/Podman. Registry stable versions/official compatibility docs were checked during implementation. Lockfile retained and fresh npm ci passed.

## 9. Commands actually run and results

| Command / operation | Actual final outcome | Scope / limitation |
| --- | --- | --- |
| Read master, README/vision/package/TS/Vite/source/styles/tree/hidden config | Completed before architecture changes | No secret values printed |
| git status / repository inspection | Exit 128: not a Git repository | No branch/hash/history/diff exists |
| Baseline npm build | PASS | Original prototype only |
| Initial npm audit in restricted context | FAILED registry endpoint access | Later successful scan supersedes it; failure retained |
| npm.cmd ci | PASS: added 265, audited 266, zero vulnerabilities | Lockfile reproducibility; docs/install-final.log |
| npm.cmd run lint | PASS (within check) | ESLint src/tests/scripts |
| npm.cmd run typecheck | PASS (within check) | Strict frontend TypeScript |
| npm.cmd test | PASS: 24 tests, 6 files | Unit/component validation/domain/adapter/image behavior |
| npm.cmd run test:db | PASS: 122 checks | Real PostgreSQL kernel, 19 migrations; Auth/Storage services stubbed |
| npm.cmd run build / npm.cmd run check | PASS | Config guard + TypeScript + Vite; third-party Zod comment warnings are nonfatal |
| npm.cmd run typecheck:edge | PASS: four handlers | Deno static types, not live function requests |
| npm.cmd run test:edge | PASS: 3 tests | Exact origin/no-cache/body bounds/anonymous non-simulation |
| npm.cmd run test:e2e | Final result recorded below | Labelled demo browser; first concurrent cold-start navigation timed out on one rerun, other 21 passed; rerun performed |
| npm.cmd run format; npm.cmd run format:check | PASS | Matched source/config files |
| npm.cmd audit --audit-level=low | PASS: found 0 vulnerabilities | Known npm advisories only |
| npm.cmd run check:bundle | PASS | Actual Vite manifest closure/size and known secret patterns |
| npm.cmd run evaluate:ranking | PASS controlled fixture | 1000 candidates, 778 eligible, 20 runs; Precision@10 1.0; median 1.099ms, p95 15.45ms; not human relevance/network latency |
| npm.cmd run test:production | PASS after final build | Compiled absent-config app; setup banner, no demo fallback/backend requests or uncaught errors |
| npm.cmd exec supabase -- status | BLOCKED exit 1 | docker: command not found (podman also not found) |
| Native supabase start/db reset/test db | NOT RUN | Container runtime absent; pgTAP source provided, not a passing native result |
| Remote db push/functions deploy/real OTP/source proxy/Storage/cleanup worker | NOT RUN | External credentials/services absent; no external mutation/deploy authorized |
| Dedicated penetration/SAST engine, exhaustive secret scan, Lighthouse | NOT RUN | Available lint/pattern/dependency checks and browser Performance API metrics recorded; no substituted claims |

Several checks initially found real implementation defects, which were fixed and rerun: modal focus restoration, private access paths, keyset exhaustion/FTS postfilter, missing connection fallback, reward-farming caps, processed-file bounds/upload membership race, and a dynamic Supabase select TypeScript parser error. The final typed image list uses a typed query and returns only minimum list fields. The concurrent cold-start browser timeout was page.goto waiting for load, not an axe violation; no test assertion was removed or timeout widened.

## 10. Actual journey evidence and measurements

Browser suite covers landing/feed/projects/journal/profile/settings/policies/notifications/trust/member axe scans, real desktop/night/mobile screenshots, horizontal URL/history, publish/save/reply/accept with synthetic participants and notifications, private project/log/archive, 320/375/430/768/1440 reflow/history, keyboard shortcut/Escape/focus, reduced motion, denied trust access, honest source failure, theme/category persistence, member follow, draft recovery and source selection without invented articles. Its scope is local demo UI, never actual SMS or deployed persistence.

The SQL suite covers real relational migrations and permission behavior across anonymous/pending/owner/other/reviewer/moderator/admin/service roles; precise examples are in scripts/test-db.mjs and its command log. Image processor tests run real Sharp against generated pixels, malformed/spoofed data and size constraints. Three Deno HTTP cases test missing auth and request boundaries without inventing a provider response.

Final bundle entry gzip is 156,652 bytes, CSS 4,513 bytes; lazy SDK adds 59,320 bytes gzip in connected mode plus visited feature chunks. The entry budget is not total connected download size. The feature increase over baseline JS is measured and disclosed; six feature modules/SDK defer optional loads. No claim that the entire application is smaller than the prototype.

Production smoke measures only a desktop, unthrottled localhost setup-required screen with absent credentials; saved JSON/screenshot contains actual final FCP/LCP/CLS. These values are not real connected-feed, mobile field or Lighthouse performance. Automated axe scans target WCAG 2.2 AA-related rules but do not certify full AA compliance. No fabricated screenshots, live integrations, institution approvals or model benchmarks.

## 11. External configuration, incomplete work and precise next actions

1. Install/start Docker Desktop or Podman and run the local Supabase start/reset/native SQL tests; alternatively use an explicitly authorized isolated development project. Do not reset a real populated environment. Apply all migrations and taxonomy through a trusted operator. See docs/SETUP.md.
2. Enable managed phone Auth with a supported SMS provider, approved sender/templates/region requirements, hCaptcha, exact site/redirect origins and dashboard expiry/resend/rate rules. Configure VITE_APP_MODE=connected, VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY and VITE_HCAPTCHA_SITE_KEY. Never use a service key in VITE_. Bootstrap separate actual reviewer/moderator/admin/metadata roles through trusted SQL; clients cannot self-assign them.
3. Deploy four functions (scholarly-search, account-delete, avatar, project-images) to the authorized development service, with ALLOWED_ORIGIN, CROSSREF_MAILTO, NCBI_EMAIL, optional NCBI_API_KEY, AVATAR_PROCESSOR_URL, PROJECT_IMAGE_PROCESSOR_URL and AVATAR_PROCESSOR_TOKEN. Runtime SUPABASE_URL/SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY stay server-only. First-party processor uses PROCESSOR_TOKEN and optional PROCESSOR_PORT behind restricted HTTPS; no hosting is created here.
4. Configure trusted retention and storage-cleanup schedules, monitor bounded retries, add inventory reconciliation for unrecorded orphan cases, decide pending-application retention and verify database plus Storage backup/restore. Cleanup worker needs server-only SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY. No real worker execution/cron/backup was performed.
5. Run actual SMS wrong/expired/reused-code, resend/abuse/captcha, role-separated PostgREST/RPC, private Storage/member revocation/expiry/upload/remove, scholarly cache/paging, session revoke, export/delete and concurrency tests. Also verify deployed CSP/CORS/SPA direct routes and conduct manual screen-reader/zoom/physical touch review. Do not publish until these release gates pass.

Incomplete features are specific: credential-evidence/PDF/document upload validation/scanning and reviewer signed access remain unimplemented, so those uploads are disabled; email identity verification, email notifications/digest delivery/scheduling are not implemented, so settings clearly state unavailable. Optional DMs, OpenAlex, AI summaries and embeddings are intentionally absent. No dedicated revision-diff viewer or automatic pull-to-refresh gesture exists; stored post versions and explicit refresh provide the current scope. Real permission-cleared relevance/latency evaluation and production monitoring remain future operator work. No external integration was marked live-complete.

## 12. Deployment, security/privacy risks and recovery

Static frontend deployment preparation is public/_headers and public/_redirects plus dist build. Supabase schema/functions/Auth and private image processor deploy separately. Use isolated preview/production config, HTTPS, exact origin, reviewed secrets, safe role bootstrap, migrations after verified backup, native and real integration tests, operational schedules and post-host header/deep-link checks. No deployment occurred. See docs/OPERATIONS.md for forward migrations, compatible frontend rollback, separate Storage backups, outages, retention and cost categories.

Remaining risks: local Auth/Storage stubs can miss native policy/API differences; external SMS quotas/provider restrictions and multi-account abuse; accepted 60-second signed-link validity after revocation; generic client errors need redacted operator logs; failed compensation may leave unrecorded storage orphans; pending academic retention/legal policy/contact identity unresolved; automated tests do not prove screen-reader/physical-device support or complete security. No paid plan/forever-free claims. No secret/customer data/OTP/marks were printed or embedded in reports. Clinical/patient/IP rules are visible, but free text still requires reporting and moderation.

## 13. Git and final comparison

Git is not initialized in this workspace. Branch, commit hash, tracked diff and untracked classification: unavailable. All implementation is local workspace work, uncommitted and unpushed; no repository initialization, commit, reset or destructive Git operation was performed.

Master sections 1–4 have implemented branded shell/motion/navigation; 5A–M have local operations and secure backend boundaries with explicit disabled conditional document/email features; 6 uses an explainable tested first version rather than unjustified AI; 7–8 have versioned schema/private boundaries/security checks; 9–10 have available local behavior/performance/test evidence; 11 has setup/deployment/operations preparation; 12 was executed; 13/15 artifacts are present. Section 14 is **PARTIALLY IMPLEMENTED**, because actual Auth/database/Storage/provider/deployment/operational acceptance is blocked. Consult the 66-row IMPLEMENTATION_STATUS.md for each feature's status and exact limitations. Do not infer that local passes authorize public release.

## 14. Primary documentation verified during implementation

Official guidance consulted: [Supabase phone Auth](https://supabase.com/docs/guides/auth/phone-login), [CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Edge authentication](https://supabase.com/docs/guides/functions/auth-headers), [API keys](https://supabase.com/docs/guides/getting-started/api-keys), [Storage](https://supabase.com/docs/guides/storage/serving/downloads), [Crossref REST](https://www.crossref.org/documentation/retrieve-metadata/rest-api/), [NCBI E-utilities](https://www.ncbi.nlm.nih.gov/books/NBK25501/), [OpenAlex documentation](https://docs.openalex.org/), [Vite](https://vite.dev/guide/), [Vitest](https://vitest.dev/guide/), [Playwright](https://playwright.dev/docs/intro), [Sharp input](https://sharp.pixelplumbing.com/api-constructor/), [Sharp output](https://sharp.pixelplumbing.com/api-output/), [Prettier CLI](https://prettier.io/docs/cli), [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [OWASP](https://owasp.org/www-project-top-ten/). Version compatibility also checked against installed packages and registry metadata. Inaccessible optional-source documentation did not justify invented APIs. Legal rules/costs require current review in the chosen operating region.

## 15. Final verification stamp

Final available checks all passed on the final source: npm ci; check (lint, TypeScript, 24 tests in six files, 122 PostgreSQL checks, build); four Deno handler type checks; three Deno HTTP tests; formatting; 22 Playwright tests (1.2 minutes); npm advisory scan (zero known vulnerabilities); bundle/config scan; controlled ranking evaluation and compiled production missing-config smoke. The preceding concurrent cold-start attempt timed out on its first navigation with 21 passing; the complete rerun passed without weakening assertions.

Final measured build: entry 497,444 bytes / 156,652 gzip, SDK dynamic chunk 227,823 / 59,320 gzip, CSS 16,358 / 4,513 gzip. Final local production smoke: FCP 596 ms, LCP 660 ms, CLS 0.04198581271701389, no synthetic fallback, zero remote backend requests, zero uncaught errors. This is an unthrottled desktop setup screen, not deployed-feed performance.

Reports and runbooks are complete. External acceptance remains blocked as explicitly listed; this is not a public release or a production-complete declaration. First action: install/start Docker Desktop or Podman, or configure an authorized isolated Supabase development project, then follow SETUP.md for phone/SMS/hCaptcha/migrations/roles/functions/processor and live verification.
