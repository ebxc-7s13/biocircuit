# Visual refinement checklist

Authority: [BIOCIRCUIT_VISUAL_ART_DIRECTION_PROMPT.md](../BIOCIRCUIT_VISUAL_ART_DIRECTION_PROMPT.md), created from the user's complete authorized requirements and read before source edits.

| Requirement | Status | Actual evidence |
| --- | --- | --- |
| Existing product/social structure and baseline preserved | COMPLETE | Initial source snapshot, screenshots and baseline checks; fixed sidebar/native vertical feed/context bar/right rail/mobile nav retained |
| Dark editorial identity and deliberate light theme | COMPLETE | Both themes captured at four widths; dark first-visit default respects saved light choice |
| Licensed self-hosted body/display typography and mono metadata | COMPLETE | Space Grotesk variable + Barlow Condensed, OFL/provenance included; no runtime remote font requests |
| Reusable semantic color/surface/type/motion/spacing tokens | COMPLETE | styles.css; existing modules inherit the coherent system without mutation-contract changes |
| Living spectral field, fine grid/grain and pointer lighting | COMPLETE | CSS transforms; pointer coalescing/cancellation unit tests; browser motion control and idle-layout measurement |
| Pause/reduced-motion/mobile/coarse/hidden static behavior | COMPLETE | Native pause setting persists, reduced-motion and touch browser tests; visibility listener cleanup tested with explicitly simulated document visibility |
| Liquid-glass sidebar, top bar and mobile bottom nav | COMPLETE | Translucent fills, blur/saturation, highlights, active shape + aria-current; computed blur verified; opaque CSS fallback provided |
| Feed/Questions hierarchy, composer and post states | COMPLETE | Existing operations retained; final 320x700 title bottom 626.45 above nav top 631; automated journeys and axe pass |
| Electric-blue project preview with real content/original imagery fallback | COMPLETE | Measured #0000FF, 600ms reference curve, 90px/s; original illustrative optics SVG; no private-image fetch or fabricated evidence |
| Preview keyboard/touch/reduced/pause/phase/geometry/offscreen behavior | COMPLETE | Browser tests verify phase preservation, constant height, focus/direct navigation and single tap; offscreen real browser sample paused at y500.75 in a 400px viewport |
| Shared cards, buttons, forms, menus, dialogs, loading, empty/error/denied states | COMPLETE | Shared CSS + actual mobile auth/composer/provider-error/loading/populated-notification screenshots; existing dialog/focus/menu journeys and component fixtures pass |
| All major routes plus landing/not-found responsive | COMPLETE | 17 routes x four sizes x two themes = 136 final route captures; zero document overflow, page or console errors |
| At least three build/capture/inspect/fix passes after initial build | COMPLETE | pass-1 (8 captures), pass-2 (16 + hover), pass-3 (60 + contact sheets), final dark/light verification; detailed defects/repairs in report |
| Existing lint/type/unit/browser/axe/database/Edge/security/build checks | COMPLETE | 32 unit tests, 47 browser tests, 122 SQL checks, 4 Edge type checks and 3 HTTP tests; existing assertions/budgets retained |
| Production setup-required state, bundle and font transfer measured | COMPLETE | Entry JS/CSS budget passes; separate 109764-byte font assets; no fake production fallback; local smoke metrics recorded |
| Backend/domain/adapter preservation | COMPLETE | 40 original fingerprints unchanged; no schema, RLS, Edge, auth, storage or validation edits |
| Final report, screenshots, logs and reproducible capture workflow | COMPLETE | VISUAL_ART_DIRECTION_REPORT.md; capture-art-direction.mjs; artifact locations and exact results recorded |
| Physical device / manual screen-reader / long-session GPU review | PARTIAL | Chromium automation and local measured samples available; physical devices and manual assistive-technology review unavailable |
| Live OTP/reviewer/scholarly/private-storage journeys | BLOCKED | Existing external Supabase/SMS/hCaptcha/proxy/storage configuration gates; this visual task did not simulate those successes |

## Actual refinement passes

1. Initial implementation → build → pass-1 desktop/tablet/mobile/narrow captures → inspect: undersized feed heading, wrapped narrow header and overflowing project row. Fix: display hierarchy, narrow account access through existing menu, bounded grid and explicit minimum widths. Rebuilt.
2. Pass-2 four-size feed/projects/explore/settings + actual hover → inspect: short-phone title still below navigation, missing mobile static blue preview, inline counter-track and focus motion conflicts. Fix: static touch strip with optics fallback, block track/correct focus pause and compact reading rhythm. Rebuilt; existing unit tests passed.
3. Pass-3 all 15 major pages at four sizes + contact-sheet inspection → inspect: redundant font/style overhead exceeded original budget and short-phone title ended at 642.45 below the top of a nav beginning at 631 (overlap). Fix: consolidate licensed full font files, remove redundant/unused style declarations, reduce narrow composer/post metadata spacing, keep full title above nav. Rebuilt and tested.
4. Additional final review: 17 routes/four sizes/both themes, real blue hover/focus screenshots, auth/composer/error states, offscreen pause and measured idle rendering. The final title ends at 626.45; no overflow/console errors remain known. Full regression checks passed. No visual self-award or user-satisfaction score is claimed.


Supplemental final evidence: eight genuine initial-loading and actual demo-reply notification screenshots at all four requested sizes; one generated unread notification, zero narrow-view axe violations. Capture script: scripts/inspect-art-states.mjs; evidence: docs/art-populated-notifications.json. Final lint and formatting pass after adding this script.
