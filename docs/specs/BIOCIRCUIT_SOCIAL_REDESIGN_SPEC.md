# BioCircuit Social-First UI/UX Redesign Specification

**Purpose:** Replace BioCircuit's current user-interface structure with a polished, colorful, familiar social-community experience while retaining its biomedical-engineering purpose, existing content types, functionality, data model, security boundaries, and backend work.

**This is an implementation brief for Codex, Claude Code, or GPT Astra operating inside the actual current BioCircuit repository.** It is not a request for a static mockup.

---

## 0. Critical design decision: replace the horizontal canvas

The previous leftward horizontal research-canvas idea did not work in the actual preview. The user found the UI/UX unacceptable. Treat this as a full shell and information-architecture redesign, not a color adjustment.

**This document explicitly overrides the desktop-horizontal-canvas direction in the earlier `MASTER_IMPLEMENTATION_PROMPT.md`.** Keep that master prompt's product purpose, community features, backend/security requirements, and honesty rules. Replace only the layout/interaction design that calls for a horizontally navigable main canvas.

The new structure should use familiar social-media interaction patterns similar in usability to Instagram: a stable navigation sidebar, a vertically scrolling central feed, fast post creation, compact topic/profile discovery, and a useful right rail on large screens. Give it a distinct BioCircuit identity through biomedical editorial design, color, typography, content cards, and restrained motion. Do **not** copy Instagram's logo, exact styling, assets, or branding.

### Non-negotiable rules

- No primary page navigation by horizontal scrolling.
- No scroll hijacking, full-page scroll snapping, or sideways canvas transitions.
- The main feed and all long-form pages scroll vertically using normal browser behavior.
- Small horizontal carousels are permitted for featured research circles/topics/project previews, but they must not contain essential content that is otherwise unreachable.
- Preserve existing page content, routes, functionality, Supabase integrations, migrations, RLS, Edge Functions, validation, and trust boundaries unless a specific change is required and tested.
- Never solve a visual problem by replacing connected behavior with demo data, removing permissions, weakening RLS, or faking successful actions.
- Build the application in the existing repository. Do not create a parallel app or stop after presenting a plan.

## 1. Product outcome

BioCircuit is a professional biomedical-engineering community for people who studied biomedical engineering at undergraduate, postgraduate, or doctoral level. It combines the ease of a social feed with technical questions, project collaboration, scholarly discovery, and responsible professional identity.

The interface must make three actions immediately obvious:

1. Find an interesting biomedical-engineering discussion or research update.
2. Ask a useful question, share project progress, or discuss a paper.
3. Find a person, answer, project, or source that helps move real research forward.

It should feel lively and welcoming—not like a hospital portal, corporate dashboard, gaming interface, generic admin template, or an AI-generated collage of cards.

### Product principles

- **Useful contributions over vanity metrics.** Prioritize helpful answers, project updates, and thoughtful discussion over follower counts.
- **Scientific provenance.** Clearly distinguish bibliographic metadata and source links from the author's interpretation.
- **Honest trust signals.** Phone verified, academic review pending, and academically approved are different states. Never invent badges.
- **Privacy by default.** Marks/CGPA remain private if collected. Never surface private academic applications or evidence in public profiles or feed cards.
- **Low cognitive load.** A user should understand the page and its main action in a few seconds.
- **Readable science.** Support titles, methods, limitations, DOI/PMID links, code/protocol links, project stages, and questions without making cards excessively dense.

## 2. Required app shell and page layout

### 2.1 Desktop layout (target 1280–1600 px)

Use a conventional, vertically scrolling social-app shell, approximately:

