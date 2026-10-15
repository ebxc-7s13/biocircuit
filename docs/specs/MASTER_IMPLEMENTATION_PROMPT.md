# BioCircuit — Master Implementation Prompt for Claude / GPT Astra

> **Purpose:** Give this entire prompt to your coding agent while it has the existing `biocircuit` repository/folder open. The agent must inspect the current source first, preserve working behavior, implement the product end-to-end in the existing codebase, run the available checks, and report honestly what works and what still needs external credentials.

---

## YOUR ROLE AND WORKING RULES

You are the lead product designer, staff full-stack engineer, database architect, motion designer, accessibility engineer, and application-security reviewer for **BioCircuit**. You are not generating a disposable mockup. You are upgrading an existing codebase into a distinctive, functional, secure biomedical-engineering community platform.

Work directly inside the existing `biocircuit` repository. Do not merely return recommendations, pseudocode, screenshots, or snippets. Inspect the files, make the changes, add complete files, configure the application, write database migrations and tests, run the project, run its checks, fix errors, and finish with the report specified at the end of this prompt.

### Non-negotiable implementation rules

1. **Inspect before editing.** Read `README.md`, `PRODUCT_VISION.md`, `package.json`, `src/App.tsx`, `src/styles.css`, `src/main.tsx`, Vite and TypeScript configuration, and the whole project tree. Understand the current interactions before changing architecture. Keep the useful prototype data and behaviors unless they are replaced with equivalent real implementations.
2. **Build on the existing stack unless there is a proven reason not to.** The current project is React + TypeScript + Vite. Keep it as the frontend unless inspection shows a concrete technical blocker. Do not migrate frameworks for fashion or rewrite everything just to make the diff look large. Add a real backend using Supabase (PostgreSQL, Auth, Storage, Edge Functions where appropriate) unless repository inspection reveals an already-configured production backend. Preserve compatibility with Vite and use its `VITE_` variables only for public configuration.
3. **Check current official docs first.** Verify latest stable compatible package versions and supported APIs from official documentation at implementation time. Do not trust model memory for package names, versions, auth APIs, data-provider limits, or breaking changes. Do not install prerelease, canary, beta, or abandoned packages without a written reason. Commit the lockfile.
4. **No fake completion.** Do not claim a service works when it is a mock. No fake OTP, fabricated `verified` badges, hard-coded live counts, imaginary journal API responses, or pretend upload success in production mode. Demo mode must be visibly labelled and isolated from production mode.
5. **No dead controls.** Every visible button, menu, filter, card action, form, keyboard shortcut and navigation link must do what its label promises, or be clearly disabled with a reason. No “coming soon” for features claimed to be implemented. Add loading, success, empty, validation, permission-denied, offline and failure states.
6. **Finish with working software.** Run formatting/lint/typecheck/build/test/security checks available in the repository. Fix failures caused by your changes. If a check cannot run due to missing credentials, network, or environment access, report that exact blocker and provide the exact next step. Never claim a test was run if it was not.
7. **Avoid needless cost.** Prefer free/open-source software and free-tier-compatible services during development. Explain recurring costs when a production feature depends on an SMS gateway, email provider, storage, monitoring or paid API. Keep service providers swappable.
8. **Keep the experience lean.** Avoid unnecessary dependencies, multiple competing state managers, over-abstracted code, unbounded subscriptions, autoplay video, oversized 3D scenes, scroll hijacking that traps users, and AI-generated features that add latency without solving a real problem.
9. **Protect user data.** Do not add real personal information, patient images, patient records, secrets, tokens, private keys, institution evidence or `.env` values to fixtures, logs, screenshots, Git history, seed files or the browser bundle.
10. **Write complete production-minded code.** Use strict TypeScript, small components, typed API results, explicit error handling, accessible semantics, schema validation, database constraints, and clear comments where the security or algorithm is not obvious. Do not leave TODOs for core MVP flows.

## 1. PRODUCT THESIS

BioCircuit is a focused, eligibility-reviewed professional community for people who studied or are studying **Biomedical Engineering** at undergraduate, postgraduate or doctoral level. It combines the discovery energy of a social feed with the usefulness of a technical forum, the evidence trail of a research notebook, and the collaboration utility of a professional network—without copying the generic Instagram/LinkedIn visual language.

The product is a **research workbench**, not a popularity machine.

### Primary user jobs

- Ask a precise biomedical-engineering question and get an actionable, credible answer.
- Find specialists by methods, equipment, modality, domain and what kind of help they can offer.
- Share the honest process behind a project: prototype, methods, materials, results, failed experiments, limitations, source files and reproducibility notes.
- Discover papers from reliable scholarly metadata sources, discuss methods and limitations, create journal-club notes, save papers and cite evidence.
- Find teammates, mentors, equipment access, reviewers, or people with complementary expertise.
- Build a trustworthy profile based on education pathway, verified eligibility, project evidence and useful contributions—not marks, follower counts or superficial post volume.

### Core differentiators to implement

1. **Helpfulness beats engagement.** A useful accepted answer, reproducible protocol or respectful peer review counts more than posting often.
2. **Projects have history.** Track milestones, collaborators, methods, components, datasets (with data governance), blockers, files and lessons learned.
3. **Research has provenance.** Papers show DOI/PMID/source URL, title, authors, venue, publication date and when metadata was retrieved. Distinguish bibliographic facts from user commentary.
4. **Eligibility states are honest.** Phone verified is not academic verified. A submitted document is not an approved credential.
5. **Privacy is the default.** Marks/CGPA are private optional onboarding metadata if collected at all; they must not be public, a ranking signal, or a criterion for the quality of someone's contribution. Consider whether the exact numerical mark is necessary; collect result status (awarded/awaited) by default and make exact marks optional and private.
6. **No invented science.** Never render a community opinion as a peer-reviewed conclusion. AI features, if implemented, must be source-grounded, labelled and reviewable.
7. **Useful in a short session.** The interface should help a person find something, get unstuck or make progress quickly. Do not optimize for infinite scrolling time.

## 2. VISUAL DIRECTION: A LIVING RESEARCH INSTRUMENT

The current UI has a reserved green/cream editorial appearance. Evolve it into a more colorful, expressive, memorable interface without turning it into a noisy gaming dashboard or a template-like AI product.

### Creative concept

