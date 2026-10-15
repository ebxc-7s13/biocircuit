# BioCircuit — Claude Code Autonomous Project Completion Directive

## Mission

You are the autonomous lead engineer responsible for completing the existing **BioCircuit** project: a polished social community for people with biomedical-engineering education, research interests, projects, technical questions, and scholarly discussions.

Work directly in the existing project directory. Begin by studying the repository and its reports, then independently select the highest-value unfinished work, research feasible options, implement the best safe solution, test it, fix defects, and continue until every feasible requirement that can be completed with **strictly zero-cost resources** is done.

**Do not stop after an audit, plan, recommendation, individual fix, or a blocked email task.** If one requirement needs an unavailable service, finish every independent task, document the exact blocker, and move on to the next requirement. Do not ask the user to generate a new prompt for each phase or approve routine engineering decisions.

The application must remain unpublished. A successful local build or a high test count does not mean production readiness.

---

## 1. Known project context (verify against the actual files)

### Confirmed staging target
- Supabase project name: `biocircuit-staging`
- Supabase project reference: `ibxubsegrabpspopdgep`
- Project dashboard: `https://supabase.com/dashboard/project/ibxubsegrabpspopdgep`
- Existing local project path used on the developer's Windows machine: `D:\personal_projects\my apps\biocircuit-source\biocircuit`
- The project has an existing React/TypeScript/Vite frontend, its visual redesign, a Supabase client/gateway, 19 database migrations, and four Edge Functions. **Inspect the actual current tree before relying on these details.**

### Functions reported as deployed
- `scholarly-search`
- `account-delete`
- `avatar`
- `project-images`

Verify the real deployment state in the staging project; do not assume a previous report still matches the live deployment.

### Existing product and UI direction
Keep the redesigned, social-first BioCircuit experience. It uses a vertical feed, left-side navigation, responsive mobile navigation, a graphite/cobalt visual identity, condensed display type, liquid-glass surfaces, a pausable animated background, and a blue project-preview marquee. The visual upgrade was reported as inspected through many responsive screenshots and multiple refinement passes.

Do not redesign the whole application without a verified reason. Preserve working routes, community features, motion/accessibility controls, and the current aesthetics. Make visual changes only when required to fix a real usability, accessibility, reliability, or responsive defect.

### Existing behavior and safeguards reported
- Email/password registration and sign-in were added for staging.
- Hosted email confirmation was disabled for the staging project to allow email-based test registration. This does **not** verify a phone number or approve academic membership.
- Actual live email signup produced a managed Supabase session; the account had no phone number or `phone_confirmed_at`, its profile remained unverified and `membership = not_submitted`, and no staff roles were assigned.
- A route/session test was repaired because a route waited for `networkidle` even though its content/session/core requests were healthy. The runner uses bounded content/API checks and supports resuming with an existing account.
- Two staging test accounts, A and B, were created through ordinary signup. A real bug where delayed responses from account A could appear after switching to B was fixed; the live regression passed.
- Reports claim populated profile/preferences isolation in both directions, independent sessions, persistence, export ownership and unauthorized-operation denials. Revalidate against the latest evidence; do not blindly repeat already-passing registration or assume all protected-record cases are covered.
- A password-recovery UI and managed recovery link/code verification, URL cleanup and session safeguards were implemented. The hosted recovery redirect was configured and minimum password length was raised to 12.
- Supabase rejected hosted custom recovery-template installation with HTTP 400 because the project requires custom SMTP for that capability. The local template `supabase/templates/recovery.html` is **not automatically installed** into the hosted service.
- Actual receipt of a recovery email and successful end-to-end password reset remain unverified. A read-only preflight found no real recovery artifact; no password was changed. The helper `scripts/set-staging-recovery-input.ps1` exists or was reported to exist; inspect it before using it.
- Account B is registered. **Sign in to B; do not blindly sign it up again.**
- SMS/Twilio was not configured because the user cannot pay for SMS. Do not upgrade Twilio or purchase message credits. Phone verification and academic approval must not be faked or bypassed.
- Scholarly integration, private image processing/storage, protected-record positive fixtures, approved-member workflows, delivered recovery, and operational recovery remain open or partially verified.
- A previous report mentioned 28 platform warnings while npm's dependency audit reported zero vulnerabilities. Treat platform/database advisors and dependency advisories as different categories; inspect their actual current status.