- **Left sidebar:** 220–248 px, fixed or sticky, full viewport height, separated by a fine border. Place the BioCircuit mark and wordmark at the top, primary navigation in the middle, and the profile/account area plus a small theme control at the bottom.
- **Top application bar:** approximately 64–72 px tall across the content region. It contains a contextual page title or breadcrumb, a broad search field/command trigger, create action, notification shortcut, and account menu. It must not become a giant banner or contain redundant primary navigation.
- **Center column:** approximately 600–700 px wide for the main feed or page content. Make content width comfortable for scientific text.
- **Right rail:** approximately 280–330 px, visible on sufficiently wide screens. It can contain relevant collaborators, followed topics, selected papers, community prompts, or account-specific guidance. It must show real returned content or honest empty states—not fabricated statistics.
- **Page background:** a quiet but colorful-tinted field, with high-contrast white/light or dark surfaces for content. Use generous whitespace and strong alignment.

Recommended overall grid: `minmax(220px, 248px) minmax(0, 680px) minmax(260px, 320px)` with responsive gaps, and a maximum overall width that does not leave huge empty areas on common desktop screens. Keep the central feed visually dominant.

The left sidebar should have clear labels, not a row of unexplained icons. Use a visible active state with both a color cue and shape/weight cue. Keep global navigation stable as the central page scrolls. The right rail may scroll normally with the page or use a carefully tested sticky region; it must not obscure content or create a separate trapped scroll area.

### 2.2 Tablet layout (approximately 768–1100 px)

- Collapse the right rail first.
- Reduce the sidebar width or switch to a compact icon-and-label-on-hover rail only when the remaining center column stays readable.
- Keep the top search accessible.
- Never squeeze the feed into a narrow strip between two full side panels.
- Allow menus to open as popovers/drawers with complete keyboard handling.

### 2.3 Mobile layout (320–767 px)

- One vertical content column with natural page scrolling.
- A compact top bar with the BioCircuit mark, current page or search entry, notifications, and profile/menu access.
- A **bottom navigation bar** with five practical destinations: Feed, Explore, Create, Projects, and Profile (or another five destinations justified by existing route priorities). Use a clear selected indicator and accessible names. Ensure the bar respects safe-area insets and never covers the final feed action.
- The Create action can use a prominent central button or a clearly distinguished action in the bottom bar; do not use an inaccessible floating control that covers content.
- Use compact filter chips and clearly labelled horizontal carousels only for small groups (e.g., followed topics). All main reading, forms, project details, trust review, and settings remain vertical.
- Target a minimum 44×44 CSS pixel touch target for primary actions where practical.
- No horizontal overflow at 320 px, including long DOIs, URLs, code/protocol links, scientific titles, tags, menus, and dialogs. Wrap or truncate safely with an accessible way to read the full value.

### 2.4 Navigation and routing

Retain real routes and browser history. Build a coherent, labelled navigation model. Adapt the exact labels/route names to the existing application, while retaining the underlying destinations and access checks.

Recommended primary navigation:

1. **Home / Feed** — general community feed.
2. **Explore** — search and discovery across topics, members, projects, and papers.
3. **Questions** — unanswered/recent/solved technical questions.
4. **Projects** — project discovery and user's workspaces.
5. **Journal Club** — scholarly metadata and structured discussions.
6. **Collaborators** — people filtered by expertise, methods, equipment, and availability.
7. **Saved** — saved posts and papers.
8. **Notifications** — read/unread activity.

Profile, Settings, Trust/Review, moderation, and administration can live under the account menu or their existing protected routes. Do not display administrator-only routes to ordinary members, and do not rely on hidden navigation as the security boundary.

Navigation must preserve direct deep links, browser back/forward, loading states, denied states, and not-found states. Selecting a menu item should switch routes normally; do not move the entire app sideways.

## 3. Visual identity: vibrant, scientific, humane

### 3.1 Desired overall look

Create a polished social product with:

- A colorful but disciplined palette.
- A crisp, mostly light default theme with an excellent dark theme.
- High-quality typographic hierarchy.
- Warm, human profile and author presentation.
- Distinct content types that are easy to recognize.
- Subtle biological/spectral graphic motifs, used as accents rather than full-screen noise.
- A mixture of open text layouts and a few well-defined surfaces; not every element should be trapped inside a rounded card.

Aim for the editorial quality of a well-designed research publication combined with the quick reading rhythm of a social feed. The feed should have enough warmth and color to feel social while staying legible under dense technical content.

