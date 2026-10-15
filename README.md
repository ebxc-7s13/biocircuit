# BioCircuit

**Live preview:** https://ebxc-7s13.github.io/biocircuit/

BioCircuit is a community for biomedical engineering research. People post research updates, questions with accepted answers, project evidence logs and collaboration requests, and look up attributed papers. It runs as a static React app on GitHub Pages, with a Supabase backend (Postgres with row-level security, Auth, Edge Functions). It can be installed as a PWA.

## Who can take part (public preview policy)

- **Anyone can browse.**
- **Anyone who signs in with GitHub can participate**: posting, replying, reacting, bookmarking and creating projects. Membership is approved automatically by a database trigger when Supabase Auth creates a GitHub identity.
- **Academic qualifications are not verified.** A GitHub account proves only that a GitHub account exists. Membership in this preview is not a credential, and the site says so.
- The rule never overrides rejected applications, open appeals or suspensions. Clients cannot call it.
- Email accounts can sign in, browse and edit their own profile. They join by using **Continue with GitHub** with the same email.
- Phone (SMS) verification is not configured, because paid SMS is out of scope. The academic review flow still exists for staff-reviewed applications.

To return to review-only membership, drop the trigger `auth_github_participation` (see `supabase/migrations/20261014000200_github_participation.sql`).

## Features

- Feed, questions, projects/collaborations, journal club, explore, saved items, notifications, profiles and settings
- Trust and moderation console (reports, appeals, academic review queue) for staff roles
- Scholarly search through an Edge Function (Crossref/PubMed); results depend on provider availability
- Email sign-in with password recovery, GitHub OAuth, account export and deletion
- Light and dark themes, a responsive mobile layout, keyboard and screen-reader support, and offline caching of the app shell

## Run locally

Requires Node.js 22.12+ (tested 22.23.2) and npm. On Windows PowerShell, use `npm.cmd` if script execution is disabled.

```sh
npm ci
cp .env.example .env.local   # leave VITE_APP_MODE=demo for synthetic local data
npm run dev
```

Demo mode uses synthetic data stored in the browser. It never contacts a backend or verifies identity. Connected mode needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, which are public values. Never put a secret in a `VITE_` variable. See [docs/SETUP.md](docs/SETUP.md) and [docs/CLOUD_SETUP.md](docs/CLOUD_SETUP.md).

## Checks

```sh
npm run lint
npm run format:check
npm run typecheck
npm test                 # unit/component (Vitest)
npm run test:db          # migrations, RLS and authorization (PGlite; Auth/Storage stubbed)
npm run test:edge        # Edge Function tests (Deno 2)
npm run typecheck:edge
npm run test:e2e         # Playwright journeys and axe accessibility scans (demo mode)
npm run build
npm audit
node scripts/check-github-oauth.mjs   # read-only GitHub provider check against staging
```

## Deployment

Pushes to `main` run [.github/workflows/pages.yml](.github/workflows/pages.yml): `npm ci`, unit tests, a build with `BASE_PATH=/biocircuit/` and `STATIC_HOST=github-pages`, then a GitHub Pages deploy. The build injects the reviewed Content Security Policy as a meta tag and writes per-route HTML copies, so deep links return HTTP 200. Database migrations and Edge Functions deploy separately with the Supabase CLI. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) and [docs/OPERATIONS.md](docs/OPERATIONS.md).

## Architecture

- `src/Workbench.tsx`: app shell, routing, navigation and theme
- `src/features/`: feed, threads, projects, profiles, account, auth, recovery, OAuth callback, trust console
- `src/domain/`: types, Zod validation, ranking, OAuth/recovery URL handling, base-path helpers
- `src/data/`: separate demo and connected adapters
- `supabase/migrations/`: ordered schema, RLS, privileged RPCs and triggers (do not rename or reorder)
- `supabase/functions/`: scholarly search, account deletion, avatar and project images
- `tests/`, `supabase/tests/`, `tests/e2e/`: unit, database authorization and browser tests
- `docs/`: setup, security, operations, release reports and verification evidence; `docs/specs/` holds the original product specifications and work prompts

## Known limitations

- **Staging backend.** The site uses a free-tier Supabase staging project, so there is no uptime guarantee and free-tier limits apply.
- **No SMS.** Phone verification is unavailable.
- **Email is rate-limited.** Auth email uses Supabase's default sender, roughly 2 messages per hour across the whole project, so password recovery and signup emails can be delayed.
- **No uploads to a processor.** Image uploads need a first-party image processor that is not hosted, so avatar and project images are unavailable. Document uploads are disabled.
- **No clickjacking header.** GitHub Pages cannot send HTTP headers, so the `frame-ancestors` protection is absent.
- **Retention and backups.** Retention jobs and backups follow the free tier; see [docs/OPERATIONS.md](docs/OPERATIONS.md).
- **Not production ready.** See [docs/RELEASE_READINESS.md](docs/RELEASE_READINESS.md) and [docs/PUBLIC_RELEASE_REPORT.md](docs/PUBLIC_RELEASE_REPORT.md).

## Security

Report vulnerabilities privately; see [SECURITY.md](SECURITY.md). Controls and tested negative cases are documented in [docs/SECURITY.md](docs/SECURITY.md).

## License

No license file has been added. Public visibility on GitHub does not grant reuse rights beyond GitHub's terms of service. Bundled fonts are under the SIL Open Font License; see `public/fonts/`.
