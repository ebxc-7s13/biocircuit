# Contributing

Issues and pull requests are welcome. This is a small preview project, so reviews may take time.

## Before opening a pull request

1. `npm ci`, then work in demo mode (`VITE_APP_MODE=demo`). Never use real personal data.
2. Run `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm test` and `npm run test:db`. For UI changes, also run `npm run test:e2e`.
3. Keep changes small and focused, and add or update tests for behaviour changes.

## Rules that protect users

- Never commit `.env*` files (other than `.env.example`), keys, tokens, passwords, recovery links or screenshots containing account data.
- Never put a secret in a `VITE_` variable. Everything with that prefix ships to browsers.
- Database changes go in a **new**, timestamped migration under `supabase/migrations/`. Never edit, rename or reorder an existing migration.
- Do not weaken RLS, grants or role checks. Membership, roles, suspension and audit records can be changed only by server-side code.
- Keep public copy accurate. During the preview, GitHub sign-in does not verify academic qualifications.

Unless a license is added, contributions are accepted under the same terms as the repository (see README).
