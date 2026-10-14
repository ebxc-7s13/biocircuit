import assert from 'node:assert/strict'
import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { URLSearchParams } from 'node:url'
import { access, writeFile } from 'node:fs/promises'
import { loadEnv } from 'vite'
import { createClient } from '@supabase/supabase-js'
import { chromium } from '@playwright/test'
import { readTarget, assertPublicKey } from './cloud-target.mjs'
import { readStagingCredential } from './staging-private.mjs'

// Negative live check with a genuinely delivered, already-expired recovery link.
// Never changes a password; records only allowlisted error codes and statuses.
const target = await readTarget()
assert.equal(target.projectRef, 'ibxubsegrabpspopdgep')
// --consumed reuses the operator's already-used delivered link (recovery-input.xml).
const consumed = process.argv.includes('--consumed')
const inputFile = consumed
  ? '.cloud/recovery-input.xml'
  : '.cloud/recovery-expired-input.xml'
const report = {
  projectRef: target.projectRef,
  variant: consumed ? 'already-used' : 'expired',
  scope:
    'Actual delivered recovery link that is already used, or older than the hosted 3600 s expiry (and superseded by later requests); normal browser UI; no password change',
  records: [],
}
let browser, server, client
const check = (name, pass, observed = {}) => {
  report.records.push({ name, status: pass ? 'PASS - LIVE' : 'FAIL', observed })
  assert.ok(pass)
}
try {
  try {
    await access(inputFile)
  } catch {
    report.blocked =
      'Enter the old link with scripts/set-staging-recovery-input.ps1 -Expired'
    process.exitCode = 2
    throw Error('Expired-link prerequisite')
  }
  const { stdout } = await promisify(execFile)(
    'powershell.exe',
    [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      "[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false); $s=Import-Clixml -LiteralPath '" +
        inputFile +
        "'; $p=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($s); try { [Console]::Write([Runtime.InteropServices.Marshal]::PtrToStringBSTR($p)) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($p) }",
    ],
    { windowsHide: true, maxBuffer: 18000 },
  )
  const input = JSON.parse(stdout)
  assert.ok(
    ['A', 'B'].includes(input.account) &&
      input.mode === (consumed ? 'Link' : 'ExpiredLink'),
  )
  const link = new URL(input.artifact)
  const hosted =
    link.origin === target.url && link.pathname === '/auth/v1/verify'
  assert.ok(hosted && !link.username && !link.password)
  assert.equal(link.searchParams.get('type'), 'recovery')
  check(
    'Delivered link targets hosted staging verify with exact redirect',
    link.searchParams.get('redirect_to') ===
      target.frontendOrigin + '/account/recovery',
  )
  const credential = await readStagingCredential(input.account)
  const env = loadEnv('development', process.cwd(), '')
  assert.equal(env.VITE_SUPABASE_URL, target.url)
  assertPublicKey(env.VITE_SUPABASE_PUBLISHABLE_KEY)
  client = createClient(target.url, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
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
  const page = await (await browser.newContext()).newPage()
  let exceptions = 0
  let verifyStatus = null
  let errorCode = null
  let tokenReturned = false
  page.on('pageerror', () => exceptions++)
  page.on('response', (r) => {
    if (new URL(r.url()).pathname === '/auth/v1/verify')
      verifyStatus = r.status()
  })
  page.on('framenavigated', (frame) => {
    if (frame !== page.mainFrame()) return
    const u = new URL(frame.url())
    if (u.origin !== target.frontendOrigin) return
    const params = new URLSearchParams(u.hash.slice(1) || u.search.slice(1))
    if (params.has('access_token') || params.has('code')) tokenReturned = true
    const code = params.get('error_code')
    if (code) errorCode = /^[a-z_]{1,40}$/.test(code) ? code : 'other'
    // Parameter names and the `sb` marker shape only; never values.
    if (u.hash || u.search) {
      report.redirectKeys = [...params.keys()].map((k) =>
        /^[a-z_]{1,40}$/.test(k) ? k : 'other',
      )
      if (params.has('sb'))
        report.sbMarker = params.get('sb') === '' ? 'empty' : 'non-empty'
    }
  })
  await page.goto(link.href, { waitUntil: 'domcontentloaded' })
  const region = page.getByRole('region', {
    name: 'Recover your account',
    exact: true,
  })
  const proceed = region.getByRole('button', { name: 'Continue recovery' })
  if (await proceed.count()) await proceed.click()
  await region.getByRole('alert').waitFor({ timeout: 15000 })
  check(
    'Hosted Auth did not return a session for the expired link',
    !tokenReturned,
    {
      verifyHttpStatus: verifyStatus,
      errorCode,
    },
  )
  check(
    'Expired link shows a safe error and no password editor',
    (await page.getByLabel('New password', { exact: true }).count()) === 0,
  )
  check(
    'Error parameters are stripped from the visible URL',
    await page.evaluate(() => !window.location.search && !window.location.hash),
  )
  const signedIn = await client.auth.signInWithPassword(credential)
  check(
    'Existing password still works: expired link changed nothing',
    !signedIn.error && !!signedIn.data.session,
  )
  check('No uncaught application exception', exceptions === 0)
} catch (error) {
  if (!report.blocked) {
    report.failed = true
    report.errorClass = ['AssertionError', 'TimeoutError'].includes(error.name)
      ? error.name
      : 'Error'
    process.exitCode = 1
  }
} finally {
  await browser?.close()
  server?.kill()
  await client?.auth.signOut({ scope: 'local' })
  const file = `docs/verification/cloud/expired-recovery-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
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