### 3.2 Color tokens

Implement semantic CSS variables/tokens. These values are a starting direction; test contrast and adjust if necessary.

**Light theme**

- `--page-bg: #F6F5FB` — cool, almost-white lavender canvas.
- `--surface: #FFFFFF` — primary reading surfaces.
- `--surface-soft: #F0EEFA` — quiet tinted panels.
- `--text-primary: #211D35` — dark plum-ink text.
- `--text-secondary: #716C83` — secondary copy with adequate contrast.
- `--border: #E4E0EF` — quiet separators.
- `--brand: #6554E8` — primary BioCircuit violet.
- `--brand-hover: #5342D6` — hover/pressed violet.
- `--coral: #FF6E79` — human/social accent.
- `--aqua: #20BFB1` — discovery/technical accent.
- `--sky: #54A9F6` — informational/source accent.
- `--amber: #F5B84B` — caution/editorial highlight.
- `--lime: #D7F477` — rare decorative accent only, not small text.
- `--success: #1C8A61`, `--warning: #A85C08`, `--danger: #C23D52` — readable state colors.

**Dark theme**

- `--page-bg: #12121C`.
- `--surface: #1C1B2A`.
- `--surface-raised: #242236`.
- `--surface-soft: #29263E`.
- `--text-primary: #F6F3FF`.
- `--text-secondary: #B9B3CE`.
- `--border: #39354F`.
- Keep accent colors readable in dark surfaces; do not merely invert the light palette.

Build tokens for spacing, radii, shadows, typography, focus rings, z-index layers, transitions, content width, and disabled states. Avoid raw color literals scattered through components. Color must never be the only indicator of academic status, accepted answers, errors, warnings, or notifications.

### 3.3 Gradients

Use 1–2 purposeful gradients as brand devices—e.g., the BioCircuit mark, a narrow active navigation indicator, a research-highlight cover, or the primary create action. Do not add rainbow gradients to every card, every button, the background and all headings simultaneously. The majority of reading surfaces should be solid, calm colors.

Use gradients with sufficient text contrast and no text directly over animated/high-frequency imagery unless an opaque backing surface provides legibility.

### 3.4 Typography

Use a clear, modern sans-serif for almost all UI. Prefer an already installed/local font when available; otherwise use a dependable system stack or one carefully chosen web font with a strong fallback. A restrained editorial serif may be used for selected paper headlines, but not for buttons, navigation or dense technical metadata. Use monospace sparingly for DOI, identifiers, measurements, and code labels.

Define named sizes and weights instead of arbitrary values in each component. Target body text around 14–16 px on desktop and comfortably readable on mobile; metadata may be smaller only if it remains legible. Provide generous line-height for abstracts and long posts. Avoid all-uppercase labels everywhere and avoid wide letter spacing on small UI text.

### 3.5 Shape, borders, and shadows

- Use 12–18 px radii selectively for major surfaces and 8–12 px for smaller controls.
- Use subtle borders and spacing before using large shadows.
- Reserve stronger elevation for popovers, dialogs, and a few primary cards.
- Keep icons stylistically consistent using the existing icon library (the project already uses Lucide).
- Make selected states and focus states obvious without glowing every element.
- No generic glassmorphism everywhere, no random decorative blobs, no meaningless charts, no stock healthcare-photo collage, no emoji-only navigation, and no oversized floating 3D objects.

## 4. Feed experience (highest priority)

The home feed is the central experience. Redesign it first and make it convincing before styling edge-case settings pages.

### 4.1 Feed header

At the top of the center column:

- A concise welcome/context line; do not waste vertical space on a giant marketing hero for logged-in users.
- A small **Research Circles**/topic strip can use circular avatars or simple colored subject marks, similar in speed to social story navigation but specific to the platform. These should represent real topics, real members, or actual journal-club activities—not imaginary temporary stories. If there is no meaningful data, show a compact, useful empty state rather than fake profiles.
- Feed mode controls such as `For you`, `Following`, `Recent`, and (where appropriate) `Unanswered`.
- Topic/type filters that are easy to scan and horizontally scroll only within the chip strip on small screens.
- A clear, compact composer entry.

