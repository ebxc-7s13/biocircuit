import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { URLSearchParams } from 'node:url'
import { loadEnv } from 'vite'
import { createClient } from '@supabase/supabase-js'
import { chromium } from '@playwright/test'
import { readTarget, assertPublicKey } from './cloud-target.mjs'
import { readStagingCredential } from './staging-private.mjs'

// Live session-adoption check without spending a recovery email or changing a
// password. Account A's ordinary hosted session is presented as a default
// recovery fragment. Unmodified, the app must refuse it (AMR is "password").
// Then, in THIS TEST BROWSER ONLY, the AMR method check is stubbed so the rest
// of the real flow (hosted getUser, setSession, SIGNED_IN, app-shell reload,
// getSession/same-session checks) must reach the password editor. Recovery is
// then cancelled; no update request is ever sent. Records statuses only.
const target = await readTarget()
assert.equal(target.projectRef, 'ibxubsegrabpspopdgep')
const env = loadEnv('development', process.cwd(), '')
assert.equal(env.VITE_SUPABASE_URL, target.url)
assertPublicKey(env.VITE_SUPABASE_PUBLISHABLE_KEY)
const report = {
  projectRef: target.projectRef,
  scope:
    'LIVE hosted Auth; ordinary session of A as recovery fragment; AMR check stubbed in the test browser only for the adoption leg; no password update, signup or admin API',
  records: [],
}
const check = (name, pass, observed = {}) => {
  report.records.push({ name, status: pass ? 'PASS - LIVE' : 'FAIL', observed })
  assert.ok(pass, name)
}
let browser, server, node
try {
  const credential = await readStagingCredential('A')
  node = createClient(target.url, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
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
  for (let i = 0; i < 600; i++) {
    if (server && server.exitCode !== null) throw Error('Local server exited')
    try {
      if ((await fetch(target.frontendOrigin)).ok) break
    } catch {
      /* starting */
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  browser = await chromium.launch({ headless: true })
  const attempt = async (stubAmr) => {
    const signedIn = await node.auth.signInWithPassword(credential)
    assert.ok(!signedIn.error && signedIn.data.session)
    const s = signedIn.data.session
    const context = await browser.newContext()
    const page = await context.newPage()
    const auth = []
    let exceptions = 0
    page.on('pageerror', () => exceptions++)
    page.on('response', (r) => {
      const p = new URL(r.url()).pathname
      if (p.startsWith('/auth/v1/'))
        auth.push({ method: r.request().method(), path: p, status: r.status() })
    })
    if (stubAmr)
      await page.route('**/src/domain/recovery.ts*', async (route) => {
        const res = await route.fetch()
        const body = (await res.text()).replace(
          'export function hasRecoveryMethod(',
          'export function hasRecoveryMethod() { return true }; function originalHasRecoveryMethod(',
        )
        assert.ok(body.includes('originalHasRecoveryMethod'))
        await route.fulfill({ response: res, body })
      })
    const fragment = new URLSearchParams({
      access_token: s.access_token,
      expires_at: String(s.expires_at),
      expires_in: String(s.expires_in),
      refresh_token: s.refresh_token,
      sb: '',
      token_type: 'bearer',
      type: 'recovery',
    })
    await page.goto(target.frontendOrigin + '/account/recovery#' + fragment, {
      waitUntil: 'domcontentloaded',
    })
    const region = page.getByRole('region', {
      name: 'Recover your account',
      exact: true,
    })
    await region
      .getByRole('button', { name: 'Continue recovery' })
      .click({ timeout: 30000 })
    const editor = page.getByLabel('New password', { exact: true })
    await editor
      .or(region.getByRole('alert'))
      .first()
      .waitFor({ timeout: 20000 })
      .catch(() => {})
    // Let the app shell finish any sign-in reload before judging the outcome.
    await page.waitForTimeout(1500)
    const result = {
      editor: (await editor.count()) === 1,
      alert: (await region.getByRole('alert').count()) > 0,
      urlClean: await page.evaluate(
        () => !window.location.search && !window.location.hash,
      ),
      exceptions,
      auth,
    }
    if (result.editor) {
      await region.getByRole('button', { name: 'Cancel recovery' }).click()
      result.cancelled = (await editor.count()) === 0
    }
    result.updateRequests = auth.filter(
      (a) => a.path === '/auth/v1/user' && a.method === 'PUT',
    ).length
    await page.evaluate(async () => {
      const { getClient } = await import('/src/data/gateway.ts')
      await (await getClient())?.auth.signOut({ scope: 'local' })
    })
    await context.close()
    await node.auth.signOut({ scope: 'local' })
    return result
  }
  const refused = await attempt(false)
  check(
    'Unmodified app refuses an ordinary password session as recovery',
    !refused.editor && refused.alert && refused.updateRequests === 0,
    { authStatuses: refused.auth.map((a) => a.status) },
  )
  const adopted = await attempt(true)
  check(
    'Real hosted session adoption survives SIGNED_IN and the app-shell reload and opens the editor',
    adopted.editor && !adopted.alert,
    { authStatuses: adopted.auth.map((a) => a.status) },
  )
  check('Fragment stripped from the visible URL', adopted.urlClean)
  check(
    'Cancel removes the editor; no password update request was sent',
    adopted.cancelled && adopted.updateRequests === 0,
  )
  check(
    'No uncaught application exception',
    refused.exceptions === 0 && adopted.exceptions === 0,
  )
  const still = await node.auth.signInWithPassword(credential)
  check('Original password unchanged', !still.error && !!still.data.session)
  await node.auth.signOut({ scope: 'local' })
} catch (error) {
  report.failed = true
  report.errorClass = ['AssertionError', 'TimeoutError'].includes(error.name)
    ? error.name
    : 'Error'
  process.exitCode = 1
} finally {
  await browser?.close()
  server?.kill()
  const file = `docs/verification/cloud/recovery-adoption-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  await writeFile(file, JSON.stringify(report, null, 2) + '\n')
  console.log(
    JSON.stringify({
      file,
      passed: report.records.filter((r) => r.status === 'PASS - LIVE').length,
      failed: !!report.failed,
    }),
  )
}
