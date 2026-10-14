# BioCircuit social redesign report

Date: 2026-10-10. Workspace: D:\personal_projects\my apps\biocircuit-source\biocircuit. No Git repository is initialized; no branch, commit, push, public deployment, billable resource or external infrastructure change was made.

The social redesign is implemented across the major page families and verified locally. The horizontal primary canvas is removed. Backend integrations still require the external development configuration documented in SETUP.md; local verification is not a claim of live OTP, academic approval, Storage or scholarly provider success.

## Authority and preservation

BIOCIRCUIT_SOCIAL_REDESIGN_SPEC.md was read completely before application edits. It overrides the earlier horizontal-canvas direction only. MASTER_IMPLEMENTATION_PROMPT.md, current implementation/build reports, feature modules, data/domain code, migrations, Edge Functions and tests were inspected. The repository was extended directly; no second application, obsolete ZIP, generic template replacement, source deletion or destructive Git command was used.

The initial interface is retained as text snapshots in redesign-baseline/. Ten actual browser baseline screenshots are in screenshots/redesign/baseline/. Final SHA256 comparison found **zero changes across all 40 backend/data/domain files**, including 19 migrations and four Edge Functions. Evidence: redesign-backend-preservation.json. Auth/Storage policies, RPCs, row-level authorization, private academic records, role assignment, input validation and isolated demo/connected adapters remain intact. package.json/package-lock.json were not changed; no dependency was added, removed or upgraded.

## Baseline observations and resulting design

The original desktop preview had an oversized serif hero, a sparse cream panel inside a dark shell, a full-panel purple focus outline and competing numbered canvas controls. On mobile, wrapped navigation consumed about 240px, and a fixed sideways dock covered controls; the narrow first viewport contained no post. These are browser observations, not assumptions about backend behavior.

The replacement has a fixed 232px desktop sidebar, a 72px contextual top bar, a vertically scrolling reading column, and a 300px contextual rail on large screens. Tablet hides the rail; mobile has one column, compact brand/search controls and five bottom destinations: Feed, Explore, Create, Projects and Profile. Secondary destinations remain available in the mobile navigation dialog. Only the small labelled research-circle strip scrolls sideways. There is no wheel interception, full-page scroll snapping, viewport-height canvas or sideways navigation dock.

Light tokens use #F6F5FB page, white surfaces, #211D35 text, violet #6554E8, coral #FF6E79, aqua #20BFB1 and sky #54A9F6. Accessible darker accent inks are used for text. Dark tokens use #12121C page, #1C1B2A surfaces and lighter text/accent inks. Segoe UI/system sans avoids font downloads. Shared focus states, 160ms transitions, 8–16px radii, restrained borders and shadows unify controls. Initials are deterministic avatar fallbacks, not fabricated profile photographs.

Faint microscopy rings and a wavelength sit behind content. CSS transforms drive slow restrained motion; pause controls, prefers-reduced-motion and static mobile behavior are preserved. No video, WebGL, large model or animation dependency was introduced. Content never waits for entrance animation.

## Requirement and page coverage