Do not create a large empty hero that pushes the first useful post below the fold.

### 4.2 Composer entry and post creation

The composer should feel as easy as posting on a familiar social platform while supporting technical content. Show a small current-user avatar or initial, the prompt `Share a research update, ask a question, or discuss a paper…`, and visible actions for the supported types.

Offer structured post types, based on existing capabilities:

- Research update / discussion.
- Technical question.
- Project log/update.
- Paper or journal-club discussion.

The full composer should include the fields already supported by the existing system: title where required, body, topic tags, relevant links/DOI/project reference, methods/limitations or what has been tried where supported, and clear visibility settings where applicable. Use progressive disclosure for secondary fields. Keep draft autosave behavior and validation. Do not present unavailable file/document upload as if it works. Preserve patient-data/IP warnings and all existing text-safety rules.

### 4.3 Feed post card

Design a strong and reusable post component. Visual order:

1. Author avatar and name, honest academic trust badge if applicable, specialty/affiliation if the member permits it, and timestamp.
2. A small, consistent content-type label (Question, Project update, Paper discussion, Research note).
3. Clear title or opening text, with sensible line lengths and spacing.
4. Body content with preserved line breaks and safe plain-text rendering. Do not execute HTML supplied by a user.
5. Optional preview block for a paper, project, DOI/PMID/canonical source link, or supported private project image. Keep images within bounds and use appropriate alt text.
6. Topic chips kept to a restrained number; overflow should wrap or collapse behind an accessible control.
7. Action row: Like/React (if implemented), Reply/Discuss, Save, Share, and an overflow menu for report/mute/block/edit/delete according to permissions.
8. Real counts only, or no count when unavailable. Clear loading/pending/success/error feedback.

Create visual variation based on *content type*, not arbitrary decorative color. Examples: a paper card gets a compact bibliographic panel; a question card displays open/answered status and an accepted-answer summary; a project update shows a milestone/stage; a discussion remains text-first. Do not give every post an identical bright gradient header.

Keep action labels accessible, keyboard operable and easy to tap. Prevent double-clicks and duplicate server operations where the backend offers idempotency. Reflect server-authoritative counts after successful mutations.

### 4.4 Feed rhythm and discovery

Use varied but consistent patterns:

- Mostly text-first posts for readability.
- Compact source/paper previews for scholarly content.
- Project updates with a small milestone accent.
- Question cards with visible answer status.
- Occasional featured topic or journal-club module when backed by actual information.

Do not make the feed a wall of large cards. Use whitespace and thin dividers to establish rhythm; reserve full card borders/backgrounds for content that genuinely needs grouping.

### 4.5 Feed right rail on desktop

Build a small number of useful modules, selected according to actual data availability:

- Suggested collaborators matched to interests/methods (with follow/view actions where implemented).
- Followed/trending biomedical topics, where based on real data or clearly marked as editorial seeds.
- A paper of interest or a journal-club invitation, with a genuine source link.
- A concise community-guidelines/trust reminder only where contextually useful.

Avoid a fabricated “X members online”, invented engagement scores, or hard-coded platform growth statistics. Don't duplicate the whole left navigation. Each module should have a clear action and a compact empty/loading/error state.

## 5. Page-by-page redesign

Use the existing route structure and feature components wherever possible. Adapt names to the repository and preserve access control. The following is the required UX behavior for each destination.

### 5.1 Home / Feed

Deliver the feed above: compact topic/research-circle strip, composer entry, feed modes, topic filters, vertical posts, and contextual right rail on large screens. The initial viewport must show useful content without an oversized hero. Persist feed mode only as the application currently supports it; do not leak private state.

### 5.2 Explore / Search

