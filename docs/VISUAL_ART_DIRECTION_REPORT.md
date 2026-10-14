# BioCircuit visual art-direction report

Date: 2026-10-10. Outcome: the feasible frontend specification is implemented and locally verified. Connected-service verification and physical-device/manual assistive-technology review remain explicitly limited. No deployment, commit, purchase or external production change was performed.

## Authority and initial audit

Created and read the complete root `BIOCIRCUIT_VISUAL_ART_DIRECTION_PROMPT.md` from the user's authorized requirements before source edits. Its screen-by-screen criteria supersede the old horizontal-canvas visual direction while retaining the existing social layout and backend contract. Inspected the master prompt, social redesign specification, prior build/status/redesign reports, application modules, migrations, Edge Functions, tests, scripts and configuration. The project uses React 19, TypeScript, Vite, React Router, Motion, Supabase, Vitest, Playwright/axe and PGlite. Installed dependencies and the lockfile were retained.

Observed baseline: fixed light sidebar, violet active controls, system typography, a faint background and existing working vertical feed/mobile bottom navigation. The baseline check passed: lint, TypeScript, 30 unit tests, 122 database authorization checks and a production build in 11.16s. Baseline captures were inspected before changing source. No claim was made that working product behavior was broken. This directory is not a Git repository (`git status --short` reported no repository); no branch or commit exists to report. Initial source fingerprints provide change evidence instead.

## Implemented visual system

- Graphite page #0b0d12, opaque reading surfaces #14171f, raised surfaces #1c202b, readable text #f1f3f8 and secondary #a3aec2. Cobalt primary buttons #315bff, readable periwinkle links #9baeff and a deliberate #0000FF project strip. Cyan, coral, violet and warm accents convey useful categories/states. Light mode has separate readable tokens and preserves the user's saved choice; first visits default to dark.
- Self-hosted, licensed Space Grotesk body typography, tall Barlow Condensed headings and monospaced technical metadata. Display headings have a distinct hierarchy while long research text remains readable. Both font files, provenance and SIL OFL licenses are included. No external font runtime request is required.
- Translucent sidebar, contextual top bar and mobile navigation use controlled blur/saturation, edge highlights, layered shadows and a shaped active indicator. Reading cards remain opaque. Browsers without backdrop-filter receive an opaque fallback. The existing sidebar, vertical feed, desktop right rail, routes and mobile destinations are retained.
- A spectral ambient field combines slow transform-based gradients, fine gridwork, static grain and original signal lines. Pointer lighting coalesces input into one pending animation frame and writes a DOM transform directly; it does not render React every frame. Event listeners, observers and pending frames are cleaned up. The existing pause preference persists; reduced motion, touch/mobile and hidden-document behavior reduce or pause activity. Visibility cleanup is unit-tested with explicitly simulated document visibility, rather than claimed from an actual minimized browser.
- Project rows use actual titles, stages, methods, equipment and collaboration needs. A reserved-height electric-blue strip reveals original illustrative optics imagery and a moving title. This fallback is clearly an illustration, not a project photograph or scientific evidence; it never fetches private files. Existing project/workspace links and operations remain intact. Repeated decorative text is aria-hidden; the accessible link has one meaningful name.
- Shared cards, dividers, forms, dialogs, buttons, menus, badges, loading/empty/error states and focus/pressed/selected/disabled treatments carry the same system across Feed, Questions, Explore, Projects/details, Journal, Collaborators, Profiles, Saved, Notifications, Settings, Trust, Policies, authentication and composer dialogs. Landing and missing-route screens also receive the system. No backend role or membership state was invented to obtain a screenshot.

### Reference fidelity and intentional differences

