import assert from 'node:assert/strict'
import { spawn, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createServer } from 'node:net'
import { access, mkdir, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { createClient } from '@supabase/supabase-js'
import { loadEnv } from 'vite'
import { readTarget, assertPublicKey } from './cloud-target.mjs'

// Explicit real staging account acceptance. No phone/academic flags, roles,
// paid service, fake credentials, Auth admin APIs, or account deletion.
const resumeExistingAccount = process.argv.includes('--resume-existing-account')
// Verified live readiness uses content + completed core APIs, not global quiet.
// Keep the previous wait available only for deliberate diagnostic reproduction.
const routeReadyWait = !process.argv.includes('--diagnose-networkidle')
assert.ok(
  process.argv
    .slice(2)
    .every((arg) =>
      [
        '--resume-existing-account',
        '--route-ready-wait',
        '--diagnose-networkidle',
      ].includes(arg),
    ),
  'Unknown test mode',
)
const runStamp = new Date()
  .toISOString()
  .replaceAll(':', '-')
  .replaceAll('.', '-')
let currentRoute = null
let currentStep = 'verify-hosted-settings'
let sessionBeforeNavigation = null
let sessionAfterNavigation = null
let expectedRouteContent = null
let page
let readSession
const routeResponses = []
const browserDiagnostics = {
  uncaughtErrors: 0,
  consoleErrors: 0,
  exceptionClasses: [],
  signupRequests: 0,
}
const safeErrorCode = (code) =>
  [
    'ERR_ASSERTION',
    'EADDRINUSE',
    'ECONNREFUSED',
    '42501',
    'P0001',
    'PGRST202',
    'PGRST106',
    'invalid_credentials',
    'user_already_exists',
    'weak_password',
    'captcha_failed',
    'over_request_rate_limit',
    'over_email_send_rate_limit',
  ].includes(code)
    ? code
    : null
const target = await readTarget()
assert.equal(target.projectRef, 'ibxubsegrabpspopdgep')
const env = loadEnv('development', process.cwd(), '')
assert.equal(env.VITE_APP_MODE, 'connected')
assert.equal(env.VITE_SUPABASE_URL, target.url)
assertPublicKey(env.VITE_SUPABASE_PUBLISHABLE_KEY)
const report = {
  projectRef: target.projectRef,
  scope:
    'Actual email UI/Auth/current-user API acceptance; no phone verification, academic approval, privileged roles or deletion.',
  mode: resumeExistingAccount ? 'resume-existing-account' : 'registration',
  waitStrategy: routeReadyWait
    ? 'route-content-and-api'
    : 'networkidle-diagnostic',
  originalEvidence: 'email-auth-live-initial-registration-failure.json',
  navigation: [],
  records: [],
  browser: {},
}
const record = (name, pass, observed = {}) => {
  if (Object.hasOwn(observed, 'code'))
    observed = { ...observed, code: safeErrorCode(observed.code) }
  report.records.push({
    name,
    status: pass ? 'PASS - LIVE VERIFIED' : 'FAIL - REPAIR REQUIRED',
    observed,
  })
}
const reportFile = `docs/verification/cloud/email-auth-diagnostic-${runStamp}.json`
await mkdir('docs/verification/cloud', { recursive: true })
const settingsResponse = await fetch(target.url + '/auth/v1/settings', {
  headers: { apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY },
  signal: AbortSignal.timeout(15000),
})
const settings = await settingsResponse.json()
record(
  'Actual Email provider enabled, confirmation disabled; phone remains disabled/unconfirmed',
  settingsResponse.ok &&
    settings.external?.email === true &&
    settings.mailer_autoconfirm === true &&
    settings.external?.phone === false &&
    settings.phone_autoconfirm === false,
  {
    status: settingsResponse.status,
    emailEnabled: settings.external?.email,
    emailAutoconfirm: settings.mailer_autoconfirm,
    phoneEnabled: settings.external?.phone,
    phoneAutoconfirm: settings.phone_autoconfirm,
  },
)
const credentialFile = '.cloud/email-staging-credentials.xml'
if (report.records.some((r) => r.status.startsWith('FAIL'))) {
  await writeFile(reportFile, JSON.stringify(report, null, 2) + '\n')
  console.log(
    'Hosted settings did not match the approved email staging flow. No account created.',
  )
  process.exit(1)
}
try {
  await access(credentialFile)
} catch {
  report.records.push({
    name: 'Controlled email and unique password for actual registration',
    status: 'BLOCKED - USER CONFIGURATION',
    observed: {
      action:
        'Run scripts/set-staging-email-credentials.ps1 privately in your local PowerShell; no account created by this blocked run.',
    },
  })
  await writeFile(reportFile, JSON.stringify(report, null, 2) + '\n')
  console.log(
    'Hosted email settings verified. Real account/browser acceptance BLOCKED: enter controlled-email credentials privately using scripts/set-staging-email-credentials.ps1. No credentials logged and no account created.',
  )
  process.exit(2)
}
let credentials
try {
  // DPAPI credentials intentionally supplied by this Windows user. Capture only
  // into this process memory; never inherit stdout, log values, or write plaintext.
  const { stdout } = await promisify(execFile)(
    'powershell.exe',
    [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      "$c = Import-Clixml -LiteralPath '.cloud/email-staging-credentials.xml'; @{email=$c.UserName;password=$c.GetNetworkCredential().Password} | ConvertTo-Json -Compress",
    ],
    { windowsHide: true, maxBuffer: 4096 },
  )
  credentials = JSON.parse(stdout)
  assert.ok(credentials.email && credentials.password?.length >= 12)
} catch {
  throw Error(
    'Private local credentials could not be read. No secret output is permitted.',
  )
}
const client = createClient(target.url, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})
assert.equal(new URL(target.frontendOrigin).hostname, '127.0.0.1')
const reservation = createServer()
await new Promise((resolve, reject) => {
  reservation.once('error', reject)
  reservation.listen(
    Number(new URL(target.frontendOrigin).port),
    '127.0.0.1',
    resolve,
  )
})
await new Promise((resolve) => reservation.close(resolve))
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    new URL(target.frontendOrigin).port,
    '--strictPort',
  ],
  {
    windowsHide: true,
    stdio: 'ignore',
    env: { ...process.env, VITE_APP_MODE: 'connected' },
  },
)
let browser
let stage = 'Local connected server startup'
currentStep = 'start-local-server'
try {
  let ready = false
  for (let n = 0; n < 100; n++) {
    if (server.exitCode !== null) throw Error('Local server failed')
    try {
      if ((await fetch(target.frontendOrigin)).ok) {
        ready = true
        break
      }
    } catch {
      /* Startup */
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  assert.ok(ready)
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  page = await context.newPage()
  let uncaughtErrors = 0
  let consoleErrors = 0
  const responses = {}
  page.on('pageerror', (error) => {
    uncaughtErrors++
    browserDiagnostics.uncaughtErrors++
    browserDiagnostics.exceptionClasses.push(
      ['TypeError', 'Error', 'ReferenceError', 'RangeError'].includes(
        error.name,
      )
        ? error.name
        : 'Error',
    )
  })
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/auth/v1/signup')
      browserDiagnostics.signupRequests++
  })
  page.on('console', (m) => {
    if (m.type() === 'error') {
      consoleErrors++
      browserDiagnostics.consoleErrors++
    }
  })
  page.on('response', (r) => {
    const u = new URL(r.url())
    if (u.hostname === new URL(target.url).hostname) {
      const knownPath =
        /^\/(?:auth\/v1\/(?:token|signup|user|logout)|functions\/v1\/(?:avatar|scholarly-search|project-images|account-delete)|rest\/v1\/(?:rpc\/[a-z_]+|[a-z_]+))$/.test(
          u.pathname,
        )
          ? u.pathname
          : 'other-staging-request'
      const label = knownPath + ' ' + r.status()
      routeResponses.push({ path: knownPath, status: r.status() })
      responses[label] = (responses[label] ?? 0) + 1
    }
  })
  currentRoute = '/feed'
  currentStep = 'open-account-dialog'
  await page.goto(target.frontendOrigin + currentRoute, {
    waitUntil: 'domcontentloaded',
  })
  await page
    .getByRole('button', { name: 'Account & eligibility', exact: true })
    .click()
  const modal = page.getByRole('dialog')
  if (!resumeExistingAccount)
    await modal
      .getByRole('button', { name: 'New here? Create an account' })
      .click()
  stage = resumeExistingAccount
    ? 'Existing-account UI sign-in'
    : 'Actual registration through the connected UI'
  currentStep = resumeExistingAccount
    ? 'ui-sign-in-existing-account'
    : 'ui-register-new-account'
  await modal
    .getByLabel('Email address', { exact: true })
    .fill(credentials.email)
  await modal.getByLabel('Password', { exact: true }).fill(credentials.password)
  const authPath = resumeExistingAccount ? '/auth/v1/token' : '/auth/v1/signup'
  const authResponse = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === authPath && r.request().method() === 'POST',
  )
  await modal
    .getByRole('button', {
      name: resumeExistingAccount ? 'Sign in with email' : 'Create account',
      exact: true,
    })
    .click()
  const registration = await authResponse
  if (!registration.ok()) {
    const body = await registration.json()
    record(
      resumeExistingAccount
        ? 'Existing-account UI sign-in returns a session'
        : 'Registration returned a new authenticated session',
      false,
      {
        status: registration.status(),
        code: safeErrorCode(body.code ?? body.error_code),
      },
    )
    throw Error('Managed Auth refused the request')
  }
  currentStep = 'wait-for-signed-in-unverified-phone-notice'
  await modal
    .getByText('Signed in; phone verification still required.', { exact: true })
    .waitFor()
  readSession = () =>
    page.evaluate(() => {
      const key = Object.keys(localStorage).find((k) =>
        /^sb-.+-auth-token$/.test(k),
      )
      if (!key) return null
      const s = JSON.parse(localStorage.getItem(key))
      return { access_token: s.access_token, refresh_token: s.refresh_token }
    })
  const session = await readSession()
  assert.ok(session?.access_token && session?.refresh_token)
  record(
    resumeExistingAccount
      ? 'Existing-account UI sign-in returns an actual managed session'
      : 'Registration returns an actual managed session with confirmation disabled',
    true,
    { status: registration.status(), sessionPresent: true },
  )
  currentStep = 'verify-managed-user-and-session'
  const established = await client.auth.setSession(session)
  assert.equal(established.error, null)
  const user = await client.auth.getUser()
  assert.equal(user.error, null)
  const uid = user.data.user.id
  record(
    'Email session has no phone or phone-confirmed timestamp',
    !user.data.user.phone && !user.data.user.phone_confirmed_at,
    {
      phonePresent: !!user.data.user.phone,
      phoneConfirmed: !!user.data.user.phone_confirmed_at,
    },
  )
  const initial = await client
    .from('profiles')
    .select('phone_verified,membership,suspended')
    .eq('id', uid)
    .single()
  currentStep = 'assert-own-profile-unverified-and-not-approved'
  record(
    'Actual trigger-created profile has no phone verification/academic approval/suspension',
    !initial.error &&
      initial.data.phone_verified === false &&
      initial.data.membership === 'not_submitted' &&
      initial.data.suspended === false,
    {
      status: initial.status,
      phoneVerified: initial.data?.phone_verified,
      membership: initial.data?.membership,
      suspended: initial.data?.suspended,
    },
  )
  currentStep = 'verify-own-staff-role-count'
  const roles = await client.from('roles').select('role').eq('user_id', uid)
  record(
    'No staff roles were assigned',
    !roles.error && roles.data.length === 0,
    { status: roles.status, roleCount: roles.data?.length },
  )
  currentStep = 'inspect-own-avatar-row-without-recording-identifiers'
  const avatar = await client
    .from('avatars')
    .select('user_id')
    .eq('user_id', uid)
    .maybeSingle()
  record(
    'Own avatar metadata lookup succeeds; missing image is an empty state',
    !avatar.error,
    {
      status: avatar.status,
      hasAvatar: !!avatar.data,
      code: safeErrorCode(avatar.error?.code),
    },
  )
  await modal.getByRole('button', { name: 'Close dialog' }).click()
  stage = 'Reload/session restoration and signed-in routes'
  const expectedContent = (route) => {
    const main = page.getByRole('main')
    if (route === '/profile')
      return main.getByText('Your research identity', { exact: true })
    const headings = {
      '/saved': /Your saved research/,
      '/notifications': /^Notifications/,
      '/settings': /Make it yours/,
      '/trust': /Trust/,
    }
    return headings[route]
      ? main.getByRole('heading', { level: 1, name: headings[route] })
      : main.getByRole('heading', { level: 1 }).first()
  }
  const observeSession = async () => !!(await readSession())?.access_token
  const captureRoute = async () => {
    sessionAfterNavigation = await observeSession().catch(() => null)
    expectedRouteContent = await expectedContent(currentRoute)
      .isVisible()
      .catch(() => false)
    return {
      route: currentRoute,
      step: currentStep,
      sessionBeforeNavigation,
      sessionAfterNavigation,
      expectedRouteContent,
      http: [...routeResponses],
    }
  }
  const visit = async (route, refresh = false) => {
    currentRoute = route
    currentStep = refresh ? 'before-direct-refresh' : 'before-route-navigation'
    sessionBeforeNavigation = await observeSession()
    sessionAfterNavigation = null
    expectedRouteContent = null
    routeResponses.length = 0
    assert.equal(sessionBeforeNavigation, true)
    currentStep = refresh
      ? 'direct-refresh-domcontentloaded'
      : 'navigate-domcontentloaded'
    if (refresh)
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 })
    else
      await page.goto(target.frontendOrigin + route, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      })
    currentStep = routeReadyWait
      ? 'wait-for-route-content-and-core-api'
      : 'wait-for-networkidle'
    if (routeReadyWait) {
      await expectedContent(route).waitFor({ state: 'visible', timeout: 15000 })
      await page.waitForFunction(
        () => !document.querySelector('#main .skeleton'),
        null,
        { timeout: 15000 },
      )
      const core = [
        '/rest/v1/rpc/community_snapshot',
        '/rest/v1/rpc/recommended_page',
        '/rest/v1/rpc/trust_metadata',
        '/rest/v1/milestone_confirmations',
        '/auth/v1/user',
      ]
      const deadline = Date.now() + 15000
      while (
        !core.every((path) =>
          routeResponses.some((r) => r.path === path && r.status === 200),
        ) &&
        Date.now() < deadline
      )
        await new Promise((r) => setTimeout(r, 100))
      assert.ok(
        core.every((path) =>
          routeResponses.some((r) => r.path === path && r.status === 200),
        ),
      )
    } else await page.waitForLoadState('networkidle', { timeout: 15000 })
    currentStep = 'assert-session-route-content-and-api'
    const observation = await captureRoute()
    currentStep = 'assert-session-present-after-navigation'
    assert.equal(observation.sessionAfterNavigation, true)
    currentStep = 'assert-expected-route-content-visible'
    assert.equal(observation.expectedRouteContent, true)
    if (route === '/profile') {
      currentStep =
        'assert-unverified-phone-and-unsubmitted-academic-profile-labels'
      assert.equal(
        await page
          .getByText('Phone: not verified', { exact: true })
          .isVisible(),
        true,
      )
      assert.equal(
        await page
          .getByText('Academic: not_submitted', { exact: true })
          .isVisible(),
        true,
      )
    }
    if (route === '/trust') {
      currentStep = 'assert-trust-screen-denies-unstaffed-account'
      assert.equal(
        await page
          .getByText(/Access denied\. A server-assigned reviewer/)
          .isVisible(),
        true,
      )
    }
    currentStep = 'assert-actual-route-path'
    assert.equal(new URL(page.url()).pathname, route)
    currentStep = 'assert-no-community-load-error'
    assert.equal(
      await page
        .getByText('Community data could not be loaded.', { exact: false })
        .count(),
      0,
    )
    currentStep = 'assert-successful-community-snapshot-response'
    assert.ok(
      routeResponses.some(
        (r) => r.path === '/rest/v1/rpc/community_snapshot' && r.status === 200,
      ),
    )
    currentStep = 'assert-no-core-api-permission-or-server-error'
    assert.ok(
      !routeResponses.some(
        (r) => r.path.startsWith('/rest/v1/') && r.status >= 400,
      ),
    )
    currentStep = 'verify-restored-session-with-managed-auth'
    const verifiedUser = await client.auth.getUser(
      (await readSession()).access_token,
    )
    assert.equal(verifiedUser.error, null)
    currentStep = 'assert-restored-session-is-same-account'
    assert.equal(verifiedUser.data.user.id, uid)
    report.navigation.push(observation)
    record(
      refresh
        ? 'Actual direct refresh restores verified session: ' + route
        : 'Connected authenticated route/session: ' + route,
      true,
      observation,
    )
  }
  const routes = resumeExistingAccount
    ? ['/profile', '/saved', '/notifications', '/settings', '/trust']
    : [
        '/feed',
        '/explore',
        '/questions',
        '/projects',
        '/journal',
        '/collaborators',
        '/profile',
        '/saved',
        '/notifications',
        '/settings',
        '/trust',
      ]
  for (const route of routes) await visit(route)
  await visit('/profile')
  await visit('/profile', true)
  if (!resumeExistingAccount) {
    stage =
      'Permitted own-profile and preferences persistence; denied member/staff operations'
    const profilePayload = {
      name: 'Staging email test',
      handle: 'email_' + uid.replaceAll('-', '').slice(0, 14),
      institution: '',
      degree: '',
      bio: 'Dedicated nonclinical staging authentication test.',
      methods: '',
      equipment: '',
      interests: [],
      available: false,
      visibility: 'private',
    }
    const action = (type, payload) =>
      client.rpc('community_action', {
        action_type: type,
        payload,
        request_id: randomUUID(),
      })
    const saved = await action('profile', profilePayload)
    const own = await client
      .from('profiles')
      .select('name,handle,visibility,phone_verified,membership')
      .eq('id', uid)
      .single()
    record(
      'Permitted own-profile update persists and preserves verification flags',
      !saved.error &&
        !own.error &&
        own.data.handle === profilePayload.handle &&
        own.data.visibility === 'private' &&
        !own.data.phone_verified &&
        own.data.membership === 'not_submitted',
      {
        status: saved.status,
        phoneVerified: own.data?.phone_verified,
        membership: own.data?.membership,
      },
    )
    for (const [name, args] of [
      ['community_snapshot', { before_cursor: null }],
      ['recommended_page', { before_time: null, before_id: null }],
      ['trust_metadata', {}],
    ]) {
      const r = await client.rpc(name, args)
      record('Permitted authenticated retrieval: ' + name, !r.error, {
        status: r.status,
        code: r.error?.code ?? null,
      })
    }
    for (const [type, payload] of [
      ['preferences', { interests: [], muted: [], in_app: true }],
      ['read_notifications', {}],
    ]) {
      const r = await action(type, payload)
      record('Permitted own operation: ' + type, !r.error, {
        status: r.status,
        code: r.error?.code ?? null,
      })
    }
    for (const table of [
      'notifications',
      'bookmarks',
      'membership_applications',
      'preferences',
      'roles',
    ]) {
      const ownerColumn = 'user_id'
      const r = await client
        .from(table)
        .select('*')
        .neq(ownerColumn, uid)
        .limit(1)
      record(
        'Other-user private-row query returns no rows: ' + table,
        !r.error && r.data.length === 0,
        { status: r.status, rows: r.data?.length },
      )
    }
    report.crossAccountScope =
      'Real current-user RLS requests with neq(current UID); no second controlled private account exists, so populated two-user isolation remains BLOCKED.'
    for (const [type, payload] of [
      [
        'application',
        {
          institution: 'Staging test only',
          degree: 'B.Tech / BE',
          discipline: 'Biomedical Engineering',
          result_status: 'completed',
          year: 2026,
          private_marks: '',
        },
      ],
      ['post', {}],
      ['comment', { post_id: randomUUID() }],
      ['reaction', { post_id: randomUUID() }],
      ['bookmark', { post_id: randomUUID() }],
      ['project', {}],
      ['review', {}],
      ['suspend', { target_id: uid, suspended: false }],
      ['moderate', {}],
    ]) {
      const r = await action(type, payload)
      record(
        'Phone-unverified/nonmember/staff mutation denied: ' + type,
        r.error?.code === '42501',
        { status: r.status, code: r.error?.code ?? null },
      )
    }
    for (const name of ['storage_cleanup_batch', 'prune_retained_data']) {
      const r = await client.rpc(name)
      record(
        'Privileged service RPC denied: ' + name,
        r.error?.code === '42501',
        { status: r.status, code: r.error?.code ?? null },
      )
    }
    const escalation = await client
      .from('profiles')
      .update({ phone_verified: true, membership: 'approved' })
      .eq('id', uid)
    record(
      'Direct phone/academic flag escalation denied',
      escalation.error?.code === '42501',
      { status: escalation.status, code: escalation.error?.code ?? null },
    )
    const exported = await client.rpc('export_personal_data')
    record(
      'Current-user account export available without printing private payload',
      !exported.error,
      { status: exported.status, code: exported.error?.code ?? null },
    )
  }
  stage = 'Actual logout and UI sign-in again'
  await visit('/settings')
  currentStep = 'click-ui-logout'
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await page.waitForFunction(
    () => !Object.keys(localStorage).some((k) => /^sb-.+-auth-token$/.test(k)),
  )
  currentStep = 'assert-session-absent-after-ui-logout'
  sessionAfterNavigation = await observeSession()
  record(
    'UI logout removes the actual persisted session',
    !sessionAfterNavigation,
    { currentRoute, currentStep, sessionAfterNavigation },
  )
  currentStep = 'verify-logout-after-refresh'
  await page.reload({ waitUntil: 'domcontentloaded' })
  assert.equal(await observeSession(), false)
  record('Direct refresh after logout does not restore the session', true, {
    currentRoute,
    currentStep,
    sessionAfterNavigation: false,
  })
  currentStep = 'open-ui-relogin-form'
  await page
    .getByRole('button', { name: 'Account & eligibility', exact: true })
    .click()
  await modal
    .getByLabel('Email address', { exact: true })
    .fill(credentials.email)
  await modal.getByLabel('Password', { exact: true }).fill(credentials.password)
  currentStep = 'submit-ui-relogin-and-wait-for-actual-account'
  await modal.getByRole('button', { name: 'Sign in with email' }).click()
  await modal
    .getByText('Signed in; phone verification still required.', { exact: true })
    .waitFor()
  record(
    'Actual password UI sign-in succeeds after logout',
    !!(await readSession()),
  )
  currentStep = 'verify-ui-relogin-managed-user'
  const relogin = await client.auth.getUser((await readSession()).access_token)
  assert.equal(relogin.error, null)
  assert.equal(relogin.data.user.id, uid)
  await modal.getByRole('button', { name: 'Close dialog' }).click()
  await visit('/settings', true)
  if (!resumeExistingAccount) {
    stage = 'Sensitive-free screenshot/accessibility checks'
    await page
      .getByRole('button', { name: 'Account & eligibility', exact: true })
      .click()
    await mkdir('docs/screenshots/staging/email-auth', { recursive: true })
    for (const [width, height] of [
      [1440, 900],
      [390, 844],
    ]) {
      await page.setViewportSize({ width, height })
      const axe = await new AxeBuilder({ page }).analyze()
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      )
      record(
        'Authenticated dialog accessibility/reflow ' + width,
        axe.violations.length === 0 && !overflow,
        { axeViolations: axe.violations.map((v) => v.id), overflow },
      )
      await page.screenshot({
        path: `docs/screenshots/staging/email-auth/authenticated-${width}.png`,
        mask: [page.locator('input')],
        fullPage: true,
      })
    }
    const signedSession = await readSession()
    await client.auth.setSession(signedSession)
    await modal.getByRole('button', { name: 'Close dialog' }).click()
    await page.goto(target.frontendOrigin + '/settings')
    await page.getByRole('button', { name: 'Sign out', exact: true }).click()
    await page.waitForFunction(
      () =>
        !Object.keys(localStorage).some((k) => /^sb-.+-auth-token$/.test(k)),
    )
    stage = 'Actual invalid credentials and duplicate registration'
    currentStep = 'negative-managed-auth-requests'
    const invalid = await client.auth.signInWithPassword({
      email: credentials.email,
      password: randomUUID() + randomUUID(),
    })
    record('Invalid password denied by actual managed Auth', !!invalid.error, {
      status: invalid.error?.status,
      code: invalid.error?.code,
    })
    const duplicate = await client.auth.signUp(credentials)
    record(
      'Duplicate registration denied with no replacement session',
      !!duplicate.error && !duplicate.data?.session,
      { status: duplicate.error?.status, code: duplicate.error?.code },
    )
    const malformed = await client.auth.signUp({
      email: 'not-an-email',
      password: credentials.password,
    })
    record('Malformed email denied by managed Auth', !!malformed.error, {
      status: malformed.error?.status,
      code: malformed.error?.code,
    })
    // Same controlled address: a weak-password request cannot create another identity.
    const short = await client.auth.signUp({
      email: credentials.email,
      password: 'x',
    })
    record('Short password denied by managed Auth', !!short.error, {
      status: short.error?.status,
      code: short.error?.code,
    })
  } else {
    currentStep = 'final-ui-logout'
    await page.getByRole('button', { name: 'Sign out', exact: true }).click()
    await page.waitForFunction(
      () =>
        !Object.keys(localStorage).some((k) => /^sb-.+-auth-token$/.test(k)),
    )
    record('Final resumed browser session logged out', !(await readSession()))
  }
  report.browser = {
    uncaughtErrors,
    consoleErrors,
    responses,
    note: 'Expected deliberate negative Auth calls may yield resource console errors; raw messages, bodies, URLs with queries, tokens and identity values are never logged.',
  }
  record('No uncaught browser exceptions', uncaughtErrors === 0, {
    uncaughtErrors,
  })
  await client.auth.signOut({ scope: 'local' })
} catch (error) {
  sessionAfterNavigation =
    page && readSession
      ? !!(await readSession().catch(() => null))?.access_token
      : null
  if (page && currentRoute) {
    const expected =
      currentRoute === '/profile'
        ? page
            .getByRole('main')
            .getByText('Your research identity', { exact: true })
        : page.getByRole('main').getByRole('heading', { level: 1 }).first()
    expectedRouteContent = await expected.isVisible().catch(() => false)
  }
  report.browser = { ...browserDiagnostics, http: [...routeResponses] }
  report.records.push({
    name: stage,
    status: 'FAIL - REPAIR REQUIRED',
    observed: {
      currentRoute,
      currentStep,
      errorClass: [
        'TimeoutError',
        'AssertionError',
        'TypeError',
        'Error',
        'AbortError',
      ].includes(error.name)
        ? error.name
        : 'Error',
      errorCode: safeErrorCode(error.code),
      sessionBeforeNavigation,
      sessionAfterNavigation,
      expectedRouteContent,
      http: [...routeResponses],
      detail:
        'Allowlisted class/code and route/status/boolean diagnostics only; no raw exception or private payload.',
    },
  })
  process.exitCode = 1
} finally {
  report.browser = { ...report.browser, ...browserDiagnostics }
  credentials.email = ''
  credentials.password = ''
  await browser?.close()
  server.kill()
  report.remaining =
    'No delivered SMS/phone flags/academic approval or member/staff positive tests. Real approved accounts, separate controlled private account, sources/processor and recovery remain external gates.'
  await writeFile(reportFile, JSON.stringify(report, null, 2) + '\n')
  const failed = report.records.filter((r) =>
    r.status.startsWith('FAIL'),
  ).length
  console.log(
    JSON.stringify({
      projectRef: target.projectRef,
      passed: report.records.filter((r) => r.status.startsWith('PASS')).length,
      failed,
      report: reportFile,
    }),
  )
  if (failed) process.exitCode = 1
}