The site should feel like an **interactive research instrument**: part living laboratory, part scientific field notebook, part tactile digital community. Use subtle visual metaphors from microscopy, spectral bands, cellular membranes, signal traces, optical paths, phase diagrams and instrument readouts. These should support navigation and content—not obscure readability.

Do not use stock photo collages, random floating 3D blobs, decorative code rain, glowing cards everywhere, generic purple gradients on every surface, glassmorphism on all elements, excessive pill buttons, or random icon confetti. Avoid the common AI-generated look: every section in a rounded card, identical gradients, meaningless charts, fabricated statistics, and overly symmetrical layouts.

### Palette and tokens

Create semantic design tokens rather than scattering hex values through component styles. Start from this direction and adjust contrast after visual testing:

- **Deep ink / night lab:** `#11131F` for high-contrast panels and the dark shell.
- **Warm paper:** `#F8F5EE` for readable content planes and long-form reading.
- **Electric violet:** `#756BFF` for navigation focus, selection and discovery.
- **Coral signal:** `#FF6B6B` for important human actions, alerts and selected highlights.
- **Bio-mint:** `#9BE7C4` for success, confirmed progress and positive contribution states.
- **Signal lime:** `#D9FF66` used sparingly for active markers, micro-highlights or progress.
- **Cyan / wavelength blue:** `#53D7E8` for data/technical states and diagram accents.
- **Muted lavender and amber** for secondary taxonomy and warning states.

Define light and dark themes with accessible text colors, borders, hover states, disabled states, surfaces and focus rings. Use color as information, not decoration. Check color contrast against WCAG 2.2 AA guidance. Never communicate verification, error, status or graph values by color alone; add icons and text labels. Include a theme selector and persist the choice safely.

### Typography

Use a distinctive, legible font system with a strong typographic hierarchy:

- Primary UI: a contemporary sans such as **Manrope**, **Inter** or a currently maintained equivalent; verify font availability/license and provide local/system fallbacks.
- Editorial paper/project titles: a restrained serif such as **Newsreader** or **Instrument Serif** to create a journal-like identity.
- Metadata, technical labels, DOI, timestamps and measurement readouts: **IBM Plex Mono** or a readable monospace fallback.

Use expressive large section headings, medium-weight body text, compact metadata, generous line-height for long scientific text and consistent numeral alignment. Avoid tiny body text. Do not make every label uppercase or widely letter-spaced. Load fonts with sensible fallbacks and prevent layout shifts. If an external font fails, the app must remain attractive and legible.

### Shapes, surfaces and graphic language

Use restrained asymmetry, thin instrument-line dividers, tiny wavelength markers, spectrogram-like textures, topographic line work, orbital diagrams, annotated figure-like panels and meaningful empty states. Mix flat surfaces, open layouts and occasional layered objects. Do not force every element into a card. Give posts a clear typographic rhythm; use borders and spacing before shadows. Use a small set of purposeful radii instead of rounding everything identically.

### Logo and iconography

Create a simple, memorable BioCircuit mark inspired by a circuit node meeting a cell/signal path; do not use a stock medical cross as the entire identity. Keep the wordmark readable. Use the installed `lucide-react` package for consistent icons; use icons with text where meaning is not obvious. Add tooltips to icon-only desktop actions and accessible labels everywhere.

## 3. UNIQUE HORIZONTAL INTERACTION MODEL

The key interaction concept is a **left navigation rail + horizontally navigable research canvas**. Do not use the standard full-width top navigation bar with a conventional vertical page scroll as the primary desktop experience.

### Desktop shell

- Reserve the **left edge** for a narrow, expandable vertical navigation rail. It contains the BioCircuit mark, primary destinations, clear active state and small unread indicators only when real unread data exists.
- The **top strip should not become a conventional menu**. Use it for contextual information: current workspace/section, command/search affordance, connection state, a small progress indicator and account/notification utilities. Keep it visually light and compact.
- Use the **bottom edge as a contextual action dock** for the current section: create post, ask a question, add a project update, open search, or show keyboard hints. Make the actions depend on the active section; do not permanently occupy space with a large generic toolbar.
- The main desktop work area is a horizontally navigable canvas. Each major destination (Research Feed, Questions, Projects, Journal Club, Collaborators, Profile/Workspace) is a coherent panel or scene. A section may itself contain a vertical reading area for long content; do not force every paragraph or form into horizontal movement.
- Desktop users should be able to use shift+wheel, trackpad horizontal scroll, drag only on explicitly draggable surfaces, arrow keys where appropriate, clickable previous/next controls and the progress rail. Keep ordinary vertical scrolling functional for long content within a panel.
- Horizontal movement should move the canvas **toward the left as the user advances to the next panel**, matching the requested leftward flow. Make the direction understandable using a progress path, selected section label and previous/next affordance. Do not rely on an unexpected wheel-axis hijack.
- Use `scroll-snap` selectively at the main panel level only if it does not trap scrolling or create inaccessible stops. Do not snap every card. When a user opens a detail page or dialog, the focus and browser history must behave logically.
- Preserve real URLs/routes and browser back/forward behavior. Horizontal position must not be the only way to identify a page or bookmark a destination.

### Mobile and tablet adaptation

Do **not** copy the desktop horizontal canvas blindly to a phone. Mobile should use an accessible compact bottom navigation or a compact side drawer, with one primary vertical content column. Horizontal carousels are allowed for small, clearly labelled groups such as topics or featured projects, but not for long articles, forms, menus or essential information. Ensure no horizontal overflow at 320 CSS pixels. Make touch targets comfortably large and gestures optional; every swipe action must have a visible button alternative.

### Keyboard and assistive technology

- Include visible focus states, semantic landmarks, skip link, logical tab order and accessible page/section titles.
- Provide keyboard shortcuts only when useful, discoverable and non-conflicting. Suggested: `/` for search when focus is not in an input; `C` to compose when safe; `?` to show shortcuts. Always offer buttons and do not hijack shortcuts while typing.
- Support `prefers-reduced-motion: reduce`; remove parallax, smoothing and non-essential movement when enabled.
- Never disable normal keyboard focus, zoom, text selection, context menus or browser-native accessibility behavior.

## 4. LIVE BACKGROUND AND MOTION SYSTEM

Create a distinctive live background that feels alive but never competes with research content.

### Background concept

Build a layered **spectral lab field**: slowly drifting gradients, faint wavelength bands, thin moving paths/nodes, subtle grain and occasional out-of-focus cellular/microscopy-inspired shapes. The effect should be calm and personal, closer to a living instrument display than a wallpaper video. Use CSS gradients and a small SVG/canvas layer before reaching for WebGL/Three.js. The default should look good on low-power laptops and mobile phones.

### Motion requirements

- Background motion is slow, low contrast and low amplitude; no constant fast particle storms, strobing, flashing or large full-screen movements.
- Interaction response can shift a small light field or nodes toward the pointer on desktop, but it must not require a mouse and must have a static fallback on touch devices.
- Use lightweight, composited properties (`transform` and `opacity`) for most motion. Avoid continuous layout changes, heavy `filter: blur()` animations, large DOM particle counts, forced synchronous layout and updating React state on every animation frame.
- Animate transitions between panels with a purposeful direction, subtle opacity, restrained scale and a small amount of depth. Avoid every item flying into view on every scroll.
- Use staggered scroll reveal only for selected editorial objects, and animate once or sparingly. Scrolling should remain immediate. Do not implement a fake smooth-scroll system that delays input or causes nausea.
- Build micro-interactions for save, like, vote, accepted answer, upload state, filter selection, toast and successful form submission. Keep each interaction short and consistent; never make core UI wait for decorative animation.
- Use the current maintained **Motion for React** package/API only after verifying its official current docs. Prefer CSS for simple hover/focus transitions, Motion for React for selected layout/gesture/scroll-linked effects, and native browser capabilities when sufficient. Avoid adding GSAP or a second animation system unless there is a demonstrated need.
- For scroll progress/linked animations, use the supported Motion scroll APIs or native ScrollTimeline/CSS support where appropriate. Use IntersectionObserver or the library's equivalent for in-view reveals. Respect reduced-motion preferences in both CSS and JavaScript.
- Lazy-load any optional heavy visual feature. If frame rate is poor or `prefers-reduced-motion` is enabled, switch to a static gradient/line texture.

### Performance budget

Set and document a reasonable performance budget. Target fast initial content, stable layout and smooth interaction on a mid-range laptop/mobile, not an arbitrary “120 FPS” marketing claim. Measure the actual page with Lighthouse or equivalent when tools are available. Avoid background effects that block LCP, INP, CLS or consume battery. Use dynamic imports for optional scenes and do not ship a heavy 3D renderer just for decoration.

## 5. INFORMATION ARCHITECTURE AND COMPLETE FEATURES

Build routes, components, empty states and real interactions for the following. Keep the most important actions one or two steps away.

### A. Landing / signed-out experience

- Explain the community in one clear headline and a strong product sentence.
- Show example categories: biomedical imaging, bioinstrumentation, biosignal processing, biomechanics, biomaterials, tissue engineering, rehabilitation engineering, medical devices, computational biology/AI, clinical engineering and regulatory translation.
- Demonstrate the value: technical help, project logs, journal discussions, collaborator discovery and verified eligibility.
- Provide “Join the community” and “Sign in” paths, with accessible onboarding steps.
- Use genuine UI examples and explicitly labelled illustrative demo data when there is no live backend.
- State eligibility rules, what verification means, privacy basics and community standards before signup. Do not imply institution endorsement.

### B. Signup, login and academic eligibility

- Support real phone OTP via the chosen auth provider and a configured SMS provider. Do not implement SMS sending or OTP verification in browser code. Include resend countdown, attempt throttling, provider errors, expired OTP, wrong code, already-used phone, country code, keyboard OTP entry and paste support.
- Use CAPTCHA/anti-abuse controls where supported and configure auth rate limits. Follow current provider documentation and applicable local SMS rules, including India-specific requirements if operating in India.
- After the phone is verified, collect the minimum onboarding information: full/preferred name, profile handle, institution, degree pathway (B.Tech/BE, M.Tech/ME/MS, PhD or equivalent), status (currently enrolled, completed, awaiting results), graduation/expected year, discipline/degree title and areas of interest. Exact CGPA/marks must be optional/private if retained; never show it publicly or use it to rank access. Store whether marks are awarded or awaited without requiring an arbitrary high grade.
- Eligibility must be limited to the stated biomedical engineering pathway. Define edge cases (combined programs, related degrees, transfer, current students, alumni) and send ambiguous cases to manual review rather than automatically rejecting them.
- Provide a review workflow: pending, needs more evidence, approved, rejected with reason, appeal requested, expired/reverification needed. Public badges should be clearly defined; use separate states such as “Phone verified” and “Biomedical engineering eligibility verified.”
- If evidence uploads are enabled, use a private storage bucket with strict owner/reviewer policies, file-type and file-size allow-lists, MIME and magic-byte checks, randomized object names, malware scanning where practical, signed short-lived access, and no public URLs. Let applicants redact unrelated fields. Never put evidence documents in logs or public profile storage. Establish deletion/retention periods and remove documents once they are no longer required, subject to a documented audit/legal policy.
- Reviewers must have a dedicated, restricted role. Use server-side authorization and RLS; do not let clients self-assign `verified`, role, admin or reviewer flags. Log reviewer decisions and changes without logging evidence contents. Give applicants an appeal path and privacy/deletion controls.
- Build accessible validation, save/resume onboarding where safe, and clear explanations for each data field.

### C. Member profile and research identity

- Show name, handle, institution, degree pathway and status, a short bio, approved verification state, methods/tools, research interests, selected projects, useful contributions and collaboration availability.
- Let members control profile visibility and what contact details are public. Phone number, marks, enrollment evidence and private messages must never be public by default.
- Include profile editing, avatar upload with safe image processing, interest management, blocked users, muted topics and data export/deletion entry points.
- A public profile should be about contribution and skills—not follower totals. If following is implemented, keep it secondary.

### D. Research feed

- Provide useful feed modes such as **For You**, **Following**, **Latest**, **Questions**, **Project Logs**, and **Journal Club**. Make the selected mode visible and preserve it when navigating back.
- Cards should be content-type aware: discussion, question, project update, paper discussion, protocol/resource or collaborator request. Each has its own metadata hierarchy.
- Implement real pagination/infinite loading using cursor/keyset pagination, not fetching every post at once. Add skeletons, retry state, no-results state, dedupe, pull-to-refresh on mobile only when natural, and refresh indicators for new posts.
- Post actions: like/unlike, bookmark/unbookmark, reply, copy link, report, mute topic, follow author and share URL. Optimistically update where safe and roll back on failures. No fake counts in connected mode.
- Filtering: topics, post type, newest/active/relevant, unanswered questions and papers. Search should query titles, tags, content and paper metadata with debouncing, cancellation and safe parameterization.
- Add a “why am I seeing this?” explanation for For You recommendations and let people tune interests/controls. Avoid an opaque feed that boosts outrage or raw engagement.

### E. Composer and post publishing

- Build a complete composer for Discussion, Question, Project Update, Paper Discussion and Resource/Protocol.
- Include title where suitable, body, tags, optional project/paper link, DOI/URL fields, attachments when enabled, preview, draft autosave, character/file-size limits, clear publishing feedback and validation.
- Provide keyboard-friendly editor controls. Sanitize rich text before rendering; never render arbitrary HTML unsafely. If markdown is supported, use a maintained parser with raw HTML disabled or sanitized by a trusted sanitizer.
- Make it easy to cite source material, state methods, describe limitations and label preliminary results.
- Warn against posting identifiable patient information, patient images, clinical records or unauthorized datasets. Add a visible reminder in attachment/upload flows. Build a clear reporting process and terms/community rules.

### F. Questions and answer quality

- Structured question fields: title, details, topic tags, optional methods/environment/version, what has been tried, reproducible steps and relevant non-sensitive error details.
- Reply threads with nested depth kept manageable, edit/delete where policy allows, helpful vote, accepted answer (question author or authorized moderator), follow question, subscribe to answers and mark a question resolved/unresolved.
- An answer can include a reproducible checklist or formatted code snippet if applicable. Use syntax highlighting only when needed and do not execute user code.
- Notify the asker on replies and show question states clearly. Allow the asker to post a resolution summary so solutions help future members.
- Reputation should give strong weight to accepted helpful answers and verified resources; avoid giving points for every comment or reaction.

### G. Project workspaces and logs

- Project profile: title, problem statement, domain, project stage, methods, equipment, team roles, collaborator needs, tags, public/private visibility, source repository/website, licensing/IP notes, data governance notes and status.
- Project timeline/logs with dated entries, milestone, blocker, experiment notes, lessons, supporting images/diagrams/files, references and version history where reasonable.
- Collaboration request flow with a message, expertise offered, availability and accept/decline. Keep the creator in control; do not expose phone numbers by default.
- Include “looking for help” and “looking for collaborators” discovery filters. Let the owner change visibility, remove a collaborator, transfer ownership by explicit action and archive/delete the project.
- File uploads must use private/project permissions and enforce file limits. Do not claim ownership of work members upload. Provide a clear license field for public reusable artifacts and a takedown/report process.

### H. Journal Club and scholarly search

- Use stable, documented scholarly metadata APIs. Investigate current official API docs for **Crossref**, **OpenAlex** and **PubMed/NCBI E-utilities** as appropriate; use providers only where their coverage, terms, quotas and attribution requirements fit. You may add another reliable source after documenting the reason.
- Search by title, author, DOI, PMID, topic and publication date. Deduplicate records and normalize DOI/PMID. Store provider, source URL, retrieval time, publication date, and enough metadata to rebuild the display. Cache according to provider rules, respect rate limits, identify the source and link to the canonical record.
- Do not scrape publisher sites in violation of terms, bypass paywalls, redistribute full-text PDFs without rights, or present a metadata API result as peer review. Abstract availability and full-text rights vary; show an honest availability state.
- A paper discussion should support “What the paper claims,” “Methods,” “Limitations,” “Reproducibility,” “Practical impact,” “Questions” and member notes. Keep user interpretation visually distinct from sourced bibliographic information.
- A source paper card needs title, authors, venue, year, DOI/PMID where available, source link, publication date, retrieval timestamp and a clear label if the data is incomplete. Handle retractions/corrections where source APIs expose them and provide a correction/report flow.
- Avoid AI summaries by default. If an optional summary feature is added, use retrieval-grounded generation with direct source links, explicit “AI-generated summary” label, uncertainty, no fabricated citations and a clear route to the original paper. Never claim the model has read inaccessible full text.

### I. Search and discovery

- Unified search for members, posts, questions, projects, topics, tags and papers.
- Dedicated discovery views for expertise (e.g., fluorescence microscopy, EEG, embedded medical devices, finite-element methods, biosensors, biomechanics, biomaterials, medical image analysis), equipment access and collaboration availability.
- Search should be debounced, cancel stale requests, avoid leaking private projects or pending applicants, and return stable pagination. Show query suggestions based on existing public taxonomy without sending every keystroke to an LLM.
- Include filters with clear reset/remove actions and a visible count only when based on real query results.

### J. Notifications and optional messaging

- Notification centre with unread/read state and sensible categories: reply, answer accepted, project collaboration request, membership decision, mention, followed topic update and moderation outcome. Persist read status on the server and avoid duplicate events.
- Add user preferences for email/in-app notification categories and digest frequency. Do not create notification spam.
- If direct messages are implemented, require authenticated, eligible members; apply block/report rules, request/accept flow for first contact, rate limits, pagination and secure authorization on every message read/write. Do not expose messages to admins by default; only authorized moderation access under a transparent policy. Avoid end-to-end-encryption claims unless it is truly implemented and audited.
- If time prevents safe DMs, ship collaboration requests and project discussion first, but do not leave a decorative nonfunctional inbox.

### K. Meaningful reputation and community health

- Use a contribution ledger instead of mutable arbitrary totals. Events could include accepted answer, answer rated helpful, reviewed reproducible resource, project milestone confirmed by collaborators, thoughtful paper review and moderator-recognized contribution.
- Deduplicate events. Prevent self-voting, repeated vote farming, collusive loops, mass account abuse and points from deleted/invalidated content. Keep point rules documented and admin-adjustable within safe constraints.
- Do not rank people by marks, institution prestige, posting frequency, follower count or sheer reaction count. Do not create a public global leaderboard by default. Prefer personal milestones, “helpful contributor” indicators and evidence-backed skill tags.
- Add reporting, blocking, muting, content deletion/moderation, appeal and audit trail. Use neutral, transparent community standards. Moderation actions must be server-authorized and reviewable.

### L. Admin and trust console

- Separate admin/reviewer interface protected by server-side role claims or a trusted membership/role table; never rely only on a hidden UI element.
- Queues: eligibility requests, evidence resubmission, reports, spam, abuse, paper correction/takedown and appeals.
- Admin actions: approve/reject with reason, request more evidence, suspend/reinstate members, remove content, manage tags/taxonomy, review audit events and view aggregated community health metrics.
- Apply least privilege. A journal metadata editor must not automatically be a credential reviewer, and a credential reviewer must not automatically access private messages or unnecessary personal data.
- Record action actor, target, timestamp, reason and outcome. Restrict who can view audit records, protect against tampering and never store OTP codes or raw credentials in logs.

### M. Settings and account controls

- Profile/privacy controls, notification settings, theme, reduced motion, blocked/muted lists, active sessions where supported by provider, change phone/reverify, export personal data, delete account, clear drafts and view verification state.
- Deletion must explain effects and follow a documented policy for posts, replies, project ownership, audit logs and legally required retention. Do not silently keep uploaded credential documents after deletion without an explicit lawful retention basis.
- Provide understandable privacy and community policy pages. Minimize collection; avoid tracking that is not needed for core service.

## 6. RECOMMENDATION SYSTEM — CURRENT, EXPLAINABLE AND TESTABLE

“Latest recommendation model” does not mean calling an expensive generative model on every feed load. Build an explainable hybrid system first and keep the design ready for embeddings/reranking after enough safe data exists.

### First version: deterministic hybrid ranking

Implement recommendations on the backend using a documented score with tunable weights. Features may include:

- explicit user-selected interests and muted topics;
- tag/domain match and followed projects/authors/topics;
- freshness with decay rather than a simple “newest always wins” rule;
- helpful-answer or project outcome signals, not raw impressions;
- content quality signals such as completeness, citations and resolution state;
- novelty/diversity across authors, topics and content types;
- explicit saves, “not interested,” hides and reports;
- language preference and user-configurable feed mode.

Do not treat dwell time alone as positive feedback. A person may spend time because content is confusing or upsetting. Exclude hidden, blocked, private, unapproved and moderation-held content before ranking. Keep hard constraints outside the score; a high recommendation score must never bypass access control.

### Later version: semantic discovery

Before selecting an embedding or reranking model, check the latest official docs, model card, benchmark limitations, license, privacy implications, multilingual coverage, inference price/latency and deployment constraints. Compare a suitable current open embedding model (for example, a maintained BGE-family or E5-family model if its current license and benchmark fit) against PostgreSQL text search and tag matching. Do not automatically pick a model based on a leaderboard headline.

- Start with Postgres full-text search and metadata/tags. Consider `pgvector` only when measured retrieval quality justifies it.
- Store vectors only for public or appropriately authorized content; do not place private profile details, credential evidence, phone numbers or patient data into embedding inputs.
- Build a retrieval evaluation set of real, permission-cleared example queries and expected relevant resources. Track Recall@K / NDCG@K or an appropriate ranking metric plus latency, cost and diversity.
- Keep the model behind a provider interface so it can be replaced. Cache results where safe, version embeddings and support backfill/re-indexing.
- If a learned ranker is eventually used, start with offline evaluation and a staged rollout. Add an “explain this recommendation” feature and controls to reset preferences. Do not launch opaque personalization without monitoring bias, concentration and unwanted repetition.
- Do not call an LLM for each feed card. Use AI only when it makes a measurable difference and the latency/cost/privacy trade-off is documented.

## 7. BACKEND AND DATA ARCHITECTURE

Use a clear, maintainable design. For this repository, the default is **React + TypeScript + Vite frontend, Supabase Auth, Postgres, Row Level Security, Storage and Edge Functions**. Verify current stable package compatibility. Do not put privileged business operations exclusively in client-side code.

### Frontend architecture

- Use the existing Vite/React structure and split the monolithic `App.tsx` into route/layout, feature components, typed domain models, data access, validation schemas and theme/motion modules.
- Use React Router or an equally well-supported router for real routes and browser history. Use TanStack Query or a similarly justified current data-fetching cache for server state if needed; keep local UI state separate. Do not add Redux without a demonstrated need.
- Reuse `lucide-react` icons. Add a form library only if it materially reduces complex form errors. Use Zod (or a comparable schema validator) for shared request/form schemas where useful.
- Use strict TypeScript with no broad `any` shortcuts; define loading/error/empty states and explicit DTOs. Keep server-side secrets out of client imports.
- Create a `Demo mode` adapter for local preview using synthetic data. Demo mode must not be confused with authenticated production mode, and it must not pretend its OTP or academic status is real.

### Supabase/backend boundaries

- Use Supabase Auth for identity and configured phone OTP. Use Postgres for durable application entities. Use Storage for private evidence and permission-controlled project attachments. Use Edge Functions or tightly controlled server endpoints for actions that need privileged logic, provider API secrets, moderation operations or signed URL generation.
- Never expose the service-role key, database password, SMS provider secret, administrative token, private storage signing secret or AI provider secret in `VITE_` variables, frontend bundles, logs or Git. Public Supabase URL and anon/publishable key may be present in the frontend only with correctly configured RLS and provider guidance.
- Create a central typed data-access layer. Every endpoint/mutation must verify identity, authorization, validation and resource ownership server-side. A frontend route guard is usability, not security.
- Prefer least privilege and defense in depth. Every API should return the minimum safe DTO, not raw rows containing internal fields or private evidence metadata.
- Use idempotency for operations vulnerable to retry/double-submit (OTP workflow hooks where applicable, posting, payments if ever added, contribution events, webhook events, notifications). Do not add payments in this scope unless explicitly required.

### Required schema areas

Design normalized tables with stable UUID identifiers, timestamps, constraints, useful indexes, foreign keys and documented deletion semantics. At minimum consider:

- `profiles` (public-safe fields, handle, institution label, degree path, profile visibility, interest tags, collaboration availability);
- `membership_applications` (private review status, evidence references, request/decision timestamps, reviewer and reason fields with strict policies);
- `roles` or an equivalent trusted role assignment table for reviewer/admin, protected against client self-assignment;
- `topics` / `tags` and member-topic preferences;
- `posts` (type, author, title/body, visibility, state, timestamps, edit metadata);
- `post_tags`, `reactions`, `bookmarks`, `follows`, `comments/replies`;
- `questions`, `answers`, accepted-answer state and helpful votes, or a sound polymorphic approach if it remains enforceable;
- `projects`, `project_members`, `project_milestones`, `project_updates`, collaboration requests and safe file metadata;
- `papers`/`scholarly_records`, provider identifiers, DOI/PMID, source URL, fetched timestamp, bibliographic fields, retraction/correction fields when available;
- `paper_discussions`/notes or a consistent post association;
- `notifications` and notification preferences;
- `reports`, moderation actions, appeals and audit events;
- `contribution_events` ledger and derived reputation views;
- optional messaging tables only if full authorization/blocking/retention behavior is implemented;
- optional recommendation impressions/feedback records with documented privacy and retention limits.

Avoid a giant denormalized table. Do not store computed counts as a trusted client-supplied value. If counters are materialized, update them transactionally or via safe database logic and test consistency. Define unique constraints to stop duplicate reactions, bookmarks, follows and votes.

### Database migration discipline

- All schema changes must be versioned in repository migrations, not made only in the Supabase dashboard.
- Provide seed data that is obviously synthetic and safe to use in local/dev environments only.
- Include indexes for common filters and cursor pagination; avoid unbounded queries.
- Add constraints for allowed enum values/status transitions, reasonable string lengths and referential integrity.
- Include SQL tests or integration tests for major policies. Verify that a member cannot fetch or change another member's private data by guessing an ID.

## 8. SECURITY REQUIREMENTS — TREAT THE INTERNET AS HOSTILE

Follow the latest current official documentation from Supabase and the chosen stack. Use the **OWASP Top 10 (2025)** as a minimum awareness baseline and consider **OWASP ASVS** appropriate security verification requirements. Confirm the current released ASVS version during implementation; don't blindly copy an obsolete checklist. Do not claim an independent penetration test was performed unless it actually was.

### Authentication and sessions

- Use the managed auth SDK's supported session handling. Do not implement a custom JWT system or put auth tokens in localStorage unless the provider explicitly requires and documents it. Do not write a homegrown password/OTP implementation.
- Configure phone OTP expiry, resend limits, per-account/IP/device abuse controls, CAPTCHA where supported, session refresh/sign-out and recovery. Do not reveal whether a phone number is registered through overly specific error messages.
- Verify auth state on server-side protected operations. Use current secure cookie/session practices for any server session bridge and prevent CSRF where applicable.
- Never let the client choose its own account role, verification status, membership state or reviewer identity.

### Row Level Security and database authorization

- Enable RLS on **every exposed table** and private storage object. Start from deny-by-default. Create explicit read/insert/update/delete policies per role and resource visibility.
- Test owner/member/other-member/anonymous/moderator/admin behavior for every sensitive table. A member may read or edit only their own private profile fields and allowed resources; approved public profile fields are the exception, not the entire row.
- Use correct `auth.uid()` ownership checks and policy-safe membership joins. Test that guessing UUIDs does not allow access.
- Prefer `SECURITY INVOKER` functions by default. If a `SECURITY DEFINER` function is essential, pin `search_path` to an empty/safe value, schema-qualify every object, explicitly check the caller/resource ownership, revoke default execution from public/anon where appropriate, grant only the required role and add tests. Follow current Supabase recommendations.
- Never rely on hiding fields, buttons or route navigation in React as authorization.
- Write policy tests as code and include an explicit cross-account access regression suite.

### Input, output and file safety

- Validate all inputs on the server, not only with browser forms. Apply allow-lists, maximum lengths, pagination limits, content type restrictions and schema validation.
- Parameterize database queries. Prevent SQL injection, stored/reflected XSS, unsafe markdown/HTML rendering, URL scheme attacks, SSRF, path traversal, open redirects and unsafe file downloads.
- For links, allow `https:` by default and explicitly handle DOI, PubMed and other trusted schemes; reject `javascript:` and arbitrary dangerous schemes. External links should use safe `rel` attributes where applicable.
- Escape output at the rendering layer. Disable raw HTML in markdown or sanitize it with a maintained sanitizer and a clear policy.
- Upload validation must not rely on the file extension. Enforce size, allowed MIME plus magic bytes, randomized names, safe image decode/re-encode, private buckets, malware scanning where practical, signed URLs with short expiration and authorization per object. Prevent SVG/script uploads from being rendered as executable content.
- Add request-size, page-size and body limits. Prevent large payload abuse and accidental huge file/array loads.

### Abuse prevention and moderation

- Rate-limit login/OTP, search, post publishing, comments, reports, follows, reactions, file uploads, collaboration requests, invite requests, and admin review APIs. Apply per-user and per-IP controls where appropriate; avoid lockout rules that let attackers DoS a victim.
- Use CAPTCHA selectively on risky auth/signup actions. Add duplicate/spam heuristics, link throttling and account age/trust gating where justified.
- Prevent self-voting, duplicate reactions, automated report brigading and reputation farming. Keep moderation actions auditable and offer appeals.
- Add block, mute, report and delete controls. Blocked users must not bypass restrictions through private feeds, messages or recommendations.
- Include clear rules against patient-identifiable data, prohibited uploads, harassment, credential fraud and intellectual-property abuse.

### HTTP and deployment security

- Configure production HTTPS, secure transport redirects where supported, strict allowed CORS origins, a Content Security Policy compatible with the app, `X-Content-Type-Options: nosniff`, sensible `Referrer-Policy`, frame protection (`frame-ancestors` in CSP), permissions policy and appropriate cache controls for private routes. Avoid over-permissive `*` CORS or `unsafe-eval` unless justified and documented.
- Do not cache private responses publicly. Ensure auth/session/error data is not placed into public static caches, CDN logs or analytics.
- Keep environment files out of Git. Provide `.env.example` with names and safe placeholders only; never include live credentials. Rotate any secret that may have accidentally entered a commit.
- Run dependency and secret scans if available (`npm audit`/equivalent, GitHub secret scanning, CodeQL or similar). Triage findings; don't blindly “fix” by upgrading every dependency without testing.
- Add safe error boundaries and structured server logs. Redact phone numbers, credential evidence, tokens, raw message bodies and other sensitive fields. Avoid leaking stack traces or SQL/provider details to the user.

