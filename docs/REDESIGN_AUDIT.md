# Social redesign audit

Authority: BIOCIRCUIT_SOCIAL_REDESIGN_SPEC.md read completely before application edits. The earlier master product/security contract remains; only horizontal primary navigation is superseded. Current root confirmed. Git status returns 128 (no repository); source backups and backend/data/domain fingerprints preserve the current workspace state.

## Observed browser baseline

Captured ten current screenshots under docs/screenshots/redesign/baseline: feed at 1440x900, 1024x768, 390x844 and 320x720; questions, projects, journal, profile, settings and denied trust at desktop.

- Desktop: giant serif heading, wide sparse cream reading panel inside a dark shell, full-panel purple focus border, filters taking a full row, first post beginning around y=500. No contextual discovery rail. Essential routes compete with numbered canvas controls.
- Mobile: wrapped desktop navigation consumes about 240 pixels before search; hero then consumes most remaining viewport. Fixed sideways dock covers filters at the bottom. The narrow screenshot contains no useful post in its initial viewport.
- Existing source: sideways scroll/snap/ref/sync timer, viewport-height shell and panel-local reading scroll. Route transitions depend on panel width; adaptive navigation and typography are weak.
- Projects/journal/profiles/settings inherit oversized editorial headings and largely open document/form layouts; no clear page-family hierarchy. Trust correctly denies ordinary fixture users; no privileged data will be synthesized for a screenshot.

## Preservation boundaries

Actual 19 SQL migrations, four Edge Functions, Auth/data/domain modules and existing tests verified. Forty backend/data/domain file hashes held for comparison. Private images, optional grades, role-restricted review, academic vs phone state, explicit source errors, disabled PDF/email features and production missing-config behavior remain. No new schema or privileged client logic is needed for the shell.

## Ordered execution

1. Replace shell/tokens: fixed labelled desktop sidebar, contextual top/search, native vertical center, honest right rail, compact mobile top and five-destination safe-area bottom nav. Keep deep links/history/focus/shortcuts.
2. Feed first: real taxonomy circles, composer entry, modes/compact filters, author/action hierarchy, question/project/paper variants and meaningful post controls. Capture/inspect before other pages.
3. Explore with existing bounded APIs and privacy predicates; then questions/projects/journal/collaborators/profile/saved/notifications/trust/auth/settings/policies.
4. Inspect light/dark and 320/375/390/768/1024/1280/1440 layouts; check dialog/menus/long content and bottom bar visibility. Add regression assertions for vertical layout, existing workflows and privacy.
5. Run available baseline/final checks; compare backend fingerprints; record failures, fixes, measurements and remaining external limitations in REDESIGN_REPORT.md.

## Evidence boundaries

Browser preview uses explicitly labelled synthetic data only. Source records, live Auth/OTP/Storage and actual reviewer queues still require the documented development service. Automated accessibility plus keyboard/viewport tests are not a manual screen-reader or physical-device certification. Baseline command results will be appended when complete.

## Completed execution and final evidence

- [x] Baseline npm run check: 24 unit tests, 122 PostgreSQL checks and production build passed (redesign-baseline-check.log).
- [x] Shell and tokens implemented; canvas/dock/wheel-axis behavior removed. Feed-first browser capture inspected before remaining page families.
- [x] All specified major pages share the social structure; Explore, separate saved categories, queue filters and shared paper cards integrated with current adapters.
- [x] Four-size captures and seven-width route regression matrix; desktop/tablet/mobile/narrow contact sheets and dark/dialog screenshots inspected. No document overflow in 60 route captures.
- [x] Final lint/typecheck/build/format, 30 unit/component tests, 42 browser tests plus 8 affected reruns, 122 SQL checks, four Edge type checks, three Edge HTTP checks, bundle/production smoke and zero-advisory scan pass.
- [x] All 40 preserved backend/domain/data fingerprints unchanged.
- [x] REDESIGN_REPORT.md records requirements, files, actual checks, screenshots, subjective rubric and external gates. No Git commit or deployment.

Assumptions/limits: visual scores are engineering judgments; live OTP/reviewer/Storage/provider flows require configured development services. No real integration success is inferred from demo or SQL stubs.
