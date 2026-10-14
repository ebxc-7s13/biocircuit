> Recovery update2026-10-13: [PASSWORD_RECOVERY_ACCEPTANCE.md](PASSWORD_RECOVERY_ACCEPTANCE.md) supersedes older sender/template instructions. Exact hosted redirect/minimum12 verified; local template not installed (new free/default-sender restriction); delivered reset remains blocked.76 unit/47 demo/four connected recovery viewports pass; no fake verification or paid resource.

> 2026-10-13 update: controlled B is now usable through ordinary managed Auth. Final focused two-user hosted run152 pass/0 fail/2 external blocks; a genuine late-response frontend privacy defect was fixed and the exact live race passed10 checks. Backend/schema/Edge/authorization/package files unchanged;58 unit/122 localSQL/3Edge/47 demo regression tests pass. See [CLOUD_ACCEPTANCE_REPORT.md](CLOUD_ACCEPTANCE_REPORT.md) and [RELEASE_READINESS.md](RELEASE_READINESS.md) for current scope. Earlier B-unavailable rows are history. Do not repeat signup; use `node scripts/test-staging-persistence.mjs --cross-user-only`. Production readiness and genuine protected/member/integration/recovery gates remain open.

# Zero-cost release decisions ? 2026-10-12

The strongest verified result is a **restricted staging candidate**, not a complete production release. Existing free-tier resources are the only cloud target. No new account, paid resource, card, trial, SMS credit, subscription, model endpoint or frontend publication was activated. Availability/quotas may change; review usage before extending tests. Actual organization billing/remaining quota was not independently inspected.

## Execution order and current acceptance

| Priority | Decision and implementation | Status |
| --- | --- | --- |
| 1 | Reuse ordinary account A; prove UI/database persistence and restore through allowed RPCs | COMPLETE within tested scope:47 live passes/0 failures/3 external blocks |
| 2 | Prepare distinct controlled B with Windows DPAPI, explicit ordinary signup, known populated private-profile/preference probes | Runner/helper implemented; BLOCKED on privately configured B |
| 3 | Add recovery through existing managed Auth, no custom OTP/session system | Implemented and locally/connected-UI checked; hosted request200; delivery/reset BLOCKED |
| 4 | Test permitted reads and protect member/staff boundaries | COMPLETE scoped negative matrix; authorized member/staff positives BLOCKED |
| 5 | Validate free scholarly sources and assess private processing | Public sources200; proxy/member gate, contacts and processor configuration BLOCKED |
| 6 | Regression/a11y/build/dependency/bundle checks |53 unit,122 stubbed SQL,3 Edge,47 demo browser,4 connected recovery viewports; lint/types/build/audit/format pass |
| 7 | Hosted backup/restore, cleanup/retention and release operations | Documentation/source protection only; live restore/schedules and destructive disposal UNVERIFIED |

No schema migration or Edge deployment was necessary. Social-first design and19 migrations/four handlers are preserved. Authorization denials are expected for this account; they cannot be repaired by inventing approval.

## Authentication/recovery

Keep Supabase Email/password for existing free staging. Managed session renewal and account export were tested. Email confirmation is disabled by the staging operator; this does not establish mailbox ownership. Production confirmation/anti-abuse and actual delivery remain release gates.