The facts above summarize prior evidence. The actual source, current Supabase state, reports, logs and test outputs are authoritative. If they differ, record the discrepancy and use current verified evidence.

---

## 2. Absolute constraints

### 2.1 Zero-cost only

Use only solutions that can actually be operated for **zero money** with the resources available to this project. Do not use paid APIs, paid AI endpoints, subscriptions, paid trials, SMS credits, paid cloud upgrades, or services that silently transition to billing. Do not create billable resources or add a credit card to unlock a capability.

For every external service you consider, check current official documentation and verify:
- the actual free allowance and whether it is available to this account/region;
- whether signup requires payment details or a trial;
- quotas, inactivity pauses, domain verification and operational limits;
- whether the planned use complies with the service's terms;
- whether an existing free resource can do the job.

A free-tier label is not proof of zero cost. If a solution may incur charges, do not activate it. Prefer existing Supabase Free capabilities, public scholarly APIs with permitted free use, open-source software, local testing, and already available infrastructure.

### 2.2 Never compromise security for a green test

Never:
- weaken or bypass RLS, database grants, RPC authorization, JWT verification, member checks, or role checks;
- fabricate phone verification, academic approval, institutional review, staff roles, OTP delivery, successful email delivery, image uploads, or password reset completion;
- create identities using an administrative API to evade normal signup;
- use account A's credentials for B or leak secrets into logs, reports, screenshots, code, shell history or chat;
- put service-role credentials, processor tokens, SMTP secrets, refresh tokens, OTPs, or passwords in the frontend or public environment variables;
- expose academic records, private profile fields, private project objects, test users' personal information, or real research/patient data;
- run remote database resets, broad destructive SQL, or unreviewed schema mutations;
- publish the frontend or claim production readiness without explicit authorization and completed release gates.

Use only `ibxubsegrabpspopdgep` for authorized staging operations. Before any remote change, verify the project reference, inspect the action and understand its possible impact. Preserve user work and existing files.

### 2.3 Evidence honesty

Separate these categories in all reports:
- **Live staging verified** — actual request or operation executed against the named Supabase project.
- **Local verified** — local unit, browser, PGlite/PostgreSQL-kernel, static analysis, or build checks.
- **Mock/demo only** — synthetic adapter or fixture behavior.
- **Implemented but unverified** — code exists but real service behavior has not been tested.
- **Blocked by external configuration** — missing credential, email artifact, approved member, processor host, or other prerequisite.
- **Not implemented** — missing capability.

Do not count a blank/empty query as proof of privacy if the test data is not populated. Do not count a denied operation as a pass unless denial is the expected policy behavior. Do not report an API success as proof that an email arrived. Do not print raw error objects that may contain URLs, identity values, or secrets; record sanitized status codes and allowlisted error codes.

---

## 3. Initial audit — study the actual directory

Before making changes:

1. Confirm the actual working directory and shell/OS, Node/npm versions, package manager, lockfile and tool availability. Avoid installing unnecessary tools.
2. Inspect Git status if a repository exists. Preserve uncommitted changes and untracked user files. Do not reset, clean, stash over, or delete work. If no Git repository exists, note that fact and consider creating a local safety checkpoint only if doing so is safe and useful; do not commit or push without authorization.
3. Read the existing product specification and all current relevant reports, including where present:
   - `MASTER_IMPLEMENTATION_PROMPT.md`
   - `BIOCIRCUIT_SOCIAL_REDESIGN_SPEC.md`
   - `BIOCIRCUIT_VISUAL_ART_DIRECTION_PROMPT.md`
   - `BIOCIRCUIT_FINAL_AUTONOMOUS_COMPLETION_DIRECTIVE.md`
   - `docs/BUILD_REPORT.md`
   - `docs/IMPLEMENTATION_STATUS.md`
   - `docs/IMPLEMENTATION_AUDIT.md`
   - `docs/CLOUD_ACCEPTANCE_REPORT.md`
   - `docs/CLOUD_ACCEPTANCE_CHECKLIST.md`
   - `docs/RELEASE_READINESS.md`
   - `docs/PASSWORD_RECOVERY_ACCEPTANCE.md`
   - `docs/SETUP.md`, `docs/SECURITY.md`, `docs/OPERATIONS.md`
   - latest files in `docs/verification/cloud/` and latest screenshot/test evidence.
