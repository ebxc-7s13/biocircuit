import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { createClient } from '@supabase/supabase-js'
import { loadEnv } from 'vite'
import { readTarget, assertPublicKey } from './cloud-target.mjs'

const target = await readTarget()
assert.equal(target.projectRef, 'ibxubsegrabpspopdgep')
const env = { ...loadEnv('development', process.cwd(), ''), ...process.env }
assert.equal(env.VITE_APP_MODE, 'connected')
assert.equal(env.VITE_SUPABASE_URL, target.url)
assertPublicKey(env.VITE_SUPABASE_PUBLISHABLE_KEY)
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY
const sdk = createClient(target.url, key, {
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
const snapshot = await sdk.rpc('public_snapshot', { before_cursor: null })
const settingsResponse = await fetch(target.url + '/auth/v1/settings', {
  headers: { apikey: key },
  signal: AbortSignal.timeout(15000),
  redirect: 'error',
})
const settings = settingsResponse.ok ? await settingsResponse.json() : null
const results = {
  projectRef: target.projectRef,
  scope:
    'Actual connected anonymous SDK/browser only; no account, OTP, privileged role, write or success simulation.',
  snapshot: {
    status: snapshot.status,
    code: snapshot.error?.code ?? null,
    available: !snapshot.error,
  },
  managedAuthSettings: {
    status: settingsResponse.status,
    phoneEnabled: settings?.external?.phone ?? null,
    phoneAutoconfirm: settings?.phone_autoconfirm ?? null,
  },
  routes: [],
  viewports: [],
}
const parsedOrigin = new URL(target.frontendOrigin)
assert.equal(parsedOrigin.hostname, '127.0.0.1')
const port = Number(parsedOrigin.port)
const reservation = createServer()
await new Promise((resolve, reject) => {
  reservation.once('error', reject)
  reservation.listen(port, '127.0.0.1', resolve)
})
await new Promise((resolve) => reservation.close(resolve))
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    String(port),
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
  let ready = false
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw Error('Local connected server failed')
    try {
      if ((await fetch(target.frontendOrigin)).ok) {
        ready = true
        break
      }
    } catch {
      /* Local startup */
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  assert.ok(ready)
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  const page = await context.newPage()
  let uncaughtErrors = 0
  let consoleErrors = 0
  let resourceConsoleErrors = 0
  let stagingRequests = 0
  let unexpectedBackendRequests = 0
  const backendResponses = {}
  const backendResponsePaths = {}
  page.on('pageerror', () => uncaughtErrors++)
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors++
      if (message.text().includes('Failed to load resource'))
        resourceConsoleErrors++
    }
  })
  page.on('response', (response) => {
    if (new URL(response.url()).hostname === new URL(target.url).hostname) {
      backendResponses[response.status()] =
        (backendResponses[response.status()] ?? 0) + 1
      const entry = new URL(response.url()).pathname + ' ' + response.status()
      backendResponsePaths[entry] = (backendResponsePaths[entry] ?? 0) + 1
    }
  })
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.hostname === new URL(target.url).hostname) stagingRequests++
    else if (url.hostname.endsWith('.supabase.co')) unexpectedBackendRequests++
  })
  await mkdir('docs/screenshots/staging', { recursive: true })
  for (const route of [
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
    '/policies',
  ]) {
    await page.goto(target.frontendOrigin + route)
    await page.locator('h1').first().waitFor({ state: 'visible' })
    assert.equal(
      await page
        .getByText('DEMO · synthetic research', { exact: false })
        .count(),
      0,
    )
    assert.equal(
      await page.getByText('Demo researcher', { exact: true }).count(),
      0,
    )
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    results.routes.push({ route, rendered: true, syntheticFallback: false })
  }
  await page.goto(target.frontendOrigin + '/feed')
  await page.locator('h1').first().waitFor({ state: 'visible' })
  await page.keyboard.press('/')
  assert.ok(
    await page
      .getByLabel('Search community', { exact: true })
      .evaluate((el) => el === document.activeElement),
  )
  await page
    .getByRole('button', { name: 'Keyboard shortcuts', exact: true })
    .click()
  await page.getByRole('dialog').waitFor({ state: 'visible' })
  await page.keyboard.press('Escape')
  assert.equal(await page.getByRole('dialog').count(), 0)
  assert.ok(
    await page
      .getByRole('button', { name: 'Keyboard shortcuts', exact: true })
      .evaluate((el) => el === document.activeElement),
  )
  await page.getByRole('link', { name: 'Questions', exact: true }).click()
  await page.waitForURL(target.frontendOrigin + '/questions')
  await page.goBack()
  assert.equal(page.url(), target.frontendOrigin + '/feed')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(
    await page
      .locator('.lab-field i')
      .first()
      .evaluate((el) => window.getComputedStyle(el).animationName),
    'none',
  )
  results.keyboardAndMotion = {
    searchFocus: true,
    modalEscapeAndFocusReturn: true,
    history: true,
    reducedBackgroundMotion: true,
  }
  for (const [width, height] of [
    [1440, 900],
    [1024, 768],
    [390, 844],
    [320, 700],
  ]) {
    await page.setViewportSize({ width, height })
    await page.goto(target.frontendOrigin + '/feed')
    await page.locator('h1').first().waitFor({ state: 'visible' })
    // Observe the real RPC response before capturing the bounded backend error state.
    if (snapshot.error)
      await page
        .getByRole('button', { name: 'Retry load', exact: true })
        .waitFor({ state: 'visible' })
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze()
    results.viewports.push({
      width,
      height,
      overflow: false,
      axeViolations: accessibility.violations.map((v) => v.id),
    })
    assert.equal(accessibility.violations.length, 0)
    await page.screenshot({
      path: `docs/screenshots/staging/anonymous-${width}.png`,
    })
  }
  assert.equal(uncaughtErrors, 0)
  assert.equal(unexpectedBackendRequests, 0)
  assert.ok(stagingRequests > 0)
  results.browser = {
    uncaughtErrors,
    consoleErrors,
    resourceConsoleErrors,
    stagingRequests,
    unexpectedBackendRequests,
    backendResponses,
    backendResponsePaths,
  }
  results.applicationAcceptance = snapshot.error
    ? 'BLOCKED — USER CONFIGURATION: remote schema/public_snapshot unavailable; render/error checks are not successful community persistence.'
    : 'Anonymous snapshot observed; authenticated/role/provider/Storage journeys still require separate acceptance.'
  await mkdir('docs/verification/cloud', { recursive: true })
  await writeFile(
    'docs/verification/cloud/connected-anonymous.json',
    JSON.stringify(results, null, 2) + '\n',
  )
  console.log(JSON.stringify(results, null, 2))
} finally {
  await browser?.close()
  server.kill()
}
