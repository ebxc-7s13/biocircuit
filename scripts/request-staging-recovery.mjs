import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'
import { readTarget } from './cloud-target.mjs'
import { readStagingCredential } from './staging-private.mjs'

// Sends ONE recovery email through the real connected UI for an existing account.
// Records status and the hosted expiry deadline only (otp_expiry = 3600 s).
const target = await readTarget()
assert.equal(target.projectRef, 'ibxubsegrabpspopdgep')
const account = process.argv.includes('--account=B') ? 'B' : 'A'
const report = {
  projectRef: target.projectRef,
  account,
  scope:
    'Single recovery request through the normal connected UI; no reset, signup or password change',
}
let browser, server
try {
  const credential = await readStagingCredential(account)
  assert.ok(credential)
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
  report.step = 'open-recovery-page'
  await page.goto(target.frontendOrigin + '/account/recovery', {
    waitUntil: 'domcontentloaded',
  })
  report.step = 'fill-email'
  await page
    .getByLabel('Email address', { exact: true })
    .fill(credential.email, { timeout: 30000 })
  report.step = 'submit-request'
  const recover = page.waitForResponse(
    (r) => new URL(r.url()).pathname === '/auth/v1/recover',
    { timeout: 30000 },
  )
  await page.getByRole('button', { name: 'Request recovery email' }).click()
  const response = await recover
  report.step = 'recorded'
  const body =
    response.status() === 200 ? {} : await response.json().catch(() => ({}))
  report.httpStatus = response.status()
  report.allowlistedCode = [
    'over_email_send_rate_limit',
    'email_address_not_authorized',
    'over_request_rate_limit',
  ].includes(body.error_code)
    ? body.error_code
    : null
  report.requestedAt = new Date().toISOString()
  report.useBefore = new Date(Date.now() + 3600 * 1000).toISOString()
  report.deliveryVerified = false
  if (report.httpStatus !== 200) process.exitCode = 1
} catch {
  report.failed = true
  process.exitCode = 1
} finally {
  await browser?.close()
  server?.kill()
  const file = `docs/verification/cloud/recovery-request-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  await writeFile(file, JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify({ file, ...report }))
}