4. If a file does not exist, do not fabricate it. Find the latest equivalent report and record the missing file.
5. Read `package.json`, `.env.example`, Vite/TypeScript/lint/test configuration, frontend authentication and data gateways, database migrations, RLS tests, seed data, Edge Functions, storage/image scripts and all relevant staging test runners.
6. Do not print `.env` values, credential XML contents, Supabase tokens or passwords. Inspect only variable names and masked/presence information where needed.
7. Verify current Supabase CLI login and linked project identity. If authentication is unavailable, finish all local work and explain the single required local sign-in action; do not attempt to extract credentials.
8. Produce or update `docs/AUTONOMOUS_COMPLETION_PLAN.md` with a prioritized, evidence-based list of open requirements, dependencies, and acceptance criteria.
9. Continue implementation immediately. Do not wait for approval for routine engineering choices.

---

## 4. Autonomous operating loop

Repeat this loop until the defined goal is achieved or every remaining task has a real blocker:

**Inspect → prioritize → research free options → decide → implement → test → inspect result → fix → re-test → document → continue.**

For each work batch:
1. Choose the highest-risk/highest-value feasible requirement, not the easiest cosmetic task.
2. Use official documentation for current service behavior and compatibility.
3. Record a brief decision note when choosing a major library, provider, data model, or security approach.
4. Implement a minimal robust change in the existing architecture.
5. Run targeted tests, then the relevant full suite.
6. For UI work, use actual browser/screenshot review where available; do not claim visual inspection if no browser was used.
7. For backend work, execute against staging only when safe, authorized and non-destructive.
8. Fix demonstrated defects and re-run impacted tests.
9. Update the checklist, reports, and evidence.
10. Automatically move to the next available item. One blocker must never stop all remaining work.

Do not spend whole sessions creating plans and status documents without working on the product. Do not repeat passing test suites needlessly when focused tests are sufficient, but perform full regression checks before final assessment.

---

## 5. Priority A — password recovery, under the zero-cost rule

This is the most visible unresolved user-facing gate, but it must not consume the entire project if no free delivery path exists.

1. Inspect `supabase/templates/recovery.html`, the current recovery UI/code, redirect configuration, `scripts/set-staging-recovery-input.ps1`, the live test runner, and `docs/PASSWORD_RECOVERY_ACCEPTANCE.md`.
2. Determine what the last HTTP 400 actually means using the logged sanitized status and official current Supabase documentation. Remember: a local HTML template is not installed in hosted Supabase unless the supported hosted configuration succeeds.
3. Check whether the built-in hosted email path can send a recovery email to the existing controlled staging address. Do not interpret API success as delivery. Do not repeatedly send requests past provider limits.
4. Evaluate a suitable SMTP/provider alternative only if it is genuinely usable at zero cost with no required paid upgrade or hidden bill. Check its current free allowance, domain/sender verification requirements, region, rate limits, and whether the user already controls an eligible domain. Do not assume a provider can send from an unverified domain.
5. If no sender can securely deliver at zero cost, document the exact limitation and keep the recovery UI honest. Continue all independent tasks. Do not request passwords or tokens in chat.
6. If the user actually receives a recovery message, use the existing safe local helper to supply the real artifact without printing it. Inspect the helper before execution. Verify the actual reset page, valid token/code handling, invalid/expired/replayed artifact denial, URL cleanup, password update, session behavior, sign-in with the new password and denial of the old password. Do not change any password without an actual user-authorized recovery artifact.
7. Test request enumeration protections, cooldown/rate controls, token expiry, redirect allowlisting, and error messaging. Avoid leaking whether a particular email is registered.
8. Keep account passwords at the existing 12-character minimum (or stricter compatible policy) and do not weaken managed Auth settings to make a test pass.
9. If user action is needed to check an inbox or configure a sender, first finish other tasks. Then ask for exactly one safe, concrete action and continue with independent work.