- A prominent search box with clear focus behavior and a visible clear action.
- Search tabs/categories for posts, questions, projects, members, and papers based on actual APIs.
- Useful filter groups such as topics, methods, modality, project stage, unanswered, publication year, and result type where the data exists.
- Recent searches only if privacy-safe and implemented; otherwise omit.
- Discovery tiles may use differentiated color accents, but not giant arbitrary gradients.
- Include loading skeletons, no-result suggestions, retry states, and real-source attribution for papers.
- Never show private profiles, pending applicants, muted/blocked content, or restricted projects through search.

### 5.3 Questions

- Separate `Unanswered`, `Recent`, and `Solved` views when supported.
- Question card contains the problem statement, relevant modalities/methods, what the author tried, tags, and answer/resolution status.
- A question detail view has a readable problem description, bounded flat response thread as supported by existing features, helpful-response controls, and a strong accepted-answer treatment.
- Make `Ask a question` prominent and easy to find.
- Preserve permissions for edit/delete/accept/resolve; don't invent an answer count if unavailable.

### 5.4 Projects

- A discovery grid/list with clear project title, domain, stage, needs, methods/equipment, visibility and collaboration status.
- A project detail page should be a vertically scrolling project workspace, not a horizontal slideshow.
- Group overview, objective, methods/equipment, governance, license/repository, team and collaboration requests with hierarchy.
- Display dated progress logs and milestone/blocker/experiment/lesson/reference types as a chronological vertical timeline.
- Show project images only using the existing scoped, private storage and signed-link rules. Never expose a private asset using a public URL to make the design easier.
- Keep ownership transfer, member removal, archive/delete confirmation and collaborator acceptance workflows. Do not hide sensitive actions behind confusing icons.

### 5.5 Journal Club / Papers

- Paper cards need title, authors, venue/date when available, canonical DOI/PMID/source link, and clear metadata provenance.
- A paper discussion should visually distinguish source metadata from member commentary, critique, methodological notes and questions.
- Provide search/source selection, pagination and honest provider failure states.
- Never fabricate paper records, abstracts, full-text availability or peer-reviewed conclusions.
- Make Save paper and Start discussion easy to locate.
- Do not present an externally fetched full text as available unless the source confirms it.

### 5.6 Collaborators / Members

- Search/filter by approved public interests, methods, equipment, expertise and availability.
- Member cards should prioritize expertise and active interests instead of follower counts or CGPA.
- Show academic approval only when the backend confirms the precise status and the product permits that status to be public.
- Respect member visibility, block/mute, pending membership and private profile rules.
- Make profile, follow and collaboration actions accessible and functional.

### 5.7 Member profile

Structure as an editorial professional profile:

- Avatar, name, allowed affiliation/education pathway, speciality, research interests, methods/equipment, availability and appropriate verified status.
- A clear follow/collaborate/share action group based on authorization.
- Tabs/sections for contributions, projects, questions, and selected public papers where supported.
- Avoid a vanity-first cover banner or oversized follower counters.
- Keep grades, private application details, phone number, evidence documents, private project information, and moderation/audit data out of public profiles.

### 5.8 Saved / Bookmarks

- Separate saved posts and saved papers if that matches existing data.
- Allow removal and navigation back to the original item.
- Include concise filters and a useful empty state with a way to return to Explore.

### 5.9 Notifications

- Clear read/unread distinction and category labels.
- Group related events by recency only if the grouping is real and stable.
- Mark read/unread through actual operations, follow notification settings, and never show another user's private activity.
- No fabricated notification counts.

### 5.10 Trust, academic review, moderation, and administration

These are operational screens, not public social feed cards. Use a calm, data-dense review layout with a prominent status filter and detail panel.

- Clearly separate academic eligibility review from content moderation, source correction review, appeals and administrative settings.
- Show the least amount of private applicant information needed by the authorized reviewer.
- Require appropriate confirmation for irreversible or high-impact actions.
- Preserve reason fields, audit trails, appeal paths and distinct roles.
- Do not use public social gradients or playful celebration animations on suspensions, rejection, private evidence or abuse reports.
- Every privileged function must remain protected by server-side authorization/RLS/Edge Function checks.

