import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { URLSearchParams } from 'node:url'
import { writeFile } from 'node:fs/promises'
import { loadEnv } from 'vite'
import { createClient } from '@supabase/supabase-js'
import { chromium, expect } from '@playwright/test'
import { readTarget, assertPublicKey } from './cloud-target.mjs'
import { readStagingCredential } from './staging-private.mjs'

const target = await readTarget()
assert.equal(target.projectRef, 'ibxubsegrabpspopdgep')
const env = loadEnv('development', process.cwd(), '')
assert.equal(env.VITE_SUPABASE_URL, target.url)
assert.equal(env.VITE_APP_MODE, 'connected')
assertPublicKey(env.VITE_SUPABASE_PUBLISHABLE_KEY)
const report = {
  projectRef: target.projectRef,
  scope:
    'Actual existing-account managed Auth, one real UI recovery request, unknown-email generic response, invalid-link rejection and unchanged security flags; delivery/reset/reuse remain unverified',
  records: [],
  consoleExceptions: 0,
  sensitiveDiagnosticsDetected: false,
}
const check = (name, pass, observed = {}) => {
  report.records.push({ name, status: pass ? 'PASS - LIVE' : 'FAIL', observed })
  assert.ok(pass)
}
let currentStep = 'existing-credential'
let browser, server, client
const statuses = []
const boundaryOnly = process.argv.includes('--boundary-only')
report.boundaryOnly = boundaryOnly
if (boundaryOnly)
  report.scope =
    'Actual managed ordinary-session recovery rejection, invalid links and unchanged identity boundaries; no email request or successful reset'