---

## 6. Priority B — complete two-account persistence and privacy acceptance

Use accounts A and B created through ordinary signup and the existing local protected credential mechanism. B is already registered; resume/sign in, do not signup again blindly. Never output their emails/passwords or their user identifiers.

Inspect the current multi-account test runner and latest live report before execution. Validate that separate browser contexts use independent managed sessions; never copy A's stored session into B or use localStorage hacks to simulate identity.

Use minimal harmless fixture values and normal authorized workflows. Test at least:
- profile and preference changes survive refresh and a new session;
- account A can update and read only its own permitted fields;
- account B can update and read only its permitted fields;
- A cannot view or modify B's private profile, preferences, notifications, bookmarks, applications, marks, roles or restricted project data, and vice versa;
- sign out removes that context's session without signing out or contaminating the other context;
- direct table writes or RPCs that should be denied are denied by the actual server;
- a delayed response from A cannot appear after the UI has switched to B;
- exports contain only the requesting user's data;
- account deletion and storage-cleanup boundaries remain enforced.

If tables are empty, use allowed operations to create harmless test rows when permitted. Never insert privileged roles or approval flags merely to fill test fixtures. For workflows that require an approved member, use a real, properly approved test account only if one exists. Otherwise test the denied pending-user boundary and mark positive approved-member workflow blocked.

Preserve the existing regression test for the delayed-response privacy bug. Revalidate it whenever state management or the data gateway changes.

---

## 7. Priority C — membership, review, and role authorization

The platform is designed for people with biomedical-engineering education at graduation, postgraduate or doctoral level, including awaiting-result applicants. Eligibility review must remain distinct from phone ownership.

Inspect the membership state machine and test:
- submitted, needs-evidence, pending, approved, rejected, appeal, expired and suspended states that actually exist;
- private grades/marks and application documents cannot leak through profile, search, public snapshots or logs;
- a normal user cannot assign roles or set approval/phone flags;
- reviewer authority is limited to academic review; moderator authority is limited to moderation; administrator authority is explicitly scoped;
- suspended staff lose privileged access;
- reason recording, appeals, resubmission and audit history have appropriate access boundaries.

Do not falsely approve a real person. Do not alter the database to pretend SMS was confirmed. If no legitimate phone-verified approved test account exists, fully test negative access and the state transitions available to ordinary/pending users, then report positive approved-member paths as blocked by the missing legitimate fixture.

Do not enable credential uploads merely because the table/bucket exists. The reports say academic evidence/PDF upload, malware scanning and reviewer signed access were not implemented. Either implement an actually safe, zero-cost validation and access design, or keep uploads disabled with an honest explanation.

---

## 8. Priority D — scholarly sources and search

Audit the current Crossref/PubMed functions, frontend data adapter, provider budgets, caching, error handling and current logs. Verify current API behavior against official documentation.

- Use source endpoints that provide permitted free access; respect source terms and request budgets.
- Ensure identifier and input bounds, server-side timeouts, rate budgets, caching, pagination and generic errors.
- Preserve authorship, title, venue, publication date/year, DOI/PMID, canonical source link, retrieval time and source attribution.
- Do not fabricate articles, metadata, full-text availability, retraction status, citations, or live integration status.
- Test successful responses, empty results, malformed requests, upstream timeouts/errors, pagination and cache behavior against live sources if accessible.
- Keep any provider contact email/secrets server-side. Do not print query values if they could contain sensitive material.
- Treat OpenAlex, embeddings and generated summaries as optional, not requirements to install more dependencies. Adopt them only if the zero-cost and evidence-based case is strong.

If network requests or account configuration are blocked, complete local tests and robust error/empty states, record live verification as blocked, and continue.

---

## 9. Priority E — private images, storage, and processing

Review the actual `avatar` and `project-images` Edge Functions, storage policies, migrations, included Sharp processor, configuration and cleanup worker.