### 5.11 Onboarding and authentication

- Calm, trustworthy, mobile-first onboarding.
- Small number of clear steps with a visible progress indicator and explanations of why each datum is requested.
- Explain that phone confirmation and academic eligibility review are separate.
- Distinguish degree/result pathways (including result-awaiting) and institution.
- Marks/CGPA must be optional/private if the implementation collects them; never rank by marks.
- Support safe resume behavior without storing OTP codes, phone secrets, marks, or consent tokens in local drafts.
- Present real OTP and provider errors honestly. Never hard-code a production code or show “verified” from a local state change alone.

### 5.12 Settings / Account / Policies

- Group related controls: profile & visibility, notifications, appearance & motion, blocked/muted lists, draft management, export and deletion.
- Make privacy-affecting controls explain what changes.
- Keep export/delete confirmation clear and ensure the server authorizes the current user.
- Respect system reduced-motion preferences even if the user selects another theme.
- Deletion workflow must retain the existing project-transfer constraints and report genuine backend failures.

### 5.13 Empty, loading, error, disconnected, and denied states

Design these states intentionally in the same visual system. For each route, define:

- Loading skeleton that resembles the final layout rather than a generic spinner page.
- Empty state with a concise explanation and a relevant next action.
- Offline/connection/setup state that distinguishes missing configuration from an actual server outage.
- Permission-denied state that does not leak whether private resources exist.
- Retry or recovery path for recoverable errors.

Never silently fall back from a missing/failed connected backend to synthetic data while implying the result is real. When demo mode is explicitly enabled, label it as a demo.

## 6. Live background and motion

A colorful interface does not require a constantly moving background. Keep the central reading canvas calm and make the brand feel alive with controlled details.

- Use a subtle spectral wash, faint wavelength bands, tiny signal-node motifs, or microscopy-inspired linework behind the **outer shell and landing/empty states**, not directly behind long text.
- Prefer CSS gradients, lightweight SVG, or a very small canvas over WebGL/3D. Do not add Three.js for a decorative effect.
- Background motion should be slow and low-contrast, with no flashing, strobing, fast particle swarms, or major layout movement.
- Respond to mouse position only as a non-essential enhancement on desktop; touch and keyboard users must have the same information and functionality.
- Provide pause/disable controls where background animation continues, and always respect `prefers-reduced-motion`.
- Use existing Motion dependency only if it is already installed and its current API is compatible; check the installed version/documentation. Prefer CSS transitions for simple interactions.
- Typical interaction timing: approximately 140–220 ms for hover/press/focus transitions and 180–280 ms for small panel/dialog entry. These are guidelines, not mandatory animation for every control.
- Animate opacity/transform, avoid animating layout-heavy properties, and avoid per-frame React state updates.
- No delayed entrance animation that makes the page feel slow; content must be readable immediately.
- No scroll hijacking, smooth-scroll trapping, infinite auto-advance, or animation that blocks actions.

## 7. Core component system

Build only reusable components that support the current application, with sensible sizes and variants. Prefer extending the existing components over inventing a new framework.

Recommended building blocks:

- `AppShell` — stable responsive app frame.
- `SidebarNavigation` — desktop primary navigation with selected/accessibility states.
- `TopBar` — contextual title, search, create action and utilities.
- `MobileBottomNavigation` — mobile primary destinations and safe-area handling.
- `PageContainer` / `FeedColumn` / `RightRail` — consistent responsive layout.
- `ResearchTopicStrip` — small horizontal topic/circle row, never a primary navigation canvas.
- `ComposerEntry` / `PostComposer` — supported post-type creation and validation.
- `FeedModeTabs` / `FilterChips` — clear active state and keyboard access.
- `PostCard` with variants such as `DiscussionPost`, `QuestionPost`, `PaperPost`, or smaller slot components if it reduces duplication.
- `PaperMetadataCard`, `ProjectSummaryCard`, `QuestionStatus`, `AcceptedAnswer`, `ProfileAvatar`, `TrustStatusBadge`, `NotificationItem`.
- `Skeleton`, `EmptyState`, `ErrorState`, `ConnectionState`, `ConfirmDialog`, and `Tooltip` where useful.

