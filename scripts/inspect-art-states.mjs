import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { writeFile } from 'node:fs/promises'
const browser = await chromium.launch({ headless: true })
const sizes = [
  ['desktop', 1440, 900],
  ['tablet', 1024, 768],
  ['mobile', 390, 844],
  ['narrow', 320, 700],
]
const directory = 'docs/screenshots/art-direction/final-dark/'
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  const page = await context.newPage()
  page.setDefaultTimeout(5000)
  let release
  const gate = new Promise((resolve) => {
    release = resolve
  })
  await page.route('**/src/features/Journal.tsx*', async (route) => {
    await gate
    await route.continue()
  })
  await page.goto('http://127.0.0.1:5180/journal', {
    waitUntil: 'domcontentloaded',
  })
  if (!(await page.locator('.connection').textContent()).includes('DEMO'))
    throw Error('This inspection requires isolated demo mode')
  await page.getByText('Opening research…', { exact: true }).waitFor()
  await page.evaluate(() => document.fonts.ready)
  for (const [size, width, height] of sizes) {
    await page.setViewportSize({ width, height })
    await page.screenshot({ path: directory + size + '-loading.png' })
  }
  release()
  await page.locator('main h1').waitFor()
  await page.unroute('**/src/features/Journal.tsx*')
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(
    'http://127.0.0.1:5180/post/20000000-0000-4000-8000-000000000001',
    { waitUntil: 'domcontentloaded' },
  )
  await page.locator('main h1').waitFor()
  await page
    .getByRole('button', { name: 'Demo researcher', exact: true })
    .click()
  await page
    .getByLabel('Demo participant')
    .selectOption({ label: 'Demo optical engineer' })
  await page.getByRole('button', { name: 'Close dialog' }).click()
  const reply =
    'Visual verification reply: grouped synthetic targets reduce alignment bias.'
  await page.getByLabel('Write a reply').fill(reply)
  await page.getByRole('button', { name: 'Add reply', exact: true }).click()
  await page.getByText(reply, { exact: true }).waitFor()
  await page
    .getByRole('button', { name: 'Demo optical engineer', exact: true })
    .click()
  await page
    .getByLabel('Demo participant')
    .selectOption({ label: 'Demo researcher' })
  await page.getByRole('button', { name: 'Close dialog' }).click()
  await page.goto('http://127.0.0.1:5180/notifications', {
    waitUntil: 'domcontentloaded',
  })
  await page.locator('.notification').first().waitFor()
  for (const [size, width, height] of sizes) {
    await page.setViewportSize({ width, height })
    await page.screenshot({
      path: directory + size + '-notifications-populated.png',
    })
  }
  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze()
  const record = {
    scenario:
      'Isolated demo: actual reply operation; loading screenshots use an explicitly delayed local lazy-module request, not fake backend data',
    notifications: await page.locator('.notification').count(),
    axeViolations: axe.violations,
  }
  await writeFile(
    'docs/art-populated-notifications.json',
    JSON.stringify(record, null, 2),
  )
  console.log(JSON.stringify(record, null, 2))
  if (axe.violations.length) process.exitCode = 1
  await context.close()
} finally {
  await browser.close()
}