Verify, within free existing resources:
- image decode/re-encode rather than trusting extension/MIME claims;
- size, decoded pixel count, dimensions, concurrency and request bounds;
- metadata stripping where appropriate;
- private object paths and storage permissions;
- upload authorization for a currently approved/active project member;
- server-side commit-time membership checks to prevent race conditions;
- temporary read URLs with short expiry and fresh authorization;
- removal, replacement, tombstone processing and bounded cleanup;
- cross-project and cross-account read/write denial.

Do not assume the existing Node/Sharp processor is hosted just because the code exists. Check real configuration and live connectivity. Find a genuinely free compatible hosting option only if it can run the required workload reliably at no cost. Do not use a serverless runtime incompatible with Sharp or a free trial that later bills.

If no safe free host exists, keep uploads disabled/unavailable, retain all privacy guards and report the concrete blocker. Do not fall back to public buckets or unscanned PDFs.

---

## 10. Priority F — account lifecycle, recovery, and operational controls

Inspect current account export, deletion, phone change, session revocation, retention pruning, storage-cleanup worker, runbooks and current operational schedules.

- Verify export is scoped to the authenticated user and does not include another account's data.
- Do not execute irreversible account deletion on A or B during routine testing. Test the guard/preflight and deletion behavior on an explicitly disposable test identity only when authorized and safe; otherwise document it as unverified.
- Confirm project ownership-transfer rules before any account deletion.
- Verify retention rules and what data can/cannot be pruned without harming audit/integrity requirements.
- Check whether storage cleanup and retained-data pruning have an actual free scheduler available. A script alone is not a schedule.
- Investigate the free platform's backup/export/restore options and execute a non-destructive restore rehearsal where genuinely available.
- If backups/scheduled jobs require a paid plan, do not upgrade. Document the safest available manual zero-cost process and the residual availability risk.
- Redact logs and do not include private payloads in evidence.

---

## 11. Priority G — dependency and platform warnings

The reports previously noted that npm audit found zero vulnerabilities while 28 platform warnings remained. Do not conflate these results.

1. Retrieve the actual current warning list from the relevant local check or Supabase advisor view available to the project.
2. Group each warning by category: security, performance, schema, configuration, expected free-plan limitation, or false positive/accepted trade-off.
3. For each security-relevant warning, understand exploitability and the current recommended fix using official documentation.
4. Apply only safe, compatible changes within the existing architecture. Review migration effects before any staging changes.
5. Rerun SQL/RLS assertions, live permission tests, relevant builds and browser tests after fixes.
6. Do not blindly change every setting or disable an advisor to make the count zero.
7. Record warnings that must remain, their risks, evidence and remediation options.

For dependency advisories, inspect the lockfile and actual audit output. Upgrade only compatible affected packages, avoid unnecessary major-version jumps, and verify the complete suite after fixes. Do not claim a clean audit without running the command.

---

## 12. Product features and UX regression protection

Preserve the intended BioCircuit product: a community exclusively intended for the biomedical engineering academic community, research-centric feed, questions and accepted answers, project logs/collaboration, journal discovery, member profiles, notifications, points/reputation, privacy, trust/moderation and responsive UI.

Check all major pages and visible controls for actual behavior, including loading, offline, empty, error and denied states. No dead buttons or fake success notifications. Keep synthetic demonstration content isolated from connected production/staging mode. Do not invent live posts, member counts, journals or statistics.

Do not replace the social-first vertical layout with horizontal page navigation. Keep the visual art direction, keyboard behavior, mobile bottom navigation and reduced-motion support. Fix only demonstrated defects. If browser tools are available, inspect desktop and mobile pages/screenshots and console output. If unavailable, say so explicitly rather than claiming visual inspection.

---

## 13. Testing requirements

Inspect `package.json` to determine the real available commands; do not assume scripts exist. Run relevant checks incrementally and then perform the comprehensive local regression suite before final assessment.

Use whichever applicable scripts exist for:
- install/lockfile consistency;
- formatting, lint and TypeScript;
- unit/component tests;
- database tests and RLS/policy checks;
- Edge Function type checks and HTTP tests;
- browser and accessibility tests;
- connected staging acceptance;
- dependency audit, bundle/config checks;
- production build;
- scholarly adapter and image-processor tests;
- operational/cleanup checks.