Avoid a large generic design-system rewrite if a few tokens and shared primitives are sufficient. Don't duplicate backend mutation logic across cards. Keep business logic in existing domain/data modules and let the UI call the current typed interfaces. All controls must have loading, disabled, success and failure states as appropriate.

## 8. Preserve the existing application and backend

The actual current workspace is the source of truth. Do not use an old downloaded prototype/ZIP over the current repository.

Before editing, inspect and understand the live repository, including its current `Workbench.tsx`, styles, feature modules, routes, data adapter, migrations, Edge Functions, tests, and setup docs. The current build report describes 19 migrations, four Edge Functions, separate demo/connected data modes, and an extensive test suite; verify those files actually exist before assuming the report is complete.

Preserve:

- Existing route destinations, supported post types, project and question flows.
- Search and scholarly source integration.
- Feed filters, ranking/explanations, bookmarks, follows, blocks/mutes, notifications, contribution points, reports, appeals, trust review and account controls.
- Real source provenance and error states.
- Supabase SDK wiring, migrations, role boundaries, server RPCs, RLS and private Storage access.
- OTP/academic verification separation.
- Existing validation, CSP/security configuration, test suites, accessible dialogs, keyboard support, reduced-motion behavior and privacy policies.
- All external integration limitations and disabled document/email features as explicitly reported.

Do not change schemas, weaken permissions, seed real users, create new public buckets, expose service-role keys, or modify authentication solely to style the frontend. If the new layout exposes a real route or action gap, fix the underlying issue without violating the existing security model and add a test.

## 9. Implementation workflow

Do not stop after recommendations or screenshots. Implement the redesign in the existing project.

### Phase 0 — Inspect and establish visual baseline

1. Confirm the working directory and repository status. Preserve user changes.
2. Read this specification and the existing master prompt; note that this document supersedes only the horizontal-canvas UI direction.
3. Read the current source and implementation/build reports. Verify the actual current files rather than trusting an older ZIP.
4. Run the app in the available demo mode and capture screenshots before changes at approximately 1440×900, 1024×768, 390×844, and 320×720.
5. Inspect actual feed, projects, journal club, questions, profile, settings and trust pages. Record concrete spacing, overflow, hierarchy, interaction, and density problems in `docs/REDESIGN_AUDIT.md`.
6. Run current lint/typecheck/tests/build when the environment permits. Record existing failures.

### Phase 1 — Design tokens and shell

1. Replace the horizontal canvas shell with the new vertical social layout.
2. Implement light/dark semantic tokens and global typography, spacing, border, focus, radii, shadow, and z-index rules.
3. Implement desktop sidebar, contextual top bar, center feed column, right rail, and mobile bottom navigation.
4. Remove primary horizontal scroll controls, horizontal panel animation, wheel-axis hijacking and full-page snap behavior.
5. Verify routing, direct URLs, browser back/forward, keyboard navigation and responsive behavior immediately.

### Phase 2 — Feed first

1. Redesign the feed header, small topic/research-circle strip, composer entry, mode/filter controls, post cards, paper previews, question/answer states, and right rail.
2. Connect cards to existing domain/data APIs and preserve all server-authoritative mutations.
3. Ensure real loading/empty/error/denied states.
4. Test create, edit/delete where allowed, like, reply, save, share, report, accepted answer and navigation where supported.
5. Capture a screenshot and inspect it before moving on. Fix bad hierarchy/overflow immediately.

### Phase 3 — All remaining page families

Implement Explore/Search, Questions, Projects, Journal Club, Collaborators, Profile, Saved, Notifications, Trust/Moderation, Onboarding/Auth, Settings/Policies, and all empty/error states following Section 5. Reuse the new shell and tokens; preserve the underlying business logic.

### Phase 4 — Motion, responsive behavior and accessibility

