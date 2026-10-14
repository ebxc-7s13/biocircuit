import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'
import { readTarget } from './cloud-target.mjs'

// Starts the connected app at the exact allowlisted recovery origin, proves the
// callback route works before any email link is opened, then keeps serving.
// --check-only stops after the health check. No Auth request is made.
const target = await readTarget()
assert.equal(target.projectRef, 'ibxubsegrabpspopdgep')
const origin = new URL(target.frontendOrigin)
assert.equal(origin.href, 'http://127.0.0.1:5190/')
const callback = target.frontendOrigin + '/account/recovery'
const checkOnly = process.argv.includes('--check-only')
const report = { origin: target.frontendOrigin, callback, checks: [] }
const check = (name, pass) => {
  report.checks.push({ name, passed: !!pass })
  assert.ok(pass, name)
}
const portFree = await new Promise((done) => {
  const probe = createServer()
  probe.once('error', () => done(false))
  probe.listen(Number(origin.port), origin.hostname, () =>
    probe.close(() => done(true)),
  )
})
if (!portFree) {
  console.error(
    `Port ${origin.port} is already in use. Stop the other process first; the recovery callback must be served by this app at exactly ${target.frontendOrigin}.`,
  )
  process.exit(2)
}
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    '--host',
    origin.hostname,
    '--port',
    origin.port,
    '--strictPort',
  ],
  {
    windowsHide: true,
    stdio: 'ignore',
    env: { ...process.env, VITE_APP_MODE: 'connected' },
  },
)
const stop = () => {
  server.kill()
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
let browser
try {
  let ready = false
  for (let i = 0; i < 1200 && !ready; i++) {
    if (server.exitCode !== null) throw Error('Local server exited')
    try {
      const r = await fetch(callback)
      ready =
        r.ok && (r.headers.get('content-type') ?? '').includes('text/html')
    } catch {
      /* starting */
    }
    if (!ready) await new Promise((r) => setTimeout(r, 100))
  }
  check('Exact callback URL returns the app HTML', ready)
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()
  const authRequests = []
  page.on('request', (r) => {
    if (new URL(r.url()).pathname.startsWith('/auth/v1/'))
      authRequests.push(r.url())
  })
  await page.goto(callback, { waitUntil: 'domcontentloaded' })
  const region = page.getByRole('region', {
    name: 'Recover your account',
    exact: true,
  })
  await region.waitFor({ timeout: 60000 })
  check(
    'Connected recovery form renders (not demo mode)',
    (await region
      .getByRole('button', { name: 'Request recovery email' })
      .count()) === 1,
  )
  // A real Auth redirect is a cross-document load, so use a fresh tab rather than a hash change.
  const arrival = await context.newPage()
  arrival.on('request', (r) => {
    if (new URL(r.url()).pathname.startsWith('/auth/v1/'))
      authRequests.push(r.url())
  })
  await arrival.goto(
    callback +
      '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired',
    { waitUntil: 'domcontentloaded' },
  )
  const arrivalRegion = arrival.getByRole('region', {
    name: 'Recover your account',
    exact: true,
  })
  await arrivalRegion.getByRole('alert').waitFor({ timeout: 30000 })
  check(
    'Expired-link callback shows a safe retry message and no password editor',
    (await arrival.getByLabel('New password', { exact: true }).count()) === 0 &&
      (await arrivalRegion
        .getByRole('button', { name: 'Request recovery email' })
        .count()) === 1,
  )
  check(
    'Callback parameters are removed from the visible URL',
    await arrival.evaluate(() => !location.search && !location.hash),
  )
  check('Health check made no Auth requests', authRequests.length === 0)
  await browser.close()
  browser = null
  report.ready = true
  await writeFile(
    'docs/verification/cloud/recovery-serve-health.json',
    JSON.stringify(
      { ...report, checkedAt: new Date().toISOString() },
      null,
      2,
    ) + '\n',
  )
  console.log(
    `READY: recovery callback is live at ${callback} (${report.checks.length}/${report.checks.length} checks). ${checkOnly ? 'Stopping (--check-only).' : 'Keep this window open; press Ctrl+C to stop.'}`,
  )
  if (checkOnly) stop()
} catch (error) {
  await browser?.close()
  // No secrets are handled here; the message aids local diagnosis.
  console.error(String(error?.message ?? error).slice(0, 300))
  console.error(
    'NOT READY: ' +
      (report.checks.find((c) => !c.passed)?.name ??
        'local recovery server did not start'),
  )
  server.kill()
  process.exit(1)
}
