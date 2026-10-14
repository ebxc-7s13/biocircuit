import { spawn, spawnSync } from 'node:child_process'
import { createServer } from 'node:net'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
// Always test the missing-configuration boundary, even when staging is configured.
// Preserve actual env files and the normal production dist; clear public config only
// in the isolated build subprocess. No assertions are removed or weakened.
const smokeOutput = resolve('.cloud', 'missing-config-' + Date.now())
const isolatedBuild = spawnSync(
  process.execPath,
  ['node_modules/vite/bin/vite.js', 'build', '--outDir', smokeOutput],
  {
    windowsHide: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      VITE_APP_MODE: 'connected',
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_PUBLISHABLE_KEY: '',
      VITE_HCAPTCHA_SITE_KEY: '',
    },
  },
)
assert.equal(isolatedBuild.status, 0, 'Isolated missing-config build failed')
const reserve = createServer()
await new Promise((resolve) => reserve.listen(0, '127.0.0.1', resolve))
const port = reserve.address().port
await new Promise((resolve) => reserve.close(resolve))
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--outDir',
    smokeOutput,
    '--host',
    '127.0.0.1',
    '--port',
    String(port),
    '--strictPort',
  ],
  { windowsHide: true, stdio: 'ignore' },
)
let browser
try {
  let ready = false
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw Error('Preview failed')
    try {
      if ((await fetch('http://127.0.0.1:' + port)).ok) {
        ready = true
        break
      }
    } catch {
      /* Starting local preview */
    }
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  assert.ok(ready, 'Preview did not start')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  const remote = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('request', (r) => {
    if (r.url().includes('.supabase.co')) remote.push(r.url().split('?')[0])
  })
  await page.addInitScript(() => {
    window.__metrics = { lcp: 0, cls: 0 }
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__metrics.lcp = e.startTime
    }).observe({ type: 'largest-contentful-paint', buffered: true })
    new PerformanceObserver((list) => {
      for (const e of list.getEntries())
        if (!e.hadRecentInput) window.__metrics.cls += e.value
    }).observe({ type: 'layout-shift', buffered: true })
  })
  await page.goto('http://127.0.0.1:' + port + '/feed')
  await page.getByText('SETUP REQUIRED', { exact: false }).waitFor()
  assert.equal(
    await page.getByText('DEMO · synthetic research', { exact: false }).count(),
    0,
  )
  assert.equal(
    await page.getByText('Demo researcher', { exact: true }).count(),
    0,
  )
  await page.waitForTimeout(1000)
  const measured = await page.evaluate(() => ({
    fcpMs:
      performance.getEntriesByName('first-contentful-paint')[0]?.startTime ??
      null,
    lcpMs: window.__metrics.lcp,
    cls: window.__metrics.cls,
  }))
  assert.deepEqual(errors, [])
  assert.deepEqual(remote, [])
  await page.screenshot({ path: 'docs/screenshots/setup-required.png' })
  const result = {
    scenario:
      'Production build with absent backend configuration; desktop unthrottled local preview. Not connected-feed or field performance.',
    setupRequired: true,
    syntheticFallback: false,
    remoteBackendRequests: remote.length,
    uncaughtErrors: errors.length,
    ...measured,
  }
  await mkdir('docs/verification', { recursive: true })
  await writeFile(
    'docs/verification/production-smoke.json',
    JSON.stringify(result, null, 2) + '\n',
  )
  console.log(JSON.stringify(result, null, 2))
} finally {
  await browser?.close()
  server.kill()
}
