import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readTarget } from './cloud-target.mjs'

// Real connected UI/public snapshot; no account or valid Auth request. Validation
// inputs are isolated invalid values, never a purported controlled identity.
const target = await readTarget()
assert.equal(target.projectRef, 'ibxubsegrabpspopdgep')
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
const result = {
  projectRef: target.projectRef,
  scope:
    'Actual connected anonymous email form UI and client validation. No valid signup/login request, account, password or session simulation.',
  viewports: [],
  authRequests: 0,
  consoleErrors: 0,
  uncaughtErrors: 0,
  backendResponses: {},
}
let browser
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
  const context = await browser.newContext()
  const page = await context.newPage()
  page.on('pageerror', () => result.uncaughtErrors++)
  page.on('console', (m) => {
    if (m.type() === 'error') result.consoleErrors++
  })
  page.on('request', (r) => {
    if (/\/auth\/v1\/(signup|token)/.test(r.url())) result.authRequests++
  })
  page.on('response', (r) => {
    const u = new URL(r.url())
    if (u.hostname === new URL(target.url).hostname) {
      const k = u.pathname + ' ' + r.status()
      result.backendResponses[k] = (result.backendResponses[k] ?? 0) + 1
    }
  })
  await mkdir('docs/screenshots/staging/email-auth', { recursive: true })
  for (const [width, height] of [
    [1440, 900],
    [1024, 768],
    [390, 844],
    [320, 700],
  ]) {
    await page.setViewportSize({ width, height })
    await page.goto(target.frontendOrigin + '/feed')
    await page.waitForLoadState('networkidle')
    const desktopAccount = page.getByRole('button', {
      name: 'Account & eligibility',
      exact: true,
    })
    const mobileAccount = page.getByRole('button', {
      name: 'Join the community',
      exact: true,
    })
    if (await desktopAccount.isVisible()) await desktopAccount.click()
    else if (await mobileAccount.isVisible()) await mobileAccount.click()
    else {
      await page
        .getByRole('button', { name: 'Open navigation', exact: true })
        .click()
      await desktopAccount.click()
    }
    const modal = page.getByRole('dialog')
    await modal.getByRole('heading', { name: 'Welcome back' }).waitFor()
    await modal.getByRole('button', { name: 'Sign in with email' }).click()
    assert.match(await modal.getByRole('alert').innerText(), /valid email/)
    await modal.getByRole('button', { name: 'Show password' }).click()
    assert.equal(
      await modal.getByLabel('Password', { exact: true }).getAttribute('type'),
      'text',
    )
    await modal.getByRole('button', { name: 'Hide password' }).click()
    assert.equal(
      await modal.getByLabel('Password', { exact: true }).getAttribute('type'),
      'password',
    )
    await modal
      .getByRole('button', { name: 'New here? Create an account' })
      .click()
    await modal
      .getByLabel('Email address', { exact: true })
      .fill('validation@example.test')
    await modal.getByLabel('Password', { exact: true }).fill('short')
    await modal
      .getByRole('button', { name: 'Create account', exact: true })
      .click()
    assert.match(await modal.getByRole('alert').innerText(), /at least 12/)
    await modal.getByLabel('Email address', { exact: true }).fill('')
    await modal.getByLabel('Password', { exact: true }).fill('')
    await modal
      .getByRole('button', { name: 'Already registered? Sign in' })
      .click()
    const axe = await new AxeBuilder({ page }).analyze()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    )
    result.viewports.push({
      width,
      height,
      overflow,
      axeViolations: axe.violations.map((v) => v.id),
      invalidFieldsBlocked: true,
      visibilityToggle: true,
      loginRegisterNavigation: true,
    })
    await page.screenshot({
      path: `docs/screenshots/staging/email-auth/login-${width}.png`,
      fullPage: true,
    })
    assert.equal(overflow, false)
    assert.equal(axe.violations.length, 0)
    await modal
      .getByRole('button', { name: 'New here? Create an account' })
      .click()
    await page.screenshot({
      path: `docs/screenshots/staging/email-auth/register-${width}.png`,
      fullPage: true,
    })
    await modal.getByRole('button', { name: 'Close dialog' }).click()
    await page.reload()
    await page.waitForLoadState('networkidle')
  }
  assert.equal(result.authRequests, 0)
  assert.equal(result.consoleErrors, 0)
  assert.equal(result.uncaughtErrors, 0)
  result.status =
    'PASS - LIVE CONNECTED ANONYMOUS UI; real-account acceptance separate'
} catch (error) {
  result.status = 'FAIL - REPAIR REQUIRED'
  result.diagnostic = String(error.message).slice(0, 1200)
  process.exitCode = 1
} finally {
  await browser?.close()
  server.kill()
  await mkdir('docs/verification/cloud', { recursive: true })
  await writeFile(
    'docs/verification/cloud/email-auth-ui.json',
    JSON.stringify(result, null, 2) + '\n',
  )
  console.log(JSON.stringify(result))
}
