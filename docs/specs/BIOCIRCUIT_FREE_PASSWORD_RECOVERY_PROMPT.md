# BioCircuit — Autonomous Free Password-Recovery Acceptance

## Goal

Complete and verify a safe password-recovery flow for the existing BioCircuit application using **only genuinely free resources**. Investigate the best available options independently, implement and test the application-side flow, configure the existing Supabase recovery template and allowed redirect behavior, and verify actual email delivery and password reset when a safe free delivery route is available.

Do not wait for me to choose the provider or write follow-up prompts. Research current official provider documentation and choose the best genuinely free approach compatible with the resources already available. If every external delivery route requires a paid plan, a purchased domain, or an unavailable credential, complete all independent work and document the exact blocker instead of pretending delivery succeeded.

## Existing project and constraints

- Work in the existing BioCircuit repository. Do not start a replacement app.
- Existing Supabase staging project: `ibxubsegrabpspopdgep`.
- Existing recovery template: `supabase/templates/recovery.html`.
- Existing staging accounts A and B are already registered. **Use sign-in/recovery only; do not register duplicates or delete them.**
- Keep the current visual design, Supabase migrations, Edge Functions, RLS policies, identity checks, and access controls intact.
- Keep the frontend unpublished and use staging only.
- The user’s hard constraint is zero cost: no paid tier, upgrade, SMS credits, purchased domain, usage-based billable resource, or credit-card activation. Do not make any purchase or create billable infrastructure.
- Never expose credentials, SMTP passwords, API keys, reset tokens, reset URLs, OTPs, session tokens, controlled email addresses, or personal data in chat, logs, screenshots, or reports.

## Phase 0 — Inspect current implementation and evidence

1. Read the latest `docs/CLOUD_ACCEPTANCE_REPORT.md`, `docs/CLOUD_ACCEPTANCE_CHECKLIST.md`, `docs/RELEASE_READINESS.md`, `docs/SECURITY.md`, `docs/SETUP.md`, and relevant previous recovery reports.
2. Inspect `supabase/templates/recovery.html`, Supabase configuration, auth client setup, recovery UI, routes, navigation guard, current session handling, and recovery tests.
3. Verify the actual staging target using the existing safe target assertion/tooling. Never print secret environment values.
4. Identify which steps already exist and which are unimplemented. Do not assume the HTML file in the repository is already installed as the hosted project’s recovery email template; verify the effective hosted configuration using an approved safe method.
5. Record a concise baseline in `docs/PASSWORD_RECOVERY_ACCEPTANCE.md` before changes.

## Phase 1 — Audit genuinely free email delivery options

Use up-to-date official documentation and verify actual plan restrictions. Evaluate in this order:

1. **Existing Supabase default Auth email sender**, but only if the recipient is an already-authorized project/team email and the current rate limit allows the test. Supabase documents that its built-in sender is limited (currently 2 Auth emails/hour) and rejects recipients outside the project team. Do not add a person as a Supabase organization member merely to make email deliverability work, because that can grant broader project access. Do not assume default SMTP can send to arbitrary public addresses.
2. **An existing free SMTP/provider account and already-owned, verifiable sending domain**, if the user already has one. Use only existing domains and free allowances; no domain purchase, paid upgrade, or paid activation.
3. **A free provider’s restricted test sender/sandbox**, only if its official terms allow sending the required recovery message to the controlled test inbox and it can be configured securely with Supabase Auth. Respect recipient allowlists and sending quotas.
4. Another demonstrably free SMTP-compatible provider, only if current official docs confirm that the necessary functionality works on the free plan without requiring a purchased domain or paid upgrade.

Do not pick a provider based on a “free trial.” Do not claim a provider is suitable before checking sender/domain verification, recipient restrictions, SMTP/API availability, quotas, rate limits, and relevant terms. Keep all credentials out of source files and frontend environment variables.

If no existing permitted recipient or suitable sender/domain is available, mark live delivery as blocked by a specific missing prerequisite. Do not fabricate an email. You can still finish the template, recovery UI, callback processing, security handling, and non-delivery tests. State the one smallest user action needed to unblock delivery.

## Phase 2 — Review and refine the recovery email template

Review `supabase/templates/recovery.html` and correct it if required:

- Use the supported Supabase template variables. Prefer `{{ .ConfirmationURL }}` for the authenticated recovery link unless the implementation deliberately uses the documented `TokenHash` flow correctly.
- Use a clear subject such as “Reset your BioCircuit password.”
- Use accessible, responsive, email-client-safe HTML and inline styling.
- Explain that the link is single-purpose, time-limited, and should not be forwarded.
- Include a brief note that the recipient can ignore the message if they did not request recovery.
- Never include passwords, profile details, marks, institution, or unnecessary user metadata.
- Do not insert custom unescaped user content.
- Disable link tracking or rewriting in an email provider where it could alter Supabase’s verification URL.

Remember: a local template file does **not** automatically update the hosted project. Install the template through the correct hosted Supabase Dashboard or an authenticated supported Management API method. If a manual dashboard step is needed, prepare the exact subject and HTML and tell me where to paste it, but continue all other work. Never ask me to paste secrets into chat.

