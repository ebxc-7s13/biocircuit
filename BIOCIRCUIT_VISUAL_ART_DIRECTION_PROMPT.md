# BioCircuit visual art direction

Created 2026-10-10 from the user's authorized requirements. This document refines the existing social redesign; only visual decisions are superseded. Existing product, backend, privacy and security contracts remain authoritative.

## 1. Product and preservation
Keep the sidebar, contextual top bar, native vertical reading column, desktop contextual rail and five-destination mobile navigation. Preserve all routes, wording, content types, access checks, validators, mutations, dialogs, drafts, search, history restoration and truthful demo/source/verification states. Do not restore horizontal page navigation, fabricate data, publish externally or modify backend behavior to obtain visual results.

## 2. Identity and tokens
Use deep graphite #0B0D12 page, #14171F reading surfaces, #1C202B raised surfaces, #F1F3F8 primary text and readable cool-grey secondary text. Electric blue #0000FF belongs to the signature strip; use cobalt #315BFF on primary buttons with white text and light periwinkle for dark-theme links to retain contrast. Cyan, violet, coral and warm amber accents distinguish content types and truthful state semantics; avoid rainbow headings or indiscriminate glass cards.
Support a deliberate light theme with cool ivory/blue-grey surfaces, dark graphite type and accessible cobalt links. Make dark the first-visit default while preserving saved theme choice. Keep semantic spacing, border, radius, focus, elevation and motion tokens. No hardcoded decoration in business logic.

## 3. Typography
Self-host open-licensed Space Grotesk for body/UI and Barlow Condensed semibold for display headings and project marquee. These intentionally adapt BYLD's Space Grotesk/Ticketing combination; do not claim an exact Ticketing font copy. Include licenses and provenance. Fonts must load from the app origin, use swap and sensible fallbacks. No remote runtime font requests or security-header relaxation.
Display headings: tall condensed, 36–44px desktop, 30–34px phones, tight tracking and 1.05–1.12 line height. Long scientific titles wrap naturally. Feed post titles remain readable 20–23px body-font semibold rather than decorative all-caps. Body 14–15px, comfortable 1.6 line height; metadata at least 11–12px with mono for identifiers, labels and measurement values. No uppercase treatment of user prose. Compact phone hierarchy must reveal the first post title above bottom navigation.

## 4. Live environment
Build an original spectral microscopy-inspired CSS environment: slow cobalt/cyan/violet luminous fields, fine technical line grid and subtle static grain. Animate transform/opacity only; no continuously rerendered React state, no canvas/heavy dependency required. Limit animated layers, no full-screen animated filters or displacement effects. Keep reading cards opaque enough for legibility.
A pointer light may react to fine-pointer movement through at most one pending animation frame; it must not intercept input and must clean up listeners/frame callbacks. Pause activity on document visibility hidden. Respect saved pause setting and reduced motion. Mobile/coarse-pointer and less capable devices receive the designed static composition. Provide an immediately accessible Pause/Resume ambient motion action in the top bar and retain Settings control. Motion state must never imply live research data.
Acceptance: movement noticeable in exposed margins over time, no document overflow, static fallback retains depth, CSS animations stop when paused/reduced/hidden, no listeners accumulate after unmount.

## 5. Liquid-glass navigation
Use controlled translucency on sidebar, sticky top bar and mobile bottom navigation only. Provide backdrop blur/saturation, fine light edge, tinted inner highlight and layered shadow. Background should be visible through these surfaces without reducing label contrast. Include an opaque fallback when backdrop-filter is unsupported. Active route gets a cobalt-tinted panel, distinct left/underline indicator and weight change, plus aria-current. Stable routes and usable 44px controls remain intact. No floating glass blocks over reading content.

## 6. Signature project marquee
Recreate the measured BYLD behavior as an original project-preview interaction. Reference facts: #0000FF band, 600ms cubic-bezier(0.19,1,0.22,1) transform reveal, leftward linear continuous marquee approximately 90px/second. Adapt dimensions to the central column; never move the whole page.
Project discovery uses full-width editorial project rows with readable overview, method/equipment facts, actual tags/needs, explicit detail links and a dedicated preview link. Within the reserved preview-link rectangle, reveal a blue horizontal strip containing repeated actual project title, actual stage and original technical optics SVG fallback. Use a real safely authorized image only if already available without bypassing project-image authorization. Never invent photographs or expose private images. SVG fallback must be clearly illustrative, not fake project evidence.
Resting preview conveys the same project identity and destination. Mouse hover reveals the band; keyboard focus gives an immediate/static blue preview without forcing continual text motion; touch sees a static blue strip with a direct working detail link, without a two-tap hover trap. Screen readers hear one meaningful project-link name; repetitions and motif are aria-hidden. Pause/reduced motion stops the marquee and uses the static blue strip. Keep phase while entering/leaving: pause/resume rather than restarting animation. Offscreen rows and hidden tabs pause their marquee. No height changes, clipping of essential content, duplicate interactive layers or blocked clicks.
Acceptance: real link navigates to existing workspace; repeated hover reverses smoothly; focus visible; touch direct navigation; reduced/static/pause honors settings; long titles do not widen page; row geometry remains fixed before/after hover; animation is confined to preview surface.