try {
  const credential = await readStagingCredential('A')
  assert.ok(credential)
  client = createClient(target.url, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (url, init) =>
        fetch(url, { ...init, signal: AbortSignal.timeout(15000) }),
    },
  })
  const login = await client.auth.signInWithPassword(credential)
  check(
    'Existing A sign-in succeeds without signup',
    !login.error && !!login.data.session,
  )
  const own = login.data.user.id
  const baseline = async () => {
    const user = await client.auth.getUser()
    const profile = await client
      .from('profiles')
      .select('phone_verified,membership')
      .eq('id', own)
      .single()
    const roles = await client.from('roles').select('role').eq('user_id', own)
    assert.ok(!user.error && !profile.error && !roles.error)
    return {
      sameIdentity: user.data.user.id === own,
      phonePresent: !!user.data.user.phone,
      phoneConfirmed: !!user.data.user.phone_confirmed_at,
      ...profile.data,
      roleCount: roles.data.length,
    }
  }
  currentStep = 'baseline-profile-and-roles'
  const before = await baseline()
  server = spawn(
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
  for (let i = 0; i < 120; i++) {
    if (server.exitCode !== null) throw Error('Local server unavailable')
    try {
      if ((await fetch(target.frontendOrigin)).ok) break
    } catch {
      /* startup */
    }
    await new Promise((done) => setTimeout(done, 100))
  }
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()
  const monitorPage = (other) => {
    other.on('pageerror', () => report.consoleExceptions++)
    other.on('console', (event) => {
      const text = event.text()
      if (
        text.includes(credential.email) ||
        text.includes(credential.password) ||
        text.includes(login.data.session.access_token) ||
        text.includes(login.data.session.refresh_token)
      )
        report.sensitiveDiagnosticsDetected = true
    })
  }
  page.on('pageerror', () => report.consoleExceptions++)
  page.on('console', (event) => {
    const text = event.text()
    if (
      text.includes(credential.email) ||
      text.includes(credential.password) ||
      /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(text)
    )
      report.sensitiveDiagnosticsDetected = true
  })
  page.on('response', (response) => {
    const path = new URL(response.url()).pathname
    if (path.startsWith('/auth/v1/'))
      statuses.push({ path, status: response.status() })
  })
  if (!boundaryOnly) {
    currentStep = 'actual-ui-recovery-request'
    await page.goto(target.frontendOrigin + '/account/recovery', {
      waitUntil: 'domcontentloaded',
    })
    await page
      .getByLabel('Email address', { exact: true })
      .fill(credential.email)
    const pending = page.waitForResponse(
      (r) => new URL(r.url()).pathname === '/auth/v1/recover',
    )
    currentStep = 'existing-account-ui-submit'
    await page.getByRole('button', { name: 'Request recovery email' }).click()
    const response = await pending
    currentStep = 'existing-account-hosted-response'
    const body =
      response.status() === 200 ? {} : await response.json().catch(() => ({}))
    const code = [
      'email_address_not_authorized',
      'over_email_send_rate_limit',
      'email_address_invalid',
      'unexpected_failure',
    ].includes(body.code)
      ? body.code
      : null
    currentStep = 'existing-account-recovery-notice'
    const recovery = page.getByRole('region', {
      name: 'Recover your account',
      exact: true,
    })
    await expect(recovery.getByRole('status')).toContainText(
      'does not confirm account existence or email delivery',
    )
    const knownNotice = await recovery.getByRole('status').textContent()
    check(
      'Actual UI request reaches hosted recover endpoint and displays generic notice',
      [200, 400, 422, 429, 500].includes(response.status()),
      {
        httpStatus: response.status(),
        allowlistedCode: code,
        actualEmailReceiptVerified: false,
      },
    )
    const directUpdateRequests = statuses.filter(
      (r) => r.path === '/auth/v1/user',
    ).length
    check(
      'Request acceptance cannot expose a password editor',
      (await page.getByLabel('New password', { exact: true }).count()) === 0 &&
        directUpdateRequests === 0,
    )
    await context.close()

    currentStep = 'unknown-address-generic-ui'
    const unknownContext = await browser.newContext()
    const unknown = await unknownContext.newPage()
    monitorPage(unknown)
    await unknown.goto(target.frontendOrigin + '/account/recovery', {
      waitUntil: 'domcontentloaded',
    })
    await unknown
      .getByLabel('Email address', { exact: true })
      .fill('biocircuit-negative-recovery@example.invalid')
    const unknownResponse = unknown.waitForResponse(
      (r) => new URL(r.url()).pathname === '/auth/v1/recover',
    )
    await unknown
      .getByRole('button', { name: 'Request recovery email' })
      .click()
    const otherResponse = await unknownResponse
    await expect(
      unknown
        .getByRole('region', { name: 'Recover your account', exact: true })
        .getByRole('status'),
    ).toHaveText(knownNotice)
    check(
      'Unknown reserved address has identical generic UI without signup',
      true,
      { httpStatus: otherResponse.status() },
    )
    await unknownContext.close()
  } else await context.close()

  for (const [name, suffix, verify] of [
    ['Malformed link', '?token_hash=invalid&type=recovery', false],
    ['Incomplete link', '?type=recovery', false],
    [
      'Invalid well-formed hash',
      '?token_hash=' + 'a'.repeat(56) + '&type=recovery',
      true,
    ],
  ]) {
    currentStep = name
    const invalidContext = await browser.newContext()
    const invalid = await invalidContext.newPage()
    monitorPage(invalid)
    let updates = 0,
      exchanges = 0
    invalid.on('request', (r) => {
      const path = new URL(r.url()).pathname
      if (path === '/auth/v1/user' && r.method() === 'PUT') updates++
      if (path === '/auth/v1/verify') exchanges++
    })
    await invalid.goto(target.frontendOrigin + '/account/recovery' + suffix, {
      waitUntil: 'domcontentloaded',
    })
    await invalid
      .getByRole('heading', { name: 'Recover your account', exact: true })
      .waitFor()
    assert.equal(
      await invalid.evaluate(
        () => window.location.search + window.location.hash,
      ),
      '',
    )
    assert.equal(
      await invalid.evaluate(() => localStorage.getItem('token_hash')),
      null,
    )
    if (verify) {
      check(
        'Opening hash link does not exchange credentials before user action',
        exchanges === 0,
      )
      const failed = invalid.waitForResponse(
        (r) => new URL(r.url()).pathname === '/auth/v1/verify',
      )
      await invalid.getByRole('button', { name: 'Continue recovery' }).click()
      const denied = await failed
      await expect(invalid.getByRole('alert')).toContainText(
        /invalid|unavailable/,
      )
      check(
        'Actual hosted invalid hash verification denied',
        [400, 403, 422, 429].includes(denied.status()),
        { httpStatus: denied.status() },
      )
    } else await invalid.getByRole('alert').waitFor()
    check(
      name + ' sanitized and cannot update password',
      updates === 0 &&
        (await invalid.getByLabel('New password', { exact: true }).count()) ===
          0,
    )
    await invalidContext.close()
  }
  currentStep = 'ordinary-managed-session-is-not-recovery'
  const ordinaryContext = await browser.newContext()
  const ordinary = await ordinaryContext.newPage()
  monitorPage(ordinary)
  let ordinaryUpdates = 0,
    managedVerification = false
  ordinary.on('request', (r) => {
    if (new URL(r.url()).pathname === '/auth/v1/user' && r.method() === 'PUT')
      ordinaryUpdates++
  })
  ordinary.on('response', (r) => {
    if (new URL(r.url()).pathname === '/auth/v1/user' && r.status() === 200)
      managedVerification = true
  })
  const supplied = new URL(target.frontendOrigin + '/account/recovery')
  // Genuine current-user password session, not invented/signed privileged claims.
  supplied.hash = new URLSearchParams({
    access_token: login.data.session.access_token,
    refresh_token: login.data.session.refresh_token,
    type: 'recovery',
    token_type: 'bearer',
  }).toString()
  await ordinary.goto(supplied.href, { waitUntil: 'domcontentloaded' })
  await ordinary.getByRole('button', { name: 'Continue recovery' }).click()
  await ordinary
    .getByRole('region', { name: 'Recover your account', exact: true })
    .getByRole('alert')
    .waitFor()
  check(
    'Actual ordinary signed session cannot impersonate recovery context',
    managedVerification &&
      ordinaryUpdates === 0 &&
      (await ordinary.getByLabel('New password', { exact: true }).count()) ===
        0,
  )
  check(
    'Actual bearer fragment removed from visible history before interaction',
    await ordinary.evaluate(
      () => !window.location.search && !window.location.hash,
    ),
  )
  await ordinaryContext.close()
  currentStep = 'unchanged-account-boundaries'
  check(
    'Recovery request and rejected artifacts leave identity and private membership boundaries unchanged',
    JSON.stringify(before) === JSON.stringify(await baseline()),
    {
      sameIdentity: true,
      noPhoneVerification: !before.phoneConfirmed,
      profilePhoneVerified: before.phone_verified,
      membershipStatus: before.membership,
      staffRoleCount: before.roleCount,
    },
  )
  check(
    'No uncaught application exception or sensitive console diagnostic',
    report.consoleExceptions === 0 && !report.sensitiveDiagnosticsDetected,
  )
  report.records.push({
    name: 'Actual receipt, real successful reset, new/old login and used/expired real link',
    status: 'BLOCKED',
    observed: {
      reason:
        'No verified permitted free sender/inbox access; no delivered link or code was fabricated',
    },
  })
} catch (error) {
  report.failed = true
  report.currentStep = currentStep
  report.errorClass = ['Error', 'AssertionError', 'TimeoutError'].includes(
    error.name,
  )
    ? error.name
    : 'Error'
  process.exitCode = 1
} finally {
  await browser?.close()
  server?.kill()
  await client?.auth.signOut({ scope: 'local' })
  report.authStatuses = statuses
  const file = `docs/verification/cloud/password-recovery-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  await writeFile(file, JSON.stringify(report, null, 2) + '\n')
  console.log(
    JSON.stringify({
      file,
      pass: report.records.filter((r) => r.status === 'PASS - LIVE').length,
      failed: !!report.failed,
      blocked: report.records.filter((r) => r.status === 'BLOCKED').length,
      currentStep: report.currentStep,
    }),
  )
}
