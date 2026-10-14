import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
const pass = process.argv[2] ?? 'final'
const theme = process.argv[3] ?? 'dark'
if (!/^[a-z0-9-]+$/.test(pass) || !['dark', 'light'].includes(theme))
  throw Error('Invalid capture arguments')
const directory = resolve('docs/screenshots/art-direction', pass)
await mkdir(directory, { recursive: true })
const routes = {
  landing: '/',
  missing: '/unavailable-route',
  feed: '/feed',
  explore: '/explore',
  questions: '/questions',
  projects: '/projects',
  journal: '/journal',
  collaborators: '/collaborators',
  profile: '/profile',
  saved: '/saved',
  notifications: '/notifications',
  trust: '/trust',
  settings: '/settings',
  policies: '/policies',
  post: '/post/20000000-0000-4000-8000-000000000001',
  project: '/project/30000000-0000-4000-8000-000000000001',
  member: '/member/10000000-0000-4000-8000-000000000002',
}
const browser = await chromium.launch({ headless: true })
const records = []
try {
  for (const [size, width, height] of [
    ['desktop', 1440, 900],
    ['tablet', 1024, 768],
    ['mobile', 390, 844],
    ['narrow', 320, 700],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      hasTouch: width < 768,
    })
    await context.addInitScript(
      (theme) => localStorage.setItem('biocircuit-theme', theme),
      theme,
    )
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push('Console: ' + message.text())
    })
    for (const [name, route] of Object.entries(routes)) {
      await page.goto('http://127.0.0.1:5180' + route)
      await page.locator('main h1').first().waitFor({ timeout: 10000 })
      await page.evaluate(() => document.fonts.ready)
      await page.screenshot({
        path: directory + '/' + size + '-' + name + '.png',
      })
      records.push(
        await page.evaluate(
          ({ size, route, errors }) => ({
            size,
            route,
            width: window.innerWidth,
            height: window.innerHeight,
            overflow: document.documentElement.scrollWidth > window.innerWidth,
            errors: [...errors],
            firstPostTitle: document
              .querySelector('.post h2')
              ?.getBoundingClientRect()
              .toJSON(),
            navigation: document
              .querySelector('.mobile-bottom')
              ?.getBoundingClientRect()
              .toJSON(),
            fonts: [...document.fonts].map((f) => ({
              family: f.family,
              status: f.status,
            })),
          }),
          { size, route, errors },
        ),
      )
    }
    await context.close()
  }
} finally {
  await browser.close()
}
await writeFile(
  directory + '/measurements.json',
  JSON.stringify(records, null, 2),
)
console.log(
  JSON.stringify(
    {
      pass,
      theme,
      screenshots: records.length,
      overflow: records.filter((r) => r.overflow),
      errors: records.filter((r) => r.errors.length),
    },
    null,
    2,
  ),
)
if (records.some((r) => r.overflow || r.errors.length)) process.exitCode = 1
