import assert from 'node:assert/strict'
import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { URLSearchParams } from 'node:url'
import { access, writeFile } from 'node:fs/promises'
import { loadEnv } from 'vite'
import { createClient } from '@supabase/supabase-js'
import { chromium, expect } from '@playwright/test'
import { readTarget, assertPublicKey } from './cloud-target.mjs'
import { readStagingCredential } from './staging-private.mjs'

const target = await readTarget()
assert.equal(target.projectRef, 'ibxubsegrabpspopdgep')
const report = {
  projectRef: target.projectRef,
  scope:
    'Explicit operator-supplied actual mailbox receipt, normal managed recovery UI and own-password rotation; no administrative APIs or signup',
  records: [],
}
let currentStep = 'private-delivery-input'
let browser, server, client
const check = (name, pass, observed = {}) => {
  report.records.push({ name, status: pass ? 'PASS - LIVE' : 'FAIL', observed })
  assert.ok(pass)
}
try {
  if (process.argv.includes('--preflight-only')) {
    const present = await access('.cloud/recovery-input.xml').then(
      () => true,
      () => false,
    )
    report.privateReceiptInputPresent = present
    report.preflightOnly = true
    report.blocked = present
      ? 'Preflight only; actual reset was not requested by this invocation'
      : 'Actual mailbox receipt is not configured; no reset or credential write attempted'
    process.exitCode = 2
    throw Error('Preflight ends before any secret input or network request')
  }
  try {
    await access('.cloud/recovery-input.xml')
  } catch {
    report.blocked =
      'Actual delivered link/code and new unique password must be entered locally with scripts/set-staging-recovery-input.ps1'
    process.exitCode = 2
    throw Error('Receipt prerequisite')
  }
  const { stdout } = await promisify(execFile)(
    'powershell.exe',
    [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      "[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false); $s=Import-Clixml -LiteralPath '.cloud/recovery-input.xml'; $p=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($s); try { [Console]::Write([Runtime.InteropServices.Marshal]::PtrToStringBSTR($p)) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($p) }",
    ],
    { windowsHide: true, maxBuffer: 18000 },
  )
  const input = JSON.parse(stdout)
  assert.ok(
    ['A', 'B'].includes(input.account) && ['Code', 'Link'].includes(input.mode),
  )
  assert.ok(
    typeof input.nextPassword === 'string' &&
      input.nextPassword.length >= 12 &&
      input.nextPassword.length <= 128,
  )
  const credential = await readStagingCredential(input.account)
  assert.ok(credential && credential.password !== input.nextPassword)
  const env = loadEnv('development', process.cwd(), '')
  assert.equal(env.VITE_SUPABASE_URL, target.url)
  assertPublicKey(env.VITE_SUPABASE_PUBLISHABLE_KEY)
  client = createClient(target.url, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (url, init) =>
        fetch(url, { ...init, signal: AbortSignal.timeout(15000) }),
    },
  })
  const before = await client.auth.signInWithPassword(credential)
  check(
    'Existing original password signs in before actual reset',
    !before.error && !!before.data.session,
  )
  const owner = before.data.user.id
  const flags = async () => {
    const user = await client.auth.getUser()
    const profile = await client
      .from('profiles')
      .select('phone_verified,membership,suspended')
      .eq('id', owner)
      .single()
    const roles = await client.from('roles').select('role').eq('user_id', owner)
    assert.ok(!user.error && !profile.error && !roles.error)
    return {
      sameIdentity: user.data.user.id === owner,
      phoneConfirmed: !!user.data.user.phone_confirmed_at,
      ...profile.data,
      roleCount: roles.data.length,
    }
  }
  const originalFlags = await flags()
  // Reuse the app already served by npm run recovery:serve at the exact origin.
  const running = await fetch(target.frontendOrigin).then(
    (r) => r.ok,
    () => false,
  )
  if (!running)
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
  for (let i = 0; i < 100; i++) {
    if (server && server.exitCode !== null)
      throw Error('Local server unavailable')
    try {
      if ((await fetch(target.frontendOrigin)).ok) break
    } catch {
      /*startup*/
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()
  const statuses = []
  report.authStatuses = statuses // path + status only; kept on failure too
  let exceptions = 0
  let sensitiveConsole = false
  page.on('pageerror', () => exceptions++)
  page.on('console', (event) => {
    const text = event.text()
    if (
      text.includes(credential.email) ||
      text.includes(credential.password) ||
      text.includes(input.nextPassword) ||
      text.includes(input.artifact) ||
      /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(text)
    )
      sensitiveConsole = true
  })
  page.on('response', (r) => {
    const p = new URL(r.url()).pathname
    if (p.startsWith('/auth/v1/'))
      statuses.push({ path: p, status: r.status() })
  })
  let linkUrl
  if (input.mode === 'Link') {
    linkUrl = new URL(input.artifact)
    const local =
      linkUrl.origin === target.frontendOrigin &&
      linkUrl.pathname === '/account/recovery'
    const hosted =
      linkUrl.origin === target.url && linkUrl.pathname === '/auth/v1/verify'
    assert.ok((local || hosted) && !linkUrl.username && !linkUrl.password)
    assert.equal(
      (hosted
        ? linkUrl.searchParams
        : new URLSearchParams(linkUrl.search || linkUrl.hash.slice(1))
      ).get('type'),
      'recovery',
    )
    if (hosted)
      assert.equal(
        linkUrl.searchParams.get('redirect_to'),
        target.frontendOrigin + '/account/recovery',
      )
    // Structural diagnostics only: parameter NAMES, allowlisted error codes and
    // statuses. Token values are never recorded.
    const arrival = { verifyHttpStatus: null, queryKeys: [], fragmentKeys: [] }
    report.linkArrival = arrival
    page.on('response', (r) => {
      if (new URL(r.url()).pathname === '/auth/v1/verify')
        arrival.verifyHttpStatus = r.status()
    })
    page.on('framenavigated', (frame) => {
      if (frame !== page.mainFrame()) return
      const u = new URL(frame.url())
      if (u.origin !== target.frontendOrigin || (!u.search && !u.hash)) return
      const safe = (keys) =>
        [...keys].map((k) => (/^[a-z_]{1,40}$/.test(k) ? k : 'other'))
      arrival.queryKeys = safe(u.searchParams.keys())
      const params = new URLSearchParams(u.hash.slice(1))
      arrival.fragmentKeys = safe(params.keys())
      const code = params.get('error_code') ?? u.searchParams.get('error_code')
      if (code) arrival.errorCode = /^[a-z_]{1,40}$/.test(code) ? code : 'other'
    })
    currentStep = 'actual-delivered-link-navigation'
    await page.goto(linkUrl.href, { waitUntil: 'domcontentloaded' })
    const region = page.getByRole('region', {
      name: 'Recover your account',
      exact: true,
    })
    const proceed = region.getByRole('button', { name: 'Continue recovery' })
    await proceed
      .or(region.getByRole('alert'))
      .first()
      .waitFor({ timeout: 30000 })
    arrival.continueOffered = (await proceed.count()) === 1
    arrival.alertShown = (await region.getByRole('alert').count()) > 0
    currentStep = 'actual-delivered-link-continue'
    await proceed.click({ timeout: 5000 })
  } else {
    assert.match(input.artifact, /^\d{6,10}$/)
    currentStep = 'actual-delivered-code-verification'
    // Code already delivered; do not resend and invalidate it. The UI request
    // normally precedes this input, so use a genuine existing request stage by
    // allowing entry through the dedicated "I already have a code" control.
    await page.goto(target.frontendOrigin + '/account/recovery', {
      waitUntil: 'domcontentloaded',
    })
    await page
      .getByLabel('Email address', { exact: true })
      .fill(credential.email)
    await page.getByRole('button', { name: 'I already have a code' }).click()
    await page.getByLabel('Recovery code', { exact: true }).fill(input.artifact)
    await page.getByRole('button', { name: 'Verify recovery code' }).click()
  }
  await page
    .getByLabel('New password', { exact: true })
    .waitFor({ timeout: 15000 })
  const sameOwner = await page.evaluate(async (expectedOwner) => {
    const { getClient } = await import('/src/data/gateway.ts')
    const managedClient = await getClient()
    if (!managedClient) return false
    const verified = await managedClient.auth.getUser()
    return !verified.error && verified.data.user?.id === expectedOwner
  }, owner)
  check(
    'Real recovery session belongs to the selected controlled account before any password change',
    sameOwner,
  )
  check(
    'Real recovery artifact establishes a password editor through managed Auth',
    true,
  )
  check(
    'Actual reset artifacts stripped from URL',
    await page.evaluate(() => !window.location.search && !window.location.hash),
  )
  currentStep = 'new-password-managed-update'
  await page
    .getByLabel('New password', { exact: true })
    .fill(input.nextPassword)
  await page
    .getByLabel('Confirm new password', { exact: true })
    .fill(input.nextPassword)
  await page.getByRole('button', { name: 'Update password' }).click()
  await expect(
    page
      .getByRole('region', { name: 'Recover your account', exact: true })
      .getByRole('status'),
  ).toContainText('Password updated by Auth')
  check(
    'Actual hosted Auth password update succeeded',
    statuses.some((s) => s.path === '/auth/v1/user' && s.status === 200),
  )
  // Immediately protect the rotated credential, with an encrypted original
  // copy for recovery. stdin only: no secret in process arguments or reports.
  currentStep = 'protect-rotated-local-credential'
  const credentialFile =
    input.account === 'A'
      ? '.cloud/email-staging-credentials.xml'
      : '.cloud/email-staging-account-b.xml'
  const savedCopy = `.cloud/recovery-original-${input.account}-${Date.now()}.xml`
  await new Promise((done, fail) => {
    const command = `[Console]::InputEncoding=[Text.UTF8Encoding]::new($false); $v=[Console]::In.ReadToEnd()|ConvertFrom-Json; Copy-Item -LiteralPath '${credentialFile}' -Destination '${savedCopy}'; $c=[PSCredential]::new($v.address,(ConvertTo-SecureString -String $v.secret -AsPlainText -Force)); $c|Export-Clixml -LiteralPath '${credentialFile}'`
    const child = spawn(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', command],
      { windowsHide: true, stdio: ['pipe', 'ignore', 'ignore'] },
    )
    child.on('error', () => fail(Error('Private save unavailable')))
    child.on('exit', (code) =>
      code === 0 ? done() : fail(Error('Private save unavailable')),
    )
    child.stdin.end(
      JSON.stringify({ address: credential.email, secret: input.nextPassword }),
    )
  })
  check('Rotated credential protected locally after actual reset', true)
  currentStep = 'old-and-new-password-verification'
  await client.auth.signOut({ scope: 'local' })
  const old = await client.auth.signInWithPassword(credential)
  check(
    'Old password rejected after real reset',
    old.error?.code === 'invalid_credentials' && !old.data.session,
    { httpStatus: old.error?.status },
  )
  const fresh = await client.auth.signInWithPassword({
    email: credential.email,
    password: input.nextPassword,
  })
  check(
    'New password signs into the same actual identity',
    !fresh.error && fresh.data.user?.id === owner,
  )
  check(
    'Phone, membership, suspension and roles unchanged by reset',
    JSON.stringify(originalFlags) === JSON.stringify(await flags()),
  )
  currentStep = 'reused-actual-artifact'
  const reused = await browser.newContext()
  const repeat = await reused.newPage()
  if (linkUrl) {
    await repeat.goto(linkUrl.href, { waitUntil: 'domcontentloaded' })
    const button = repeat.getByRole('button', { name: 'Continue recovery' })
    if (await button.count()) await button.click()
  } else {
    await repeat.goto(target.frontendOrigin + '/account/recovery', {
      waitUntil: 'domcontentloaded',
    })
    await repeat
      .getByLabel('Email address', { exact: true })
      .fill(credential.email)
    await repeat.getByRole('button', { name: 'I already have a code' }).click()
    await repeat
      .getByLabel('Recovery code', { exact: true })
      .fill(input.artifact)
    await repeat.getByRole('button', { name: 'Verify recovery code' }).click()
  }
  await repeat
    .getByRole('region', { name: 'Recover your account', exact: true })
    .getByRole('alert')
    .waitFor({ timeout: 15000 })
  check(
    'Reused actual artifact cannot expose password editor',
    (await repeat.getByLabel('New password', { exact: true }).count()) === 0,
  )
  check(
    'No uncaught application exception or sensitive console output',
    exceptions === 0 && !sensitiveConsole,
  )
  report.authStatuses = statuses
  report.expiredRealLink =
    'UNVERIFIED: requires a separate genuinely expired artifact; expiry was not changed'
} catch (error) {
  if (!report.blocked) {
    report.failed = true
    report.currentStep = currentStep
    report.errorClass = ['Error', 'AssertionError', 'TimeoutError'].includes(
      error.name,
    )
      ? error.name
      : 'Error'
    process.exitCode = 1
  }
} finally {
  await browser?.close()
  server?.kill()
  await client?.auth.signOut({ scope: 'local' })
  const file = `docs/verification/cloud/delivered-recovery-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  await writeFile(file, JSON.stringify(report, null, 2) + '\n')
  console.log(
    JSON.stringify({
      file,
      passed: report.records.filter((r) => r.status === 'PASS - LIVE').length,
      failed: !!report.failed,
      blocked: !!report.blocked,
    }),
  )
}