[Official Supabase SMTP guidance](https://supabase.com/docs/guides/auth/auth-smtp) limits the default sender to project-team addresses and2 messages/hour, with best-effort availability. A request200 does not demonstrate delivery. The current recovery page uses a code verified with managed `verifyOtp` type `recovery`; it does not consume URL credentials or enable password updates from a browser-local flag. [Official password recovery](https://supabase.com/docs/guides/auth/passwords), [email template variables](https://supabase.com/docs/guides/auth/auth-email-templates), [SDK verifyOtp](https://supabase.com/docs/reference/javascript/auth-verifyotp).

**Selected conditional free SMTP path:** Brevo Free,300 emails/day, no card or time limit according to [official plan documentation](https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans) and [free limits](https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan). It requires a privately configured account, authorized sender and transactional activation. [SMTP troubleshooting](https://help.brevo.com/hc/en-us/articles/115000188150-Troubleshooting-Issues-with-Brevo-SMTP) and [sender requirements](https://help.brevo.com/hc/en-us/articles/14925263522578-Comply-with-Gmail-Yahoo-and-Microsoft-s-requirements-for-email-senders) apply; unauthenticated/free-address senders may be replaced by a provider-compliant address. Do not buy a domain or plan for this task. If account activation asks for payment/card, stop and keep recovery safely unavailable; do not call it zero-cost. No account or deliverability assumption was fabricated.

Resend was considered but not configured: its free quota/domain requirements still require operator sender setup, and its pricing contains paid overage products. Do not enable metered add-ons or rely on trial credits. No additional email library is needed; managed Auth accepts SMTP settings directly.

Exact setup in the confirmed staging dashboard:

1. Authentication ? Email / SMTP: configure only an existing approved free SMTP account. Use provider-issued host/port/login/password in trusted dashboard fields, never frontend environment or chat. Turn off link/open tracking for security mail. Keep plan Free and caps; do not add a card or paid option.
2. Authentication ? Email templates ? Reset password: replace the recovery body with reviewed `supabase/templates/recovery.html` (uses managed `{{ .Token }}`). This has **not been applied remotely**. No generated OTPs are stored by the app.
3. Authentication ? URL configuration: keep Site URL `http://127.0.0.1:5190` and exact redirect `http://127.0.0.1:5190/account/recovery`; no wildcard/public frontend. Keep server expiry and verification rate limits restrictive.
4. Run the local connected site, open `/account/recovery`, request once for the controlled address, enter the actual received code privately and set a new unique password. Test expired/used codes and logout/login. Current evidence proves only request acceptance. Update that account's local DPAPI credential privately if its password changes.
5. If CAPTCHA is enabled, its server enforcement remains authoritative. The request currently fails generically until a required challenge is configured; no bypass. Add/support the provider challenge before claiming a CAPTCHA-enabled recovery journey works.

TOTP can be a free second factor but **cannot verify phone control or replace delivered recovery**. It was not added or represented as a phone/SMS alternative.

## Independent users and membership

Account B must use a different mailbox controlled by the operator. No address or alias is inferred. The helper protects the password with Windows DPAPI (same Windows user/machine); the local credential XML still contains a private email, and remains ignored.

~~~powershell
powershell -NoProfile -File scripts/set-staging-email-credentials.ps1 -Account B
# New controlled B only:
node scripts/test-staging-persistence.mjs --register-second-account
# B already exists:
node scripts/test-staging-persistence.mjs
~~~

The runner never turns failed registration into passing login. It never invokes Auth admin APIs or assigns roles/phone/academic flags. Populated applications/marks/private projects/images require legitimately verified users and authorized human review; empty reads do not prove those cases.

[Supabase phone sign-in](https://supabase.com/docs/guides/auth/phone-login) requires a supported real SMS provider. No sustainable suitable zero-cost delivery has been verified. Trial SMS, test numbers, invented timestamps, email OTPs and authenticator codes cannot satisfy phone ownership. Keep phone/member contribution gates unavailable until a genuinely authorized solution exists; no Twilio upgrade or credits. This constraint prevents full original member-positive release acceptance today.

## Scholarly discovery

Retain Crossref and PubMed, bounded database provider budgets/cache, attributed identifiers, official links and no full-text redistribution. [Crossref REST](https://www.crossref.org/documentation/retrieve-metadata/rest-api/) permits public metadata access without signup; [NCBI E-utilities](https://www.ncbi.nlm.nih.gov/books/NBK25501/) is the established provider reference. The NCBI usage-chapter browse attempt was blocked by its browser CAPTCHA; direct single-record API connectivity worked. No bypass, scrape or paid API used.

One direct request each returned200 with a real title and canonical identifier. This is independent upstream availability, **not** authenticated application search/cache acceptance. Application searches correctly remain member-gated, and CROSSREF_MAILTO/NCBI_EMAIL must be legitimate operator contacts before configured proxy acceptance. Do not reuse a private login email as a published service contact without authorization. NCBI_API_KEY is optional, not a paid prerequisite. No new overlapping search or AI/embedding dependency: the existing synthetic ranking evaluation reported Precision@10=1, median3.108ms,p95=48.537ms across20 local runs/1000 candidates; this is not human relevance or cloud latency.

## Private images: free alternative evaluated, not adopted

Existing Sharp is open-source/local; the server still needs stable authorized HTTPS reachability and a private processor token. Arbitrary free tunnels/sleeping hosts are not accepted as reliable release infrastructure. Private buckets/direct-upload denials/decode/re-encode/metadata stripping/short signed URLs remain intact. Actual missing-config upload503 was observed; no uploaded image success claimed.

[Official Edge image example](https://supabase.com/docs/guides/functions/examples/image-manipulation) supports WASM rather than native Sharp. Evaluated `@imagemagick/magick-wasm`0.0.44, Apache-2.0,32.36MB unpacked, through Deno isolated cache; no package.json/package-lock change. The generated exploratory lock and synthetic images/probes are retained under ignored `.cloud/image-evaluation/`. The current default module needs its matching `dist/x86/magick.wasm`; the documentation's generic artifact path was not compatible with this package version. An initial path/import mismatch was corrected locally and is not hosted evidence.

Uniform-color256/2048/3000 images:112/656/746ms local wall time. High-entropy9MP JPEG3202362 bytes: avatar1882ms/RSS126996480; project PNG5195ms/RSS163422208/output11477025 bytes. [Edge limits](https://supabase.com/docs/guides/functions/limits) specify256MB memory and2 seconds active CPU per request. Local wall time is not hosted CPU measurement, but the synchronous project path and oversized output do not support adoption under current requirements. No adversarial decoder/fuzz/hosted cold-start or lossless quality acceptance was completed. Keep current safe unavailable path; do not silently lower integrity/security or deploy an unverified library merely to avoid external hosting.

## Operations and zero-cost risk

[Supabase backup guidance](https://supabase.com/docs/guides/platform/backups) must be checked against the actual free plan. No PITR, paid backup add-on, new restore project or production mutation was enabled. Existing source recovery copies and encrypted own-test baselines are **not full hosted data/Auth/Storage recovery**. A safe encrypted logical export and independent local restore require trusted database connection tools/credentials; no remote reset is permitted. Storage bytes require separate backup, not just metadata rows. Retention/cleanup schedules, staff review, manual assistive-technology/physical touch tests and Advisor warnings remain operational gates.

No genuine cross-user, member-positive, delivered reset, storage lifecycle or hosted restore success can be claimed until these external gates are met. See CLOUD_ACCEPTANCE_REPORT.md and RELEASE_READINESS.md for exact executed checks and limitations.