| Requirement / page | Result | Verification and limits |
|---|---|---|
| Responsive social shell, contextual controls, sidebar and mobile navigation | COMPLETE AND VERIFIED locally | Direct routes, browser back/reload, scroll restoration, search focus, modal focus and 7 required widths tested. |
| Feed hierarchy, topic circles, composer entry, modes, compact filters and contextual rail | COMPLETE AND VERIFIED locally | Feed-first screenshot inspected before other page families. Real taxonomy and current snapshot data only. No invented online/trending counts. |
| Discussion/question/project/paper card distinctions and post controls | COMPLETE AND VERIFIED locally | Publish, edit/reload, replies, accepted answer, save/reload, report, mute/reload and menu Escape checks passed. Paper operations tested with isolated fixtures. Existing delete/follow/block/subscribe controls use the original adapters; sharing retains the original clipboard handler and honest error feedback. |
| Explore / search | COMPLETE AND VERIFIED locally | Category tabs, clear controls, topic tiles, stage/year/unanswered filters, pending state and bounded existing search pagination. Tests exclude pending/private/blocked profiles, muted posts and restricted projects; authoritative result IDs are honored. No recent searches stored. |
| Questions | COMPLETE AND VERIFIED locally | Recent / Unanswered / Solved, methods/tried, answer states, readable details and accepted-answer treatment; publishing/reply/accept journey passed. |
| Projects and project workspace | COMPLETE AND VERIFIED locally | Purpose/stage/needs/methods/equipment cards, vertical detail/timeline, team and ownership controls retained. Private creation, log, archive/restore journey passed; SQL access tests retained. Live processed uploads remain externally blocked. |
| Journal Club / scholarly metadata | UI COMPLETE AND VERIFIED; live search BLOCKED BY EXTERNAL DEPENDENCY | Shared provenance/identifier/canonical cards, save/discuss/report, source/year search and original pagination/failure behavior. No sample papers inserted into demo or production. Live proxy setup required. |
| Collaborators and profiles | COMPLETE AND VERIFIED locally | Expertise-first cards, real availability, deterministic avatars, profile editing/privacy/account controls and safe member routes. Member follow and preferences persist in demo checks. Private avatar pipeline retained and visibly unavailable in demo. |
| Saved posts and papers | COMPLETE AND VERIFIED locally | Separate categories; posts use existing bookmarks, papers use own paper-save relations. Empty views have real destinations. Metadata save/unsave/discuss component tests and database tests passed; live provider acquisition requires configuration. |
| Notifications | COMPLETE AND VERIFIED locally | Actual user-scoped events, unread/read styling and mark-all-read behavior; reply-to-notification journey passed. Preferences retained. No fake activity created. |
| Trust / moderation | UI COMPLETE AND VERIFIED; live operations BLOCKED BY EXTERNAL DEPENDENCY | Authorized queue/status filters, explicit empty states, reason capture and high-impact confirmation. Reviewer cancellation/confirmation and suspended-role denial tested with isolated component fixtures. Normal browser demo correctly denies access; no fake privileged reviewer screenshot was created. SQL reviewer/moderator boundaries remain verified locally. |
| Auth / onboarding | UI COMPLETE AND VERIFIED; live phone/review BLOCKED BY EXTERNAL DEPENDENCY | Accessible progress and private forms retained; phone and academic status remain distinct. Demo explicitly identifies synthetic membership and unverified phone. No fake OTP or credential upload success. |
| Settings / policies | COMPLETE AND VERIFIED locally | Consistent grouped reading/motion, preferences, interests, account and privacy controls; theme, pause and notification settings persist. Policies retain existing retention/eligibility limits. |
| Motion / keyboard / focus / touch / reflow | COMPLETE AND VERIFIED in Chromium automation | Reduced motion, visible names/targets, dialog focus return, menu dismissal, continuous search typing and native history restoration passed. Physical devices/manual screen readers were not available. |
| Backend/security preservation | COMPLETE AND VERIFIED for unchanged local code and SQL checks | 40 unchanged fingerprints; 122 PostgreSQL tests, four Edge type checks, three Edge HTTP tests and zero-advisory npm scan. Not a production security certification. |

## Important files

Created: src/components/SocialShell.tsx, src/components/PaperMetadataCard.tsx, src/features/Explore.tsx, tests/redesign.test.tsx, tests/e2e/redesign.spec.ts, docs/REDESIGN_AUDIT.md, this report, backend preservation evidence, baseline snapshots, logs and screenshots.

Modified application files: src/Workbench.tsx, src/styles.css, src/features/Feed.tsx, Projects.tsx, Journal.tsx, Account.tsx, Member.tsx, Trust.tsx, Auth.tsx and Composer.tsx. Modified tests: tests/e2e/workbench.spec.ts and accessibility.spec.ts. README.md documents the new shell; historical implementation/build reports carry a pointer to this current UI report. No source files deleted. Avatar.tsx, ProjectImages.tsx and the entire data/domain/backend implementation remain unchanged.

The shell holds navigation and existing useCommunity orchestration; business mutations remain in the existing adapter/RPC contract. Heavy page families/composer remain lazy loaded. Shared paper cards avoid duplicating mutation logic. Search retains the bounded server API, debounce and abort cleanup. Route history restores reading positions; search-initiated route changes no longer steal focus.

## Commands actually run and final results

PowerShell used npm.cmd/npx.cmd because npm.ps1 is restricted. Logs contain actual output; PowerShell can wrap warnings from stderr as NativeCommandError even when the process exits 0.

