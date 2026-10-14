import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
for (const route of [
  '/',
  '/feed',
  '/explore',
  '/questions',
  '/collaborators',
  '/saved',
  '/projects',
  '/journal',
  '/profile',
  '/settings',
  '/policies',
  '/notifications',
  '/trust',
  '/member/10000000-0000-4000-8000-000000000002',
])
  test('WCAG automated scan ' + route, async ({ page }) => {
    await page.goto(route)
    await expect(page.locator('h1').first()).toBeVisible()
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(
      results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    ).toEqual([])
  })
test('dark theme and mobile accessibility, actual screenshots', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/feed')
  await expect(
    page.getByRole('heading', { name: 'Your research circle.' }),
  ).toBeVisible()
  await page.screenshot({ path: 'docs/screenshots/redesign/desktop-feed.png' })
  await page.goto('/settings')
  await page.getByLabel('Theme', { exact: true }).selectOption('dark')
  await page.goto('/feed')
  await expect(
    page.getByRole('heading', { name: 'Your research circle.' }),
  ).toBeVisible()
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([])
  await page.screenshot({ path: 'docs/screenshots/redesign/dark-feed.png' })
  await page.setViewportSize({ width: 320, height: 900 })
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Your research circle.' }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([])
  await page.screenshot({
    path: 'docs/screenshots/redesign/narrow-feed.png',
    fullPage: true,
  })
  expect(errors).toEqual([])
})
