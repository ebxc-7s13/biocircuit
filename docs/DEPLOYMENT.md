# Deployment — GitHub Pages (free)

**Status: PREPARED, NOT PUBLISHED.** Publishing a public repository and site, deploying Edge Functions and changing the Edge `ALLOWED_ORIGIN` secret were blocked by Claude Code's permission policy. The owner runs one script. The app remains a **staging preview, not production-ready** (see [FINAL_AUTONOMOUS_RUN_REPORT.md](FINAL_AUTONOMOUS_RUN_REPORT.md)).

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