| Command | Final result | Evidence |
|---|---|---|
| npm.cmd run check (lint, typecheck, unit, PostgreSQL, production build) | PASS, exit 0 | redesign-check.log; latest build 12.74s, 122 SQL checks; then added two paper tests and reran lint/typecheck/unit. |
| npm.cmd run lint; npm.cmd run typecheck; npm.cmd test | PASS; **30 tests / 7 files** | redesign-unit-final.log; lint/typecheck exit 0. |
| npm.cmd run test:e2e | PASS; **42 tests**, 4.8m | redesign-e2e.log. Includes 14 route axe scans plus dark/mobile, dialogs, core workflows, 7-width route reflow and history. |
| Targeted Playwright rerun after final short-phone styling | PASS; **8 tests**, 1.3m | redesign-mobile-final.log: axe/feed, dark/mobile, composer, all major routes at 320/375/390, publishing and 320 history. |
| Focus regression repeated three times | PASS; 3/3 | redesign-focus.log. |
| Focused auth/edit/history regression | PASS; 3/3 | redesign-focused.log. |
| npm.cmd run typecheck:edge | PASS; all four functions | redesign-edge-typecheck.log. |
| npm.cmd run test:edge | PASS; 3/3 HTTP tests | redesign-edge-tests.log. |
| npm.cmd run format:check | PASS | redesign-format.log. |
| npm.cmd audit --audit-level=moderate | PASS; zero vulnerabilities reported | redesign-security.log. |
| npm.cmd run check:bundle | PASS | redesign-bundle.log; values below. |
| npm.cmd run test:production | PASS | redesign-production.log; values below. |
| npm.cmd run evaluate:ranking | PASS; controlled fixture | redesign-ranking.log; precision@10 1, median 5.732ms, p95 80.462ms; not human relevance or network performance. |
| Backend SHA256 comparison | PASS; 40/40 unchanged | redesign-backend-preservation.json. |

Baseline npm.cmd run check passed with 24 unit tests and 122 SQL checks before redesign; see redesign-baseline-check.log. Intermediate regressions were fixed: incorrect review queue conjunction, wrong muted-preference property, undersized discovery link, mobile account button accessible name, detail test racing route render, progress-label semantics and route focus competing with dialog focus. Additional actual browser demo journeys verified a reaction count of 1 after reload, canonical clipboard sharing with the previous clipboard restored, and creation/removal/reload of a dedicated test contribution; see redesign-manual-journeys.json. Existing tests were not removed or weakened. The canvas-navigation assertion was replaced with real sidebar navigation and an assertion that canvas/dock are absent because the new specification explicitly removes that model.

Vite/Rollup emits two annotation-position warnings from installed Zod. Builds succeed; dependencies were not changed to suppress these warnings. A transient Vite watcher/empty-module race during non-atomic saves was resolved by restarting the owned development server and switching source writes to atomic replacement. Browser tool timeouts affected measurement attempts only; captures were repeated. One automatic approval-review usage-limit error temporarily prevented a tool action; it was reported, the user said continue, and the action later executed. No unresolved approval rejection remains.

## Performance evidence

Latest manifest budget: **119,418 bytes initial JavaScript gzip**, **8,515 bytes CSS gzip**, within unchanged 180,000/10,000 budgets. The Supabase SDK is a separate connected-mode dynamic chunk; the entry budget is not the total connected download.

Latest production missing-configuration smoke: setup-required true, synthetic fallback false, zero remote backend requests, zero uncaught errors; FCP/LCP 208ms and CLS 0.002377 in unthrottled local desktop preview. This is a setup screen measurement, not a populated connected-feed benchmark or field performance result. Content rendering remains bounded, vertical scrolling native, fonts local and background animation transform-only. No claim about low-end physical-device frame rate is made.

## Screenshot and interaction evidence

Baseline: screenshots/redesign/baseline/. Final: screenshots/redesign/. Core page captures use desktop-*, tablet-*, mobile-* and narrow-* names, at **1440×900, 1024×768, 390×844 and 320×720** respectively. Fifteen routes were captured at each size: feed, explore, questions, projects, journal, collaborators, profile, saved, notifications, trust, settings, policies, post detail, project detail and member. layout-measurements.json records 60 captures with no document overflow or runtime errors. Browser regression coverage additionally includes 375, 768 and 1280 widths (plus 430 in retained history tests).