## Phase 3 — Verify application recovery flow

Implement or repair the complete client flow using the existing Supabase SDK/version and architecture:

1. A public “Forgot password?” screen accepts an email address.
2. Call `supabase.auth.resetPasswordForEmail(email, { redirectTo: <allowed recovery route> })` using the actual configured app origin. Do not hardcode an arbitrary production URL.
3. Show a generic success message that does not reveal whether an account exists. Never depend on the response to disclose account existence.
4. Ensure the exact recovery redirect is registered in Supabase Auth URL Configuration. Prefer exact local/staging URLs over broad wildcard redirects.
5. Process the supported recovery callback/session event safely. Check the installed `supabase-js` behavior and current official documentation.
6. Provide a dedicated update-password screen reachable after a valid recovery link. Require a sufficiently strong password and confirmation, display validation and useful errors, and call the documented `supabase.auth.updateUser({ password })` only after a valid recovery session is established.
7. Do not allow a random unauthenticated visitor to set another user’s password. A direct visit to the update-password route without a valid recovery context must show a safe error and must not call password update.
8. On success, clear sensitive recovery artifacts from the visible URL/history where safe, avoid logging them, and end or refresh the recovery session appropriately. The user should be able to sign in with the new password.
9. Include loading, expired/invalid-link, cancelled, duplicate-request, network-error, and successful-reset states.
10. Preserve existing login/register UI and ensure error responses do not allow user enumeration.

Do not modify RLS or role policies for password recovery. Password reset belongs to Supabase Auth; it must not change phone-confirmation, academic approval, membership, or staff-role flags.

## Phase 4 — Actual live verification

Use existing staging account A or B, whichever is controlled by the user and available locally. Do not print its email or credentials.

When a permitted free delivery path is configured:

1. Request recovery through the BioCircuit UI.
2. Verify that the hosted Auth service accepts the request.
3. Confirm that the recovery email arrives in the intended controlled inbox (check spam only as needed).
4. Open the real link privately in the browser. Never save or print the raw URL/token in logs or reports.
5. Confirm that it reaches the intended recovery route and establishes the expected recovery context.
6. Set a new unique password, with secrets entered only in the local UI.
7. Verify the reset succeeds, logout/session state is sensible, and a new login with the new password works.
8. Verify that the old password fails after the password change.
9. Verify that an expired, reused, malformed, or incomplete recovery link cannot reset a password. Do not weaken time limits to make this pass.
10. Verify generic user-facing responses for unknown emails and that no private account data is returned.
11. Check logs and screenshots for credential or reset-token leakage.

If the sender cannot deliver to the controlled inbox, do not mark delivery/reset complete merely because `resetPasswordForEmail` returned no error. Supabase intentionally avoids revealing whether an account exists; the absence of an API error is not proof of delivery.

If email recovery can only be tested using the built-in sender for authorized project-team recipients, use that restriction honestly and report the scope.

## Phase 5 — Test and security review

Run available formatting, lint, TypeScript, unit/component, connected browser, security, and production-build checks. Add tests for:

- Forgot-password form validation and generic response.
- Exact redirect URL selection.
- Recovery callback processing.
- Update-password route’s required recovery context.
- Strong-password and confirmation validation.
- Invalid/expired/reused link behavior where realistically testable.
- Successful Auth password update and subsequent login, only when live delivery is available.
- No mutation of phone verification, academic membership, roles, or other profile flags.
- No tokens in logs, analytics, screenshots, URLs persisted longer than necessary, or generated reports.
- Responsive/accessibility behavior at 320, 390, 1024, and 1440 pixel widths as feasible.

Keep mocked tests distinct from live staging evidence. Do not remove assertions or count blocked tests as passing. Do not run destructive account deletion or database reset during recovery testing.

## Phase 6 — Autonomous decision-making

After recovery is implemented and verified as far as possible, inspect other open release gates and select the next highest-value feasible task yourself. Continue using:

**Inspect → Research free options → Decide → Implement → Test → Diagnose → Fix → Retest → Document → Continue.**

Keep working on independent tasks while waiting for any manual sender setup. No routine approval request is needed. Ask the user for intervention only when no secure zero-cost path exists or an account-owner operation requires it.

## Final reporting

Update:
- `docs/CLOUD_ACCEPTANCE_REPORT.md`
- `docs/CLOUD_ACCEPTANCE_CHECKLIST.md`
- `docs/RELEASE_READINESS.md`
- `docs/PASSWORD_RECOVERY_ACCEPTANCE.md`

State precisely:
- Whether the hosted recovery template is installed.
- Which sender was evaluated and why it is genuinely free (or the exact blocker).
- Whether an email was delivered to the controlled inbox.
- Whether the real link worked, reset the password, invalidated/rejected reuse, and allowed new-password login.
- Exact tests run and actual outcomes.
- Outstanding security concerns and required manual actions.

Do not claim production readiness or send a public deployment. Do not expose secrets.

## Start now

Inspect the existing reports and recovery implementation, check the current free delivery options and current effective hosted settings, then make the best secure zero-cost choice and execute all feasible work. Do not stop after writing a plan. Continue until every feasible recovery acceptance criterion passes or a specific external blocker is proven.