For live tests, record only sanitized status codes, pass/fail, and safe observations. Preserve existing reports and timestamped evidence; do not overwrite failure evidence to make the latest report look clean. Keep secrets out of screenshots.

A check must be described as live only if it actually used the hosted service. A local PGlite/database-kernel test is not the same as testing deployed Supabase/PostgREST/Storage. A demo Playwright test is not a connected test. A successful reset-request API response is not proof of email receipt.

---

## 14. Documentation and autonomous status management

Keep these existing reports current (use their actual paths if different):
- `docs/CLOUD_ACCEPTANCE_REPORT.md`
- `docs/CLOUD_ACCEPTANCE_CHECKLIST.md`
- `docs/RELEASE_READINESS.md`
- `docs/PASSWORD_RECOVERY_ACCEPTANCE.md`

Create/update:
- `docs/AUTONOMOUS_COMPLETION_PLAN.md` — prioritized tasks, dependencies, decisions and progress.
- `docs/AUTONOMOUS_COMPLETION_REPORT.md` — final end-to-end implementation and verification report.

For each important requirement, include:
- current status;
- exact files changed;
- the command/test actually run;
- evidence or a sanitized result reference;
- whether it is local, demo or live staging;
- known caveats, risks and blockers;
- whether it can be resolved at zero cost.

Use honest states: `COMPLETE AND LIVE-VERIFIED`, `COMPLETE AND LOCALLY VERIFIED`, `IMPLEMENTED BUT LIVE-UNVERIFIED`, `PARTIAL`, `BLOCKED BY EXTERNAL CONFIGURATION`, `DEFERRED FOR SAFETY`, and `NOT IMPLEMENTED`.

Include architecture/security decisions and why chosen options are free and compatible. Never include passwords, raw recovery links, OTPs, session tokens, secret keys, user emails, personal IDs, marks or private content.

Also finish with a copy-pasteable report summarizing work performed, files created/modified, commands actually run and their results, defects found/fixed, decisions, remaining blockers, Git/branch status if available, and the next highest-value action. Do not commit or push unless asked.

---

## 15. Cost and change controls

Before using a service, package, host or API, verify it fits the strict zero-cost requirement. Avoid unnecessary services and keep all spend disabled.

Autonomous changes are permitted for local code and non-destructive tests against the verified staging project. Do not:
- publish or make the frontend publicly available;
- create a new cloud project;
- upgrade or activate paid services;
- run a staging reset;
- delete real accounts or private files;
- apply a risky/destructive migration;
- change domain/production configuration;
- set privileged roles or real approval flags.

For remote migrations or configuration changes, inspect the exact intended action and confirm the target identity first. Use dry-run/plan mechanisms when available. If an action is ambiguous or potentially destructive, stop that action while continuing other tasks.

---

## 16. Definition of done

This phase is complete only when all feasible tasks supported by existing free resources have been implemented, tested and documented. Production readiness is a separate decision and must not be claimed if SMS/phone identity, genuine academic review, reset-email delivery, protected approved-member workflows, private image integration, or recovery/operations remain mandatory but unverified.

Do not aim for zero warnings at the expense of safety; resolve material risks or explicitly accept and document them. Do not declare complete solely because local tests pass.

The final assessment must clearly answer:
1. What demonstrably works against the real staging service?
2. What has only been tested locally or in demo mode?
3. Can two actual accounts access only their own private data?
4. Which integration is still blocked and why?
5. Were all changes accomplished without spending money or enabling billing?
6. Is it safe to begin a controlled release? If not, name the exact remaining release gates.

---

## Final instruction

Start now. Study the current directory and latest reports, establish the actual state, and select the highest-value feasible unfinished task yourself. Research current official documentation where needed, choose the strongest genuinely free option, implement it, test it, fix the defects, and continue to the next task without waiting for another user prompt.

If password recovery cannot be completed because no suitable free sender is available, do not stop. Finish all independent security, persistence, scholarly, image, dependency, and operational tasks that can safely be completed. The user's goal is a fully working BioCircuit release candidate using strictly free resources; your responsibility is to achieve as much of that goal as is technically feasible without misrepresenting the limitations.
