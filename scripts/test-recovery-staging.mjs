import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { writeFile, mkdir } from 'node:fs/promises'
import { chromium, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readTarget } from './cloud-target.mjs'
const t = await readTarget()
assert.equal(t.projectRef, 'ibxubsegrabpspopdgep')
const result = {
  projectRef: t.projectRef,
  scope:
    'Real connected anonymous recovery UI, validation and public snapshot only; no recovery delivery or successful password reset claimed',
  viewports: [],
  consoleErrors: 0,
  uncaughtErrors: 0,
  authRequests: 0,
}
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    new URL(t.frontendOrigin).port,
    '--strictPort',
  ],
  {
    windowsHide: true,
    stdio: 'ignore',
    env: { ...process.env, VITE_APP_MODE: 'connected' },
  },
)
let browser
try {
  for (let n = 0; n < 100; n++) {
    if (server.exitCode !== null) throw Error('Server unavailable')
    try {
      if ((await fetch(t.frontendOrigin)).ok) break
    } catch {
      /*startup*/
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  browser = await chromium.launch({ headless: true })
  await mkdir('docs/screenshots/staging/recovery', { recursive: true })
  for (const [width, height] of [
    [1440, 900],
    [1024, 768],
    [390, 844],
    [320, 700],
  ]) {
    const context = await browser.newContext({ viewport: { width, height } })
    const page = await context.newPage()
    page.on('console', (m) => {
      if (m.type() === 'error') result.consoleErrors++
    })
    page.on('pageerror', () => result.uncaughtErrors++)
    page.on('request', (r) => {
      if (new URL(r.url()).pathname.startsWith('/auth/v1/'))
        result.authRequests++
    })
    const snapshotResponse = page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === '/rest/v1/rpc/public_snapshot' &&
        r.status() === 200,
      { timeout: 15000 },
    )
    await page.goto(t.frontendOrigin + '/account/recovery', {
      waitUntil: 'domcontentloaded',
    })
    await page
      .getByRole('heading', { name: 'Recover your account', exact: true })
      .waitFor()
    const snapshot = await snapshotResponse
    assert.ok(snapshot)
    await page.getByLabel('Email address', { exact: true }).fill('malformed')
    await page.getByRole('button', { name: 'Request recovery email' }).click()
    await expect(page.getByRole('alert')).toContainText('valid email')
    await page.getByLabel('Email address', { exact: true }).fill('')
    const axe = await new AxeBuilder({ page }).analyze()
    assert.equal(axe.violations.length, 0)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    )
    assert.equal(overflow, false)
    const nav = page.getByRole('navigation', {
      name: 'Mobile primary navigation',
      exact: true,
    })
    if (await nav.isVisible()) {
      const actionBox = await page
        .getByRole('button', { name: 'Request recovery email' })
        .boundingBox()
      const navBox = await nav.boundingBox()
      assert.ok(
        actionBox && navBox && actionBox.y + actionBox.height <= navBox.y,
      )
      // Long recovery actions may naturally sit below the first fold. Verify
      // every control can actually be revealed above the fixed rail by native
      // vertical scrolling, not only the first request button.
      await page.evaluate(() =>
        window.scrollTo(0, document.documentElement.scrollHeight),
      )
      const currentNav = await nav.boundingBox()
      for (const name of ['Request recovery email', 'I already have a code']) {
        const box = await page
          .getByRole('button', { name, exact: true })
          .boundingBox()
        assert.ok(
          box && currentNav && box.y >= 0 && box.y + box.height <= currentNav.y,
        )
      }
      await page.screenshot({
        path: `docs/screenshots/staging/recovery/${width}x${height}-actions.png`,
        fullPage: false,
      })
      await page.evaluate(() => window.scrollTo(0, 0))
    }
    const screenshot = `docs/screenshots/staging/recovery/${width}x${height}.png`
    await page.screenshot({ path: screenshot, fullPage: true })
    result.viewports.push({
      width,
      height,
      routeLoaded: true,
      publicSnapshotStatus: 200,
      invalidInputBlocked: true,
      axeViolations: axe.violations.length,
      overflow,
      allRecoveryActionsReachable: true,
      screenshot,
    })
    await context.close()
  }
  assert.equal(result.authRequests, 0)
  assert.equal(result.consoleErrors, 0)
  assert.equal(result.uncaughtErrors, 0)
} catch (e) {
  result.failed = true
  result.errorClass = ['Error', 'AssertionError', 'TimeoutError'].includes(
    e.name,
  )
    ? e.name
    : 'Error'
  process.exitCode = 1
} finally {
  await browser?.close()
  server.kill()
  await writeFile(
    'docs/verification/cloud/recovery-ui.json',
    JSON.stringify(result, null, 2) + '\n',
  )
  console.log(
    JSON.stringify({
      viewports: result.viewports.length,
      failed: !!result.failed,
      authRequests: result.authRequests,
      consoleErrors: result.consoleErrors,
      uncaughtErrors: result.uncaughtErrors,
    }),
  )
}
