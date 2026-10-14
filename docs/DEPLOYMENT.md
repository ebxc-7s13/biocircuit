# Deployment — GitHub Pages (free)

**Status: PUBLISHED (staging preview, not production-ready)** — https://ebxc-7s13.github.io/biocircuit/ · source https://github.com/ebxc-7s13/biocircuit (public; free Pages requires it).

Published 2026-10-14 at the owner's request:
- public repository created and `main` pushed;
- public build variables set;
- Pages enabled with the Actions source (first workflow run succeeded);
- Edge `ALLOWED_ORIGIN` = `http://127.0.0.1:5190,https://ebxc-7s13.github.io`, and the four functions redeployed.

The owner set Supabase Site URL and the Pages recovery redirect in the dashboard.

**Live verification** (headless browser against the public URL):
- all main routes render with live staging data;
- real email sign-in for account A through the site's own dialog: token 200, profile loaded;
- `avatar` Edge Function 200 from the Pages origin;
- Edge preflight returns 200 with the exact allow-origin for the Pages origin, and 403 for other origins.

Deep links initially returned HTTP 404 through the `404.html` fallback. Each static route now ships its own `<route>.html`, so Pages serves 200; only detail routes (`/post/:id`, `/project/:id`, `/member/:id`) still use the fallback.

The original preparation notes follow.


## What is ready

- **Local Git repository:** branch `main`, one commit. It contains 844 files; `.cloud/`, `.env.local` and `dist/` are excluded. Privacy scan before commit: no account emails, passwords, owner email or secret keys (only guard literals and synthetic fixtures).
- **`.github/workflows/pages.yml`:** `npm ci` → unit tests → build in connected mode with `BASE_PATH=/<repo>/` and `STATIC_HOST=github-pages` → deploy to Pages. Reads the public `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` from repository variables.
- **Sub-path support:** `vite.config.ts` `base` comes from `BASE_PATH`; the router uses `basename`; `src/domain/paths.ts` builds the recovery callback, recovery redirect and plain links.
- **GitHub Pages hosting mode:** GitHub Pages ignores `_headers`, so the reviewed CSP is injected as a `<meta>` tag (minus `frame-ancestors`, which meta cannot carry). `404.html` is the SPA deep-link fallback.
- **Edge Functions:** `ALLOWED_ORIGIN` accepts a comma-separated list of exact origins (tests reject look-alikes, wrong scheme, `null` and `*`). The code is not yet deployed; deployed sources were verified identical to local beforehand.
- **Verified locally:** the Pages build served under `/biocircuit/` renders home, feed, explore, recovery and policies with live staging data, fonts, and 0 console/CSP errors. Regression 20/20 ([results](verification/final-2026-10-14T09-33-16-488Z/results.json)). Edge tests 10/10.

## Owner steps

1. `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/publish-github-pages.ps1`. This creates the **public** repo `biocircuit` (free Pages requires public). It sets the two public variables, enables Pages (Actions source) and pushes. It then sets `ALLOWED_ORIGIN=http://127.0.0.1:5190,https://<owner>.github.io` and redeploys the four functions.
2. Supabase dashboard → Authentication → URL Configuration:
   - Site URL `https://<owner>.github.io/biocircuit/`;
   - add redirect `https://<owner>.github.io/biocircuit/account/recovery`;
   - keep the loopback redirect.
3. Site: `https://ebxc-7s13.github.io/biocircuit/` once the Actions run is green.

## Limits on the public site

- Phone sign-in needs paid SMS and hCaptcha, which are not configured. Email sign-in works.
- The default email sender allows 2 messages per hour.
- Image upload, approved-member features and scholarly search positives remain blocked, as documented.
- GitHub Pages cannot send `frame-ancestors`, HSTS customization or other response headers.

## Installable app (PWA)

The site is also an installable Progressive Web App: `public/manifest.webmanifest` (standalone display, start page `/feed`, icons generated from the logo incl. maskable and Apple touch icons) and `public/sw.js`, registered in production builds only.

The service worker handles only same-origin GET requests within its scope:
- Pages are network-first (always fresh online; cached copy offline).
- Hashed `/assets/` are cache-first.
- Supabase Auth, data and Edge Functions are cross-origin and are **never** intercepted or cached.

Verified with a local preview under `/biocircuit/`:
- the service worker is active and controls the page;
- manifest and all icons return 200;
- the cache holds only own-origin pages and assets;
- offline, the app shell opens;
- 0 console errors.

Install it:
- **Android/Chrome/Edge:** browser menu → *Install app* (or *Add to Home screen*).
- **iPhone/iPad (Safari):** Share → *Add to Home Screen*.
- **Desktop Chrome/Edge:** the install icon in the address bar.

## Public participation via GitHub (owner decision 2026-10-14)

Paid SMS cannot be used, so for this public preview a **GitHub OAuth identity** replaces phone verification as the participation check, and membership is **auto-approved** (no academic review). Owner decisions: "GitHub sign-in", "Auto-approve for now".

- **Database: migration 22** `20261014000200_github_participation.sql`.
  - A `security definer` trigger on `auth.identities` fires only for `provider = 'github'`. It sets `membership = 'approved'` for unsuspended profiles in `not_submitted/pending/needs_evidence/expired`, and writes an `audit` row (`membership_auto_github`).
  - It never overrides rejected/appeal decisions or suspensions.
  - Only hosted Auth can create identities; anon/authenticated can neither insert identities nor execute the function.
  - Local SQL 133/133 (8 new checks).
  - Applied to staging after a dry run showed exactly this migration (no seeds/roles). Read-back: trigger enabled, GitHub-only, definer, no client execute ([evidence](verification/cloud/github-participation-migration-2026-10-14T17-00-22-510Z.json)).
  - Reversible: `drop trigger auth_github_participation on auth.identities`.
- **Frontend.**
  - The account dialog has "Continue with GitHub".
  - `/auth/callback` captures the implicit-flow fragment before router startup and strips the URL.
  - It adopts the session only if this browser started a sign-in in the last 10 minutes (login-CSRF guard), and only after hosted `getUser` verifies the token. Then it opens the feed.
  - The GitHub provider token is discarded.
  - Unit tests `tests/oauth-arrival.test.ts` 9/9.
- **Owner configuration (GitHub has no API for OAuth apps).**
  1. GitHub OAuth app with callback `https://ibxubsegrabpspopdgep.supabase.co/auth/v1/callback`.
  2. Supabase GitHub provider enabled with its client ID/secret.
  3. Redirect URLs `https://ebxc-7s13.github.io/biocircuit/auth/callback` and `http://127.0.0.1:5190/auth/callback`.

  `node scripts/check-github-oauth.mjs` verifies provider and allowlist read-only.
