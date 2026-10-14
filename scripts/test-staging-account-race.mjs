import { spawn } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'
import { loadEnv } from 'vite'
import { chromium, expect } from '@playwright/test'
import { readTarget, assertPublicKey } from './cloud-target.mjs'
import { readStagingCredential } from './staging-private.mjs'
const target = await readTarget()
if (target.projectRef !== 'ibxubsegrabpspopdgep')
  throw Error('Wrong staging target')
const env = loadEnv('development', process.cwd(), '')
if (env.VITE_APP_MODE !== 'connected' || env.VITE_SUPABASE_URL !== target.url)
  throw Error('Wrong frontend')
assertPublicKey(env.VITE_SUPABASE_PUBLISHABLE_KEY)
const report = {
  projectRef: target.projectRef,
  scope:
    'Actual hosted A/B sessions and private rows, with deliberate delay of a genuine A snapshot response across B login. No mock service, replay trace or private response recorded.',
  records: [],
  browser: { consoleErrors: 0, uncaughtErrors: 0, signupRequests: 0 },
}
let step = 'ordinary-existing-accounts',
  browser,
  server,
  release,
  page
const accounts = []
const check = (name, pass, observed = {}) => {
  step = name
  report.records.push({
    name,
    status: pass ? 'PASS - LIVE VERIFIED' : 'FAIL',
    observed,
  })
  if (!pass) throw Error('Live race check failed')
}
try {
  for (const label of ['A', 'B']) {
    const credentials = await readStagingCredential(label)
    if (!credentials) throw Error('Controlled credentials missing')
    const client = createClient(target.url, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const a = await client.auth.signInWithPassword(credentials)
    check('Existing ordinary sign-in ' + label, !a.error && !!a.data.session)
    const profile = await client
      .from('profiles')
      .select('name,handle')
      .eq('id', a.data.user.id)
      .single()
    check(
      'Own populated profile fixture ' + label,
      !profile.error && !!profile.data.handle,
      { status: profile.status },
    )
    accounts.push({
      label,
      credentials,
      client,
      uid: a.data.user.id,
      profile: profile.data,
    })
  }
  const [a, b] = accounts
  check('Two managed identities differ', a.uid !== b.uid)
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
  for (let n = 0; n < 100; n++) {
    if (server.exitCode !== null) throw Error('Loopback unavailable')
    try {
      if ((await fetch(target.frontendOrigin)).ok) break
    } catch {
      /*startup*/
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  page = await context.newPage()
  page.on('console', (m) => {
    if (m.type() === 'error') report.browser.consoleErrors++
  })
  page.on('pageerror', () => report.browser.uncaughtErrors++)
  const pendingCore = new Set()
  page.on('request', (r) => {
    const u = new URL(r.url())
    if (
      u.hostname === new URL(target.url).hostname &&
      (u.pathname.startsWith('/rest/v1/') ||
        u.pathname.startsWith('/auth/v1/') ||
        u.pathname.startsWith('/functions/v1/'))
    )
      pendingCore.add(r)
  })
  page.on('requestfinished', (r) => pendingCore.delete(r))
  page.on('requestfailed', (r) => pendingCore.delete(r))
  page.on('request', (r) => {
    if (new URL(r.url()).pathname === '/auth/v1/signup')
      report.browser.signupRequests++
  })
  const login = async (x) => {
    step = 'ui-open-account-' + x.label
    await page
      .getByRole('button', { name: 'Account & eligibility', exact: true })
      .click()
    const d = page.getByRole('dialog')
    step = 'ui-fill-email-' + x.label
    await d
      .getByLabel('Email address', { exact: true })
      .fill(x.credentials.email)
    step = 'ui-fill-password-' + x.label
    await d.getByLabel('Password', { exact: true }).fill(x.credentials.password)
    step = 'ui-submit-sign-in-' + x.label
    await d
      .getByRole('button', { name: 'Sign in with email', exact: true })
      .click()
    step = 'ui-await-managed-account-' + x.label
    await d
      .getByText('Signed in; phone verification still required.', {
        exact: true,
      })
      .waitFor()
    await d.getByRole('button', { name: 'Close dialog', exact: true }).click()
  }
  const token = () =>
    page.evaluate(() => {
      const k = Object.keys(localStorage).find((k) =>
        /^sb-.+-auth-token$/.test(k),
      )
      return k ? JSON.parse(localStorage.getItem(k)).access_token : null
    })
  await page.goto(target.frontendOrigin + '/feed', {
    waitUntil: 'domcontentloaded',
  })
  await login(a)
  const readyA = await a.client.auth.getUser(await token())
  check(
    'Browser managed identity is A before delayed reload',
    !readyA.error && readyA.data.user.id === a.uid,
  )
  const authorizationOfA = 'Bearer ' + (await token())
  let heldAuthorization
  let heldOnce = false,
    heldResolve,
    finishedResolve
  const held = new Promise((r) => {
    heldResolve = r
  })
  const finished = new Promise((r) => {
    finishedResolve = r
  })
  const barrier = new Promise((r) => {
    release = r
  })
  await page.route('**/rest/v1/rpc/community_snapshot', async (route) => {
    if (route.request().headers().authorization === authorizationOfA) {
      const first = !heldOnce
      heldOnce = true
      report.delayedResponseCount = (report.delayedResponseCount ?? 0) + 1
      heldAuthorization = route.request().headers().authorization
      const response = await route.fetch()
      const data = await response.json()
      report.delayedResponse = {
        status: response.status(),
        containsKnownPrivateA: data.profiles.some((p) => p.id === a.uid),
        containsPrivateB: data.profiles.some((p) => p.id === b.uid),
      }
      if (first) heldResolve()
      await barrier
      await route.fulfill({ response })
      finishedResolve()
    } else await route.continue()
  })
  step = 'hold-real-a-snapshot-after-reload'
  await page.reload({ waitUntil: 'domcontentloaded' })
  await Promise.race([
    held,
    new Promise((_, reject) =>
      setTimeout(() => reject(Error('Bounded wait unavailable')), 15000),
    ),
  ])
  check(
    'Delayed payload is a genuine hosted private A snapshot',
    report.delayedResponse.status === 200 &&
      report.delayedResponse.containsKnownPrivateA &&
      !report.delayedResponse.containsPrivateB,
  )
  step = 'normal-ui-login-b-while-a-snapshot-pending'
  await login(b)
  const readyB = await b.client.auth.getUser(await token())
  check(
    'Normal UI sign-in changes actual managed identity to B',
    !readyB.error && readyB.data.user.id === b.uid,
  )
  const released = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === '/rest/v1/rpc/community_snapshot' &&
      r.request().headers().authorization === heldAuthorization,
    { timeout: 15000 },
  )
  release()
  const response = await released
  await response.finished()
  await finished
  await expect.poll(() => pendingCore.size, { timeout: 15000 }).toBe(0)
  await page.evaluate(
    () =>
      new Promise((r) =>
        window.requestAnimationFrame(() =>
          window.requestAnimationFrame(() => r(null)),
        ),
      ),
  )
  await expect.poll(() => pendingCore.size, { timeout: 15000 }).toBe(0)
  // SPA navigation preserves the in-memory state under test; a full reload
  // would conceal a stale snapshot by fetching B afresh.
  await page.locator('a[href="/profile"]').first().click()
  await page
    .getByRole('button', { name: 'Edit profile & interests', exact: true })
    .click()
  await page.getByLabel('Name', { exact: true }).waitFor()
  const visibleName = await page
    .getByLabel('Name', { exact: true })
    .inputValue()
  const visibleHandle = await page
    .getByLabel('Handle', { exact: true })
    .inputValue()
  const current = await b.client.auth.getUser(await token())
  check(
    'Late A response cannot replace B private workspace',
    !current.error &&
      current.data.user.id === b.uid &&
      visibleName === b.profile.name &&
      visibleHandle === b.profile.handle,
    {
      managedIdentityStillB: !current.error && current.data.user.id === b.uid,
      workspaceMatchesB:
        visibleName === b.profile.name && visibleHandle === b.profile.handle,
      oldAWorkspaceVisible: visibleHandle === a.profile.handle,
    },
  )
  check(
    'No browser exceptions or repeated signup',
    report.browser.consoleErrors === 0 &&
      report.browser.uncaughtErrors === 0 &&
      report.browser.signupRequests === 0,
    { ...report.browser },
  )
} catch (error) {
  report.failure = {
    step,
    browserState: await page
      ?.evaluate(
        (expected) => {
          const k = Object.keys(localStorage).find((k) =>
            /^sb-.+-auth-token$/.test(k),
          )
          const value = k
            ? JSON.parse(localStorage.getItem(k)).access_token
            : null
          const claims = value
            ? JSON.parse(
                window.atob(
                  value.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'),
                ),
              )
            : null
          return {
            managedTokenIsA: !!claims && claims.sub === expected.a,
            managedTokenIsB: !!claims && claims.sub === expected.b,
            emailFormPresent: !!document.querySelector(
              'input[autocomplete="email"]',
            ),
            openDialogs: document.querySelectorAll('dialog[open]').length,
          }
        },
        { a: accounts[0]?.uid, b: accounts[1]?.uid },
      )
      .catch(() => null),
    errorClass: ['Error', 'AssertionError', 'TimeoutError'].includes(error.name)
      ? error.name
      : 'Error',
  }
  process.exitCode = 1
} finally {
  release?.()
  await browser?.close()
  server?.kill()
  for (const x of accounts) {
    await x.client.auth.signOut({ scope: 'local' })
    x.credentials.email = ''
    x.credentials.password = ''
  }
  const stamp = new Date()
    .toISOString()
    .replaceAll(':', '-')
    .replaceAll('.', '-')
  const file = 'docs/verification/cloud/account-switch-race-' + stamp + '.json'
  await writeFile(file, JSON.stringify(report, null, 2) + '\n')
  console.log(
    JSON.stringify({
      passed: report.records.filter((r) => r.status.startsWith('PASS')).length,
      failed: !!report.failure,
      report: file,
    }),
  )
}