Inspected [BYLD](https://byld.dev/) in a real Chromium browser and saved computed styles/keyframes in `byld-reference-observations.json`. The implemented strip matches its measured #0000FF, 600ms cubic-bezier(0.19,1,0.22,1) reveal and 90 pixels/second linear movement. BioCircuit measures its own repeat width and derives duration rather than assuming the reference's text length. Hover exit/re-entry preserves phase; offscreen strips pause. Keyboard focus is immediate and static; touch and reduced-motion use a direct, static preview with unchanged link behavior and constant geometry.

Space Grotesk follows the observed reference body family. Barlow Condensed is a licensed alternative, not an exact copy of BYLD's Ticketing or Microgramma D. Reference assets, proprietary fonts and application code were not copied. Font sources: [Space Grotesk](https://github.com/floriankarsten/space-grotesk), [Barlow](https://github.com/jpt/barlow). Background visibility behavior follows the [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API).

## Build / inspect / fix refinement evidence

| Pass | Actual captures and inspection | Defects found and corrections |
| --- | --- | --- |
| Initial implementation / pass 1 | Eight feed/project captures at 1440x900, 1024x768, 390x844 and 320x700; desktop/tablet/mobile/narrow inspected; initial build 8.78s, repair build 5.85s | A higher-specificity feed rule shrank the display heading; the extra motion control wrapped the narrow header; a project grid exceeded its container. Corrected heading hierarchy, bounded grids/min-widths and narrow header density. Account access remains in the existing mobile menu. |
| Pass 2 | Sixteen feed/projects/explore/settings captures plus actual desktop hover; desktop hover, tablet settings, mobile projects and narrow feed inspected; repair build 14.02s | Short-phone first content was too low, touch preview was absent, an inline counter-track ignored transforms, and focus motion conflicted with hover. Added static mobile preview, block track, explicit focus pause and compact feed/composer rhythm. Unit suite passed. |
| Pass 3 | Sixty captures of 15 major routes at all four sizes; all four contact sheets inspected; rebuilt and tested | Font/style overhead exceeded the existing CSS budget. A 320px title ended at y642.45, below navigation beginning at y631. Consolidated font files, removed redundant/unused CSS and tightened narrow composer/metadata spacing. Final title ends at y626.45, above navigation. Budgets and assertions were retained. |
| Additional final review | 17 routes x four sizes x two themes = 136 final route captures; dark/light contacts and full-size representative screens inspected; special hover/focus/dialog/provider/loading/populated-notification captures | Verified zero document overflow, uncaught page errors or console errors in route captures. Reviewed actual blue hover, mobile composer/authentication, light provider failure, landing/not-found, initial loading and a real isolated-demo notification. Complete regression checks passed. |

Browser capture batches that exceeded the Node REPL timeout were replaced with a durable capture script; incomplete batches were not treated as successful. An initial supplemental loading capture waited for a fallback during React navigation, which kept prior content visible. Capturing a deliberately delayed initial lazy-module request exposed the genuine fallback instead. A strict locator was then corrected to identify that exact fallback. These were capture harness repairs, not removal of application assertions. The supplemental reply/notification journey passed with one unread notification and zero axe violations; no real backend success was simulated.

## Screenshot and measurement locations

All captures are real browser screenshots, not generated mockups. Contact sheets are scaled compositions of these captures.

- `screenshots/art-direction/baseline/`: desktop feed/projects at 1440x1000, mobile feed at 390x844, BYLD rest/hover. Baseline dimensions reflect the original capture before the requested refinement matrix.
- `screenshots/art-direction/pass-1/`, `pass-2/`, `pass-3/`: refinement screenshots and route measurements.
- `screenshots/art-direction/final-dark/` and `final-light/`: 68 route screenshots per theme plus contact sheets and additional states. Size prefixes are desktop 1440x900, tablet 1024x768, mobile 390x844 and narrow 320x700.
- Representative inspected full-size results: `final-dark/desktop-project-hover.png`, `narrow-feed.png`, `tablet-projects.png`, `mobile-auth.png`, `mobile-composer.png`, `narrow-loading.png`, `mobile-notifications-populated.png`; `final-light/desktop-feed.png`, `mobile-provider-error.png`, `mobile-composer.png`. Dark/light route contact sheets support broad consistency review; screenshot generation alone is not asserted as manual inspection of every full-size image.
- `final-dark/measurements.json` and `final-light/measurements.json`: viewport, route, overflow, errors, loaded-font and first-title/navigation bounds. All 136 route records have no document overflow or recorded page/console errors. Intended local topic scrolling and clipped decorative marquee loops do not create horizontal page scrolling.
- `art-project-preview-evidence.json`: #0000FF, 96px reserved strip, 1019.296875px loop / 11.3255208333s = 90px/s, running animation and measured reveal curve.
- `art-offscreen-preview.json`: a real preview below a 400px viewport is paused.
- `art-populated-notifications.json`: actual isolated-demo reply generated one notification; zero WCAG axe violations. Loading captures explicitly delay only the local lazy module, not a production service response.

Reproduce route captures against an isolated demo server on port 5180 with `node scripts/capture-art-direction.mjs final-dark dark` and `node scripts/capture-art-direction.mjs final-light light`. `node scripts/inspect-art-states.mjs` captures delayed initial loading and actual demo reply notifications. It checks the demo banner before mutation. Development entry: `npm.cmd run dev -- --port 5180`, using the existing explicit demo configuration; [SETUP.md](SETUP.md) explains modes and external configuration. No secret values are embedded in commands or reports.

## Commands actually executed and final results

| Command | Final result / evidence |
| --- | --- |
| `npm.cmd run check` | PASS: lint, TypeScript, 32 unit tests in eight files, 122 database authorization checks, production build 10.51s / 2166 transformed modules. `art-final-check.log` |
| `npm.cmd run lint` | PASS again after the supplemental capture script. `art-final-lint.log` |
| `npm.cmd run format:check` | PASS again after the supplemental capture script. `art-final-format.log` |
| `npm.cmd run typecheck`; `npm.cmd test` | PASS separately; 32 unit tests. `art-final-unit.log`; also included in final check |
| `npm.cmd run test:e2e` | 47 passed in 5.3 minutes. `art-final-e2e.log` |
| `npm.cmd run typecheck:edge` | All four Edge entrypoints pass Deno checks. `art-edge-typecheck.log` |
| `npm.cmd run test:edge` | Three HTTP/security tests passed, zero failed. `art-edge-tests.log` |
| `npm.cmd run check:bundle` | PASS: initial JS 120049 bytes gzip, CSS 9941 bytes gzip. `art-final-bundle.log` |
| `npm.cmd run test:production` | PASS: honest setup-required state, no synthetic fallback, zero remote backend requests and uncaught errors. Local FCP 352ms, LCP 416ms, CLS 0.002377. `art-production.log` |
| `npm.cmd audit --audit-level=moderate` | Zero reported dependency vulnerabilities. `art-security.log`; this is not a complete security certification |
| `npm.cmd run evaluate:ranking` | Existing synthetic fixture passed: 1000 candidates / 778 eligible, precision@10=1, median 5.33ms, p95 71.484ms over 20 runs. Not human relevance or live network latency. `art-ranking.log` |
| `node scripts/capture-art-direction.mjs final-dark dark`; equivalent light run | 136 final route records, no overflow/page/console errors. `art-final-dark-capture.log`, `art-final-light-capture.log` |
| `node scripts/inspect-art-states.mjs` | PASS: eight loading/populated-notification captures, real demo reply and zero axe violations. `art-state-inspection.log` |

Existing browser tests retain journeys for posting/saving/replying/accepted answers, project creation/privacy/logs/archive, member following, notification preferences, drafts, navigation/history/mobile menu/focus, source failure and moderation denial. New tests cover loaded typography, default theme/glass, pointer/pause persistence, exact preview color/speed/phase/geometry, keyboard/touch/reduced motion, narrow layout, light-theme WCAG checks, a real unavailable provider error and composer interaction. Two new unit tests check ambient pointer coalescing and cleanup/visibility behavior.

One initial new multi-route light accessibility test exceeded its 30-second harness timeout under concurrent load; its timeout was increased to 90 seconds without changing assertions, and the complete 47-test suite passed. Intermediate CSS budget failures were corrected instead of relaxing the budget. Concurrent build/log writes briefly raced; final check, bundle and production verification were rerun sequentially. Rollup reports nonfatal annotation warnings in installed Zod code; the production build passes.

Database checks execute actual versioned migrations and authorization/constraint scenarios in PGlite; Supabase Auth/Storage services are stubbed. They are not a live hosted Supabase validation. No database reset or external destructive operation was run.

## Performance, accessibility and preservation

No dependencies were added, removed or upgraded. Initial JavaScript remains below the existing 180000-byte gzip budget; CSS is below 10000 bytes, with only 59 bytes of headroom. Future CSS additions need budget review. Connected mode also loads a separate SDK chunk (59320 bytes gzip); this is an entry budget, not total connected download. Full self-hosted font files add 109764 bytes before HTTP compression, reported separately.

A 2.2-second local unthrottled Chromium sample at 1440x900 with the hovered marquee and ambient gradients actively moving recorded zero layout recalculations and zero layout/script duration deltas (`art-animation-performance.json`). This supports transform-based idle rendering; it does not establish physical-device frame rate, GPU cost or long-session smoothness. Production smoke metrics above measure the local setup-required page, not a connected research feed or field deployment.

Existing accessible names, native form/dialog semantics, focus restoration, skip link, aria-current, role restrictions and keyboard shortcuts are retained. Axe checks pass in the exercised dark/mobile and light route states. Keyboard and touch preview actions are real links. Reduced-motion and pause behavior are checked separately from visual aesthetics. Automated axe does not replace manual screen-reader evaluation.

`art-backend-preservation.json` compares 40 original backend/domain/adapter fingerprints: zero changed. Migrations, RLS, Edge Functions, authentication, academic eligibility, private storage, validation and privileged operations are untouched. Visual badges and unavailable controls remain truthful. No sample content was promoted into production, privileged frontend role checks substituted for backend security, or live OTP/storage success fabricated.

## Important files changed

Existing application files modified: `src/styles.css`, `src/Workbench.tsx`, `src/components/SocialShell.tsx`, `src/features/Projects.tsx`, `index.html`. Existing documentation modified: `README.md`, this report and `docs/VISUAL_REFINEMENT_CHECKLIST.md`.

New files: root `BIOCIRCUIT_VISUAL_ART_DIRECTION_PROMPT.md`; `src/components/AmbientField.tsx`; `src/components/ProjectPreview.tsx`; `src/fonts.css`; `public/grain.svg`; two `public/fonts/*.woff2` assets, their two OFL license files and `SOURCES.md`; `tests/ambient.test.tsx`; `tests/e2e/art-direction.spec.ts`; `scripts/capture-art-direction.mjs`; `scripts/inspect-art-states.mjs`; the `docs/art-*` evidence/logs, baseline/source fingerprints and screenshots enumerated above. The source change inventory is `art-source-changes.json`. No existing source files or tests were deleted; only temporary font-subset experiment files created during this task were removed.

## Final acceptance and remaining limits

The coherent identity, translucent navigation, restrained live field, accessible blue marquee, all major page styling, responsive four-size layouts, no page overflow, keyboard/reduced-motion support and preserved local product journeys are COMPLETE and locally verified. At least three implementation/capture/inspection/fix passes plus additional final review were executed. [VISUAL_REFINEMENT_CHECKLIST.md](VISUAL_REFINEMENT_CHECKLIST.md) records the complete requirement status.

PARTIAL: physical-phone/tablet Safari review, manual screen-reader evaluation and long-session GPU/battery profiling are not available in this environment. Privileged and fully populated connected-service screens inherit the shared system and retain tested access boundaries, but their live operational content was not visually fabricated.

BLOCKED external integration verification: existing Supabase project/Auth/SMS provider/hCaptcha/Edge scholarly proxy/private-storage configuration is still required for live OTP, academic review, metadata and upload journeys. Docker/Podman is unavailable for the native local Supabase stack; PGlite migration/policy checks passed instead. Configure the existing services using [SETUP.md](SETUP.md) and [OPERATIONS.md](OPERATIONS.md), then run connected staging journeys with authorized test accounts. No external configuration is needed to inspect the completed isolated demo visual redesign.

The local demo is available at http://127.0.0.1:5180/feed. The result is not represented as perfect, award-winning or production-certified; actual evidence and its limits are stated above.