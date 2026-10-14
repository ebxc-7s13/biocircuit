# BioCircuit

The current visual system uses graphite/cobalt themes, self-hosted typography, glass navigation, a pausable spectral field and accessible project previews. See [the visual art-direction report](docs/VISUAL_ART_DIRECTION_REPORT.md) and [refinement checklist](docs/VISUAL_REFINEMENT_CHECKLIST.md) for current screenshots and verification.

BioCircuit is a social community for biomedical engineers: technical questions, accepted answers, project evidence trails, collaboration requests, and attributed scholarly discovery. The existing React/TypeScript/Vite project has been extended in place. Read [the canonical specification](MASTER_IMPLEMENTATION_PROMPT.md), [implementation status](docs/IMPLEMENTATION_STATUS.md) and [build report](docs/BUILD_REPORT.md) for the exact scope and verification limits. The [social redesign specification](BIOCIRCUIT_SOCIAL_REDESIGN_SPEC.md) supersedes the old horizontal-canvas layout. See the [redesign report](docs/REDESIGN_REPORT.md) for current UI evidence.

## Run the isolated demo

Prerequisites: Node.js 22.12 or later and npm. The tested machine used Node 22.23.2. Dependencies are pinned in package-lock.json.

~~~sh
npm ci
# Copy .env.example to .env.local and leave VITE_APP_MODE=demo
npm run dev
~~~

On PowerShell with script execution disabled, use npm.cmd. Open the localhost URL printed by Vite. Development defaults to a clearly labelled synthetic demo when VITE_APP_MODE is absent. Production defaults to connected mode and shows setup errors if its public configuration is absent; backend errors never fall back to synthetic data.

Demo data uses biocircuit-demo-v2 in browser localStorage. Reset it in Settings. It never sends SMS, verifies identity or contains invented live paper records. Original prototype storage keys are retained untouched; original App/styles/README/vision are archived in docs/baseline. Do not enter real sensitive data into demo mode.

## Connect a real development environment

Use a new isolated Supabase staging project, never live user data. Start with the [Docker-free cloud workflow](docs/CLOUD_SETUP.md) and [acceptance checklist](docs/CLOUD_ACCEPTANCE_CHECKLIST.md). The installed CLI supports migration dry-runs, API-based Edge deployment and hosted catalog queries. Complete [SETUP.md](docs/SETUP.md) for the provider and processor contracts. Keep the frontend local; change VITE_APP_MODE to connected only after the exact staging target and public configuration are ready.

Phone verification and academic approval are different states. A newly authenticated user may submit a private application; only a server-approved, active member can contribute. Combined degree pathways require human review. No grade threshold or institutional integration is fabricated.

## Commands

~~~sh
npm run dev
npm run lint
npm run typecheck
npm test
npm run test:db
npm run typecheck:edge
npm run test:edge
npm exec playwright -- install chromium
npm run test:e2e
npm run build
npm run check:bundle
npm audit
npm run evaluate:ranking
npm run test:production
npm run format:check
npm run preview
~~~

Deno 2 is required for Edge checks (tested 2.9.6). Supabase CLI 2.120.0 is pinned as a development dependency. Hosted staging and PostgreSQL/PGlite checks need no Docker. Containers are required only for the optional native local Supabase stack. PGlite tests use explicitly stubbed Auth/Storage services and do not substitute for live Supabase/SMS tests. See [release readiness](docs/RELEASE_READINESS.md) for the current evidence scope.

## Architecture

- src/Workbench.tsx: URL/history-aware social shell, fixed desktop sidebar, native vertical feed, contextual search/top bar, useful right rail and mobile bottom navigation; keyboard/focus, theme and restrained background.
- src/components/: responsive social navigation, avatars, accessible dialogs and attributed paper metadata cards.
- src/features/: Explore/search, saved posts/papers, feed, publishing, threads, projects, profiles, eligibility, journal, account, private avatar controls and trust console.
- src/domain/: entity types, Zod validation, search matching and explainable ranking.
- src/data/: separate synthetic/connected adapters, bounded queries and mutation orchestration.
- supabase/migrations/: relational integrity, RLS, privileged transactions, private scholarly cache, abuse budgets, contribution ledger, moderation appeals and private avatar/project image metadata and storage cleanup tombstones.
- supabase/functions/: authenticated scholarly search (Crossref/PubMed), account deletion and private avatar uploads and project images.
- scripts/avatar-processor.mjs: first-party Node/Sharp image decoding and re-encoding, separate from the frontend bundle.
- tests/: unit/component, database authorization, browser journeys and automated accessibility scans.

Only public-safe profile fields are exposed. Phone numbers live in managed Auth; optional marks live in private academic applications. Direct client table writes and direct storage uploads are denied. Operations use authenticated SQL RPCs; role assignment requires a trusted database administrator.

## Deployment and current limits

Prepare an HTTPS static frontend with SPA fallback and the headers in public/_headers; deploy Supabase functions/database separately. See [OPERATIONS.md](docs/OPERATIONS.md). Nothing has been publicly deployed, purchased, committed or pushed.

Real SMS, academic reviewer operations against a deployed service, provider proxies, Storage, deletion and processed avatar uploads still need external configuration and live verification. Project PNG/JPEG images have a private, member-only decoded-image pipeline; it requires the configured first-party processor and deployed function. Academic evidence and PDF/document attachments remain disabled pending a reviewed document validation/scanning pipeline. Email delivery/digests and direct messaging are not enabled. No private material is sent to AI services.

[SECURITY.md](docs/SECURITY.md) documents controls, tested negative cases and remaining release gates. Passing local tests and a zero-advisory dependency scan do not establish production readiness.