### Privacy and biomedical-specific safety

- This is a professional community, not a clinical care system. Explicitly prohibit identifiable patient data and clinical records in posts/uploads. Avoid implying the app is HIPAA-compliant or otherwise certified unless the relevant legal scope and independent assessment support that claim.
- Minimize personal data collection and document purpose, access, retention, deletion and export. Before public launch in India or elsewhere, verify current applicable privacy/data-protection law and SMS requirements using official sources and obtain appropriate legal review where needed.
- Store academic evidence separately from public profiles. Restrict reviewer access, log administrative access, delete evidence under a defined retention policy, and communicate how verification works.
- Avoid recording sensitive user attributes not needed for biomedical engineering membership. Do not turn exact marks/CGPA into a public signal or feed-ranking feature.
- Never use private posts, messages, evidence documents, or user-uploaded sensitive files to train or call third-party AI models without clear authorization, disclosure and a lawful basis.

## 9. QUALITY, ACCESSIBILITY AND RELIABILITY

### Accessibility

Target **WCAG 2.2 AA**. Test keyboard-only operation and screen-reader basics. Use semantic HTML, labels, field error associations, accessible dialog behavior, proper headings, focus return, contrast, reduced motion, zoom/reflow and descriptive link text. Avoid hover-only information. Ensure tooltips don't trap focus. Do not use color as the sole state indicator.

### Performance

- Set page-size/query limits, cursor pagination, sensible caching, lazy loading, optimized images, responsive image sizes and stable dimensions to prevent layout shifts.
- Keep the initial JS bundle lean. Lazy-load admin routes, rich editor, charts and optional animated backgrounds. Do not load a 3D library on every route.
- Debounce search, cancel obsolete requests, memoize only when profiling supports it, and avoid per-frame React state updates.
- Use optimistic updates carefully and roll back on server failures. Make loading states stable so content does not jump.
- Measure actual bundle size and Lighthouse metrics when available. Fix real bottlenecks rather than claiming generic speed benefits.

### Reliability and errors

- Design empty, loading, offline, stale, unauthorized, not-found, validation and server-error states for every major flow.
- Retry idempotent requests only; do not automatically replay sensitive mutations without an idempotency strategy.
- Handle duplicate submits, network interruption, auth token expiry, invalid OTP, expired signed URL and provider API downtime.
- Never lose a draft silently. Store drafts safely and distinguish local unsynced drafts from server-saved drafts.
- Ensure application routes load directly when pasted into the browser and refresh successfully under the production host's SPA routing settings.

## 10. TESTING PLAN — CREATE AND RUN TESTS

Use the currently maintained, compatible versions of unit and browser test tools. Prefer Vitest and React Testing Library for component/business logic tests, Playwright for critical end-to-end flows, and SQL/policy tests for Supabase authorization. Verify current official docs first.

### Unit/component tests

- Feed filters, search, sorting and recommendations;
- form schema validation and errors;
- visibility/role state rendering;
- post and question state transitions;
- reaction/bookmark deduplication;
- contribution event rules;
- recommendation score and exclusion rules;
- date/DOI/PMID normalization and source display;
- reduced-motion/theme behavior and accessibility attributes.

### End-to-end acceptance flows

1. A new member signs up, receives an actual OTP only in properly configured integration mode, verifies the phone and submits an eligibility application.
2. A pending applicant cannot access member-only actions or the reviewer console.
3. An authorized reviewer approves/rejects/requests more evidence, and the applicant sees a correct status/decision.
4. An approved member creates a question, another member answers, the question author accepts an answer and an actual notification is recorded.
5. A member creates a project, publishes a log, sends a collaboration request and controls project visibility.
6. A member searches and saves a scholarly record, opens the canonical source link and creates a journal-club discussion.
7. Reporting, blocking and moderator actions actually change access/visibility as designed.
8. A member cannot read/edit another member's private profile, membership evidence, draft, notification, project, or message by changing an ID in a request.
9. Unauthenticated users cannot post or access private resources; members cannot call reviewer/admin endpoints.
10. Mobile layout at 320/375/430 CSS pixels, tablet and desktop; keyboard navigation; reduced motion; direct route refresh; browser back/forward.
11. Upload attempts with oversized, spoofed MIME, SVG/script, malformed image, disallowed extension and unauthorized object IDs are safely rejected.
12. Repeated OTP, spam posting, duplicate reactions and high-rate searches are rate-limited and provide sensible feedback.

### Release gates

- No TypeScript errors, no known lint errors, successful production build, passing core tests and no unresolved critical/high security finding without documented mitigation.
- Review environment variable usage, generated bundle for secret leakage, RLS policies, storage policies, auth redirect URLs, CORS/CSP, source maps/logging and public demo behavior.
- Run dependency/secret/static analysis checks that the environment supports; report unavailable checks honestly.
- No release until external credentials and provider configuration have been tested in a real configured environment.

## 11. OBSERVABILITY, DEPLOYMENT AND OPERATIONS

- Provide local development instructions, `.env.example`, migration instructions, synthetic seed data, test commands, production build command and troubleshooting notes.
- Add environment-specific configuration for local, preview and production. Never use production credential evidence or live user data for local tests.
- Recommend an uncomplicated deployment compatible with the Vite frontend and Supabase backend. Configure SPA history fallback for client-side routes. Keep public API origins restrictive.
- Add privacy-conscious error/performance monitoring only after reviewing data collection and redaction settings. Keep logs actionable and non-sensitive.
- Document database backup/restore expectations, migration rollback strategy, storage retention, provider outage handling and how to disable a broken optional integration.
- Document what is free, usage-limited or paid: SMS provider, database/storage limits, domain, monitoring and scholarly API constraints. Never promise a forever-free service unless verified against current vendor policies.

## 12. EXECUTION ORDER

Do the work in phases but continue through them in the same task wherever the environment allows. Do not stop after writing a plan.

**Phase 0 — Inspect and baseline**
- Inventory files and current behavior.
- Check package scripts, current runtime and package versions, Git status and existing environment files without printing secret values.
- Run baseline tests/build if possible. Record existing failures separately from new failures.

**Phase 1 — Design system and shell**
- Implement the unique palette, theme tokens, typography, responsive left rail, contextual top strip, bottom action dock, horizontal desktop canvas, mobile navigation and live background.
- Preserve accessibility, normal content reading and browser navigation. Test reduced-motion and no-network font fallbacks.