Inspected individual desktop/feed/explore, tablet/feed, mobile/feed/settings/auth/composer/bottom-actions, dark desktop/mobile and narrow feed screenshots, and the desktop/tablet/mobile/narrow contact sheets spanning the remaining page families. Final phone/feed/question/detail captures were refreshed after density refinement. At 320×720 the first post starts around y=503 and its complete title ends around y=645, above the navigation at y=651. At the bottom of the 390px feed the last card ends around y=731, above navigation at y=775; final actions remain reachable. Long composer titles and dialogs are covered by browser tests; plain text, URLs and identifiers wrap safely.

The automated accessibility screenshot test also emits a full-height dark narrow capture; the final narrow-feed.png was refreshed to the specified 320×720 viewport. Contact sheets are reduced copies of actual captures for inspection, not fabricated screen designs. No screenshots assert live academic approval, real fetched paper records or live storage success.

## Visual rubric (engineering self-assessment, not user research)

| Criterion | Score | Screenshot / interaction basis |
|---|---:|---|
| First impression | 8/10 | Branded biomedical circles, social author/content hierarchy and useful persistent navigation replace the failed canvas. desktop-feed.png and mobile-feed.png. |
| Hierarchy | 8/10 | Separate sidebar/top context, constrained reading column, lighter metadata and clear actions. Short-phone title visible above bottom nav. |
| Color | 8/10 | Deliberate violet/coral/aqua/sky roles and quiet surfaces; light/dark contrast scans pass. |
| Content design | 8/10 | Question status, project milestone preview and bibliographic panel are distinct. Paper populated state assessed with isolated component tests, not invented browser records. |
| Consistency | 8/10 | Same typography, forms, avatars, focus and surfaces across the inspected contact sheets and dialogs. |
| Responsiveness | 8/10 | Four-size captures and seven-width automated route matrix; no page overflow. Physical-device ergonomics still need observation. |
| Usability | 8/10 | Core journeys pass; clear search, Create, save, question and project actions; menu/secondary destinations remain accessible. |
| Accessibility | 8/10 | Axe, reduced motion, names, native dialogs and keyboard focus verified. Manual screen-reader review remains outstanding. |
| Performance | 8/10 | Measured bundle budgets, native scroll and restrained CSS background; live-feed field measurements still unavailable. |
| Trust | 9/10 | Demo/phone/review/provider/setup limitations remain explicit; unchanged authorization and no invented growth/paper/verification claims. |

These are subjective engineering judgments calibrated to the inspected preview, not a guarantee that the user will rate it identically. All first-six criteria meet the requested internal threshold after revisions.

## Remaining external gates and next action

1. Configure a separate Supabase development project using SETUP.md: apply existing migrations, managed Auth SMS/provider limits and hCaptcha, trusted reviewer assignments, the four deployed functions and their server-only secrets. Run real phone → application → authorized reviewer → approved/restricted member journeys against that environment. Do not put service-role/provider credentials in Vite variables.
2. Configure the scholarly proxy and test genuine Crossref/PubMed results, provider rate limits and pagination. Metadata remains attributed and no unrestricted full-text access is implied.
3. Configure the private image processor/Storage pipeline and verify upload, signed URL expiry/revocation, membership removal and deletion. Academic evidence and PDF uploads remain intentionally disabled pending reviewed validation/scanning; email/digests/direct messaging remain unavailable as previously documented.
4. Docker/Podman is unavailable here, so the native Supabase Auth/Storage stack could not run. PostgreSQL authorization tests execute real SQL with stubbed Auth/Storage services and do not replace this gate.
5. Perform manual screen-reader and physical-device/touch review and gather user feedback on the new visual result. Current browser verification used Chromium automation.

No independent redesign implementation task remains known to be blocked or failing. Live-service readiness remains blocked by the existing external configuration above; this report does not mark those integrations production-ready. The redesign specification's Sections 1–9 are addressed through the implemented UI, preservation and verification evidence, Section 10 is assessed above, and Section 11's execution/report deliverable is fulfilled. The earlier master security/backend contract remains in force; its horizontal primary navigation is intentionally superseded by the new authority.