1. Add limited motion only after the static visual hierarchy works.
2. Validate pointer, keyboard, touch, reduced motion, focus and scroll behavior.
3. Test widths 320, 375/390, 768, 1024, 1280 and 1440 px.
4. Check all dialogs, menus, bottom navigation, large titles, URLs/DOIs, filter chips, cards and forms for overflow and focus traps.
5. Run automated axe/accessibility tests and perform manual keyboard checks. State clearly what cannot be verified without a physical device or screen reader.

### Phase 5 — Automated regression and visual QA

Run the available lint, TypeScript, unit/component, PostgreSQL, Edge Function, Playwright/browser, formatting, bundle/configuration and production build checks. Do not remove tests or weaken assertions just to get a pass. Add or update UI tests where the shell changes.

Verify before finishing:

- No major route relies on horizontal canvas navigation.
- All supported destinations and interactions remain available.
- All API mutations use the current adapters/authorized backend operations.
- No new fake data, fake verification, fake counts, public private files or leaked secrets.
- Layout is attractive and legible in light and dark themes.
- No horizontal overflow at 320 px; horizontal scroll exists only in intentionally small and labelled carousels.
- Desktop feed has a clear center hierarchy and the sidebar/right rail do not crowd it.
- Mobile feed has one primary column and useful thumb-friendly bottom navigation.
- Reduced motion is respected and content never waits for an entrance animation.

Capture final screenshots at the same dimensions as the baseline and save them in `docs/screenshots/redesign/` if screenshot tooling is available. Review the screenshots; do not merely save them. Adjust the interface if it still looks like a boilerplate dashboard, an empty landing page, or a wall of identical rounded cards.

### Phase 6 — Final report

Update `README.md` only where necessary. Create `docs/REDESIGN_REPORT.md` with:

- Summary of the old horizontal concept removal and the new social layout.
- Screens/routes redesigned.
- Design tokens and major component changes.
- Existing functionality and backend/security behavior preserved.
- Files created/modified.
- Commands and checks actually run, with actual pass/fail results.
- Screenshot paths and tested viewport sizes.
- Known UI limitations and any external service blockers.
- Any requirement not implemented, with a concrete reason and next action.

Do not call the redesign complete if major screens are untouched, controls do not work, visual QA was skipped, or tests are failing because of the changes. Do not claim a live backend was tested if only demo mode was used.

## 10. Visual quality acceptance rubric

Score the finished UI from 1–10 in the report against these criteria and justify each score with evidence:

1. **First impression:** looks like a credible, contemporary social product for biomedical engineers within 3 seconds.
2. **Hierarchy:** users can distinguish navigation, feed content, metadata, and actions at a glance.
3. **Color:** expressive and memorable, but legible and not chaotic.
4. **Content design:** questions, project updates, discussions, and papers have distinct useful layouts.
5. **Consistency:** controls, spacing, typography, and states are cohesive across pages.
6. **Responsiveness:** no broken layouts at the specified viewport widths.
7. **Usability:** main actions are obvious and controls are not decorative dead ends.
8. **Accessibility:** keyboard, focus, contrast, semantic names, and reduced-motion behavior are covered.
9. **Performance:** animations and background work remain lightweight and scrolling stays native.
10. **Trust:** statuses, metadata, private data, and backend failures are represented honestly.

Aesthetic judgment must be based on screenshots and interaction checks, not on the presence of gradients, animation, or a large number of components. If any of the first six items is below 8/10, revise the relevant design before declaring the UI pass complete, unless a concrete technical blocker is documented.

## 11. Final instruction to the coding agent

**Execute this redesign now in the existing project.** Start with the visual audit and current screenshots. Then replace the horizontal canvas with the vertically scrolling, social-first structure specified here. Preserve the features, pages, database, authorization model and test coverage that already exist. Work through the phases in order without waiting for routine approval. Run the app and inspect the visual result. Fix regressions. Finish with `docs/REDESIGN_REPORT.md` and an honest test report. Never substitute a plan for implementation.