**Phase 2 — Feature architecture**
- Split the app into typed feature folders/components and add route handling, shared models, validation, data fetching, error handling, loading states and demo-mode adapter.
- Implement feed, question, project, journal, profile, discovery, notifications and settings UI so all primary controls work.

**Phase 3 — Database and auth**
- Configure Supabase client safely, schema migrations, RLS and storage policies.
- Implement real phone OTP integration and membership review workflow. Keep demo auth unmistakably separate.
- Add seeded synthetic demo mode and a clear connection/settings status.

**Phase 4 — Scholarly metadata and recommendations**
- Integrate appropriate scholarly APIs with provider abstraction, cache, limits and source metadata.
- Build deterministic hybrid recommendations first, with user controls and evaluation tests. Add embeddings only if measured value supports it.

**Phase 5 — Trust, admin and safety**
- Reporting, block/mute, basic admin/reviewer console, audit events, contribution ledger, retention/deletion and authorization regression tests.

**Phase 6 — Validation and hardening**
- Run unit/component, integration, RLS/security and E2E checks, production build, responsive/accessibility inspection, dependency scanning and bundle/secret review.
- Fix all new failures that can be fixed locally. Do not hide or suppress errors simply to get green output.

**Phase 7 — Documentation and handoff**
- Update README with architecture, features, local setup, Supabase setup, environment variables, migrations, OTP provider setup, scholarly APIs, demo vs production, security model, tests, deployment and known limitations.
- Keep `PRODUCT_VISION.md` current and add architecture/security decisions as relevant.
- Rebuild any provided ZIP/package only after verifying the app files and excluding secrets, local caches and build artifacts that should not ship.

## 13. REQUIRED DELIVERABLES

At the end, the repository should contain:

- A polished, responsive, distinctly branded BioCircuit frontend with live but restrained background motion and desktop horizontal navigation;
- Real implemented routes and non-dead controls for the agreed features;
- Supabase SQL migrations with RLS/storage policy design and synthetic development seeds;
- `.env.example` with safe placeholders and explicit variable descriptions;
- Auth and academic-eligibility verification workflow with real provider wiring points and no fake verification in production mode;
- Data-access layer, schemas/validation and authorization checks;
- Scholarly metadata integration with source attribution and safe caching;
- Explainable recommendation logic and tests;
- Admin/reviewer and moderation flows at a scope that can be secured end-to-end;
- Unit, integration, database-policy and critical E2E tests;
- Updated README, product/architecture/security notes, setup and deployment documentation;
- Complete lockfile and reproducible scripts;
- A verified ZIP if the user requested one.

If external secrets or accounts are missing, do not invent them. Implement the integration, add clear configuration instructions and provide a clearly labelled local demo mode. State which capabilities cannot be tested without valid credentials.

## 14. DEFINITION OF DONE

The task is not done just because the page looks beautiful.

It is done when:

- The existing project has been inspected and upgraded rather than discarded without cause.
- Desktop navigation is genuinely side-oriented and horizontally advances left, with a clear accessible fallback; mobile remains simple and usable.
- The live background is smooth, subtle, low-cost and disabled/reduced for reduced-motion settings.
- Core features have working state, server persistence when configured, validation, failure handling and meaningful empty states.
- Academic identity is enforced through a real review workflow, not a user-controlled badge.
- The paper feed uses sourced metadata, canonical links and provider-aware limits rather than fabricated journal posts.
- Every private table and storage bucket is protected by tested authorization rules.
- There is no service-role key or other secret in the client bundle or repository.
- The production build and available tests pass; security and environment blockers are documented honestly.
- README lets another engineer run the app without asking what command or configuration to use.

## 15. MANDATORY FINAL REPORT — COPY-PASTEABLE

Finish by writing a file named **`BUILD_REPORT.md`** and then give a concise summary to the user. The report must include:

1. **Summary:** what was actually implemented and what remains incomplete.
2. **Files changed:** new/modified/deleted files and the reason for each major change.
3. **Architecture:** frontend, backend, authentication, database/storage, scholarly providers, recommendations and admin/moderation.
4. **Commands run:** exact install, lint, typecheck, tests, migration, build and audit commands, with actual pass/fail/blocker results.
5. **Tests/evidence:** actual test count/results, RLS/access-control cases tested, responsive/accessibility review performed and limitations.
6. **Security review:** RLS coverage, storage policies, secrets checks, rate limits, CSP/security headers, sanitization, abuse controls, dependency scan and unresolved issues.
7. **Provider configuration:** exact required environment variable names (never values), accounts/keys needed, OTP SMS setup, scholarly API setup and which functions require credentials.
8. **Known limitations:** no vague “some work remains”; name every incomplete feature, untested integration and reason.
9. **Deployment:** recommended steps, migrations and post-deploy verification.
10. **Git status:** current branch, changed files, commit hash if created, whether changes are committed/pushed, and any uncommitted work. Do not commit or push unless the user/workspace instructions authorize it.
11. **Next actions:** the smallest set of concrete steps the user must perform to run the application in their own environment.

Do not fabricate test results, security assurances, live data, model evaluations, institution approvals, or successful deployments. If the build cannot run because of DNS/network/registry limitations, record the actual error and still complete every offline task that is possible.

---

## Reference docs to verify during implementation

Use current official docs, not copied snippets from old tutorials:

- Next.js data-security guidance is relevant only if a justified migration to Next.js is made: https://nextjs.org/docs/app/guides/data-security
- Motion for React: https://motion.dev/docs/react and https://motion.dev/docs/react-scroll-animations
- Supabase phone OTP: https://supabase.com/docs/guides/auth/phone-login
- Supabase production checklist: https://supabase.com/docs/guides/deployment/going-into-prod
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/
- WCAG 2.2 quick reference: https://www.w3.org/WAI/WCAG22/quickref/
- Crossref REST API documentation: https://www.crossref.org/documentation/retrieve-metadata/rest-api/
- OpenAlex API documentation: https://docs.openalex.org/
- PubMed/NCBI E-utilities documentation: https://www.ncbi.nlm.nih.gov/books/NBK25501/

**Start now at Phase 0. Inspect the actual repository, make the implementation, test it, fix errors and write `BUILD_REPORT.md`. Do not stop at a proposal.**