## 7. Shared components and interactions
Reading surfaces use graphite/light opaque fills, restrained radius, thin dividers and directional highlights. Buttons primary cobalt/white, secondary neutral; hover tint, visible focus, fast pressed feedback, unambiguous disabled state. Named transitions only, no transition all. Preserve native dialog semantics/focus return, readable form controls, error alerts, menus with Escape and outside dismissal. No gratuitous entrance sequences on keyboard actions or entire feeds.
Refine skeletal loading bars, truthful empty/denied/error states, tags and status chips, avatars, composer, source cards, tooltips where already supported, notifications and toast. State color always accompanied by words/icon; scientific plain text remains encoded. No new inactive controls.

## 8. Screen-by-screen specification and acceptance
| Screen | Visual direction | Required preserved operation / acceptance |
| --- | --- | --- |
| Feed | Compact condensed context headline, technical eyebrow, spectral research circles, elevated composer, clear selected modes, readable text-first posts, thin action separators | Existing compose, filters, follow, reply, save, react, report, share, author link and provenance work; first title visible on 320x700; no giant hero |
| Questions | Same feed rhythm with clear open/solved labels and answer hierarchy | Recent/unanswered/solved, accepted-answer workflows and permissions remain |
| Explore | Strong search field, compact category tabs and technical discovery tiles | Continuous typing/focus, clear, categories, real filters, bounded search and honest no-results |
| Projects | Full-width editorial work rows; signature blue previews; strong stage/type labels | Create/filter/open; no fake numbers/images; keyboard/touch destination works |
| Project workspace | Condensed title, readable overview/facts, vertical team/timeline, consistent actions | Private visibility, images, logs, requests, archive/delete/transfer restrictions intact |
| Journal | Editorial headline and restrained bibliographic surfaces with mono identifiers | Real provider search, attribution/save/discuss/canonical URL and honest provider errors |
| Collaborators | Professional readable profile cards, concise research interests and equipment | Follow/member discovery, eligibility/privacy/block restrictions intact |
| Profile and member | Large initial avatar, editorial name, clear qualifications/interests/details/tabs | Existing edit/privacy/export/delete/follow/block operations remain; no fabricated badges |
| Saved | Quiet reading-list categories, consistent posts/papers | Real save relations/removal and clear empty state |
| Notifications | Fine divided activity rows, unread shape/label and readable timestamp | Real read/unread actions and navigation |
| Settings and policies | Grouped calm reading surfaces, legible form labels, contained long links | Theme/pause/preferences/privacy workflows and preserved policy content |
| Authentication/onboarding | Polished glass-framed native dialog, distinct labelled review steps, private forms | Phone/academic states remain separate; no fake OTP, truthful demo and disabled unavailable uploads |
| Trust/moderation | Calm queue and decision surfaces, readable reasons, prominent confirmation | Authorized roles only; pending/denied/empty states and existing audit/reviewer restrictions remain |
| Landing / missing page | Editorial headline and purposeful community introduction | Existing join/sign-in/discovery and clear return route; no giant sideways canvas |

## 9. Responsive and accessibility acceptance
Inspect 1440x900, 1024x768, 390x844 and 320x700. Retain tablet rail collapse and native mobile bottom navigation/safe area. Do not squeeze central reading width. No horizontal page scroll for any major route or long scientific title/URL. Main content ends clear of bottom navigation. Dialogs and menus remain reachable within viewport.
Run axe WCAG checks for existing routes and new preview/controls in dark and light themes; maintain contrast, focus, accessible names, target sizes and keyboard/history behavior. Test reduced motion, manual pause, coarse pointer, hidden-page lifecycle, font load, long marquee titles and preview link behavior.

## 10. Implementation and refinement evidence
Initial baseline already captured in docs/screenshots/art-direction/baseline. Start with tokens/fonts/background/nav/feed, then shared and per-route surfaces/projects. Create docs/VISUAL_REFINEMENT_CHECKLIST.md. Complete at least three build–capture–inspect–fix passes AFTER initial implementation. Each pass captures all four specified sizes, inspects actual images, records defects and repairs, exercises interactions and runs relevant checks/build. Extend passes if important defects remain.
Final screenshots cover all major routes at all four sizes, both themes, project rest/hover/static focus, mobile dialog and states available in honest demo/isolated fixtures. Capture console errors and document overflow measurements. Reports must distinguish actual screenshots, fixtures, tests, inferred design judgments and unavailable live services.

## 11. Verification and delivery
Run existing lint, typecheck, unit/component, browser/axe, database, Edge, format, production build, bundle/security, production smoke and ranking scripts. Fix regressions without weakening tests or budgets. Preserve backend fingerprints and lockfile. No external deployment/purchase or destructive Git operations. Record Git availability honestly.
Write docs/VISUAL_ART_DIRECTION_REPORT.md with exact modifications, reference differences, font licenses, screenshot locations, all refinement passes/fixes, commands/results, performance limits and external gates. Checklist statuses COMPLETE/PARTIAL/BLOCKED; visual quality and functional checks assessed separately. Report no perfect/award-winning claims. Terminal summary gives actual evidence and outstanding work.
