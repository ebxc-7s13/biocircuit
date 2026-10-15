import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('Global search keeps focus while typing; discovery categories and clear actions work', async ({
  page,
}) => {
  await page.goto('/feed')
  const search = page.getByLabel('Search community', { exact: true })
  await search.pressSequentially('optical', { delay: 80 })
  await expect(page).toHaveURL(/explore/)
  await expect(search).toBeFocused()
  await expect(search).toHaveValue('optical')
  await page.getByRole('button', { name: 'Members', exact: true }).click()
  await expect(
    page
      .locator('main')
      .getByRole('link', { name: 'Demo optical engineer', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Papers', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Start with a source.' }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Clear explore search', exact: true })
    .click()
  await expect(search).toHaveValue('')
})

test('Topic navigation, question statuses, bookmarks and saved categories preserve real local state', async ({
  page,
}) => {
  await page.goto('/feed?topic=Biomaterials')
  await expect(
    page.getByRole('link', {
      name: 'Which tests changed your hydrogel design?',
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', {
      name: 'Patient-level validation with small cohorts',
      exact: true,
    }),
  ).toHaveCount(0)
  await page
    .locator('main')
    .getByRole('button', { name: 'Save post', exact: true })
    .click()
  await page.getByRole('link', { name: 'Saved', exact: true }).click()
  await expect(page.locator('main h1')).toHaveText('Your saved research.')
  await expect(
    page.getByRole('link', {
      name: 'Which tests changed your hydrogel design?',
      exact: true,
    }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Papers', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Your reading list starts here.' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Questions', exact: true }).click()
  await expect(page.locator('main h1')).toHaveText('Questions worth solving.')
  await page.getByRole('button', { name: 'Solved', exact: true }).click()
  await expect(page.locator('.post')).toHaveCount(0)
  await page.getByRole('button', { name: 'Unanswered', exact: true }).click()
  await expect(page.locator('.post')).toHaveCount(2)
})

test('Post menus support keyboard dismissal, edit, report, and actual mute operations', async ({
  page,
}) => {
  await page.goto('/feed')
  const menu = page.locator('.post-menu summary').first()
  await menu.click()
  await expect(
    page.getByRole('button', { name: 'Edit', exact: true }),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(menu).toBeFocused()
  await expect(
    page.getByRole('button', { name: 'Edit', exact: true }),
  ).toBeHidden()
  await menu.click()
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await page
    .getByLabel('Title', { exact: true })
    .fill('Patient-level validation with repeated cohorts')
  await page.getByRole('button', { name: 'Save edits', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.reload()
  await expect(
    page.getByRole('link', {
      name: 'Patient-level validation with repeated cohorts',
      exact: true,
    }),
  ).toBeVisible()
  await menu.click()
  await page.getByRole('button', { name: 'Report', exact: true }).click()
  await expect(
    page.getByRole('dialog', { name: 'Report a contribution' }),
  ).toBeVisible()
  await page
    .getByLabel('Reason', { exact: true })
    .fill('Synthetic test report for review')
  await page.getByRole('button', { name: 'Submit report', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await menu.click()
  await page
    .getByRole('button', { name: 'Mute Biosignal processing', exact: true })
    .first()
    .click()
  await expect(
    page.getByRole('link', {
      name: 'Patient-level validation with repeated cohorts',
      exact: true,
    }),
  ).toHaveCount(0)
  await page.reload()
  await expect(
    page.getByRole('link', {
      name: 'Patient-level validation with repeated cohorts',
      exact: true,
    }),
  ).toHaveCount(0)
})

test('Mobile navigation and composer are accessible, focus trapped, and reachable above bottom navigation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await page.goto('/feed')
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([])
  await page.getByRole('link', { name: 'Journal club', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('main h1')).toHaveText('Journal club.')
  await page
    .getByRole('navigation', { name: 'Mobile primary navigation' })
    .getByRole('button', { name: 'Create a post' })
    .click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByLabel('Title', { exact: true }).fill('x'.repeat(100))
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
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(
    page
      .getByRole('navigation', { name: 'Mobile primary navigation' })
      .getByRole('button', { name: 'Create a post' }),
  ).toBeFocused()
})

test('Auth distinguishes demo phone status and review status, with accessible modal controls', async ({
  page,
}) => {
  await page.goto('/feed')
  await page
    .getByRole('button', { name: 'Demo researcher', exact: true })
    .click()
  await expect(page.getByText('Identity check', { exact: true })).toBeVisible()
  await expect(
    page.getByText('Not verified · demo', { exact: false }),
  ).toBeVisible()
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([])
  await page.getByRole('button', { name: 'Close dialog' }).click()
})

for (const width of [320, 375, 390, 768, 1024, 1280, 1440])
  test('Every major route reflows at ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
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
      '/trust',
      '/settings',
      '/policies',
      '/post/20000000-0000-4000-8000-000000000001',
      '/project/30000000-0000-4000-8000-000000000001',
    ]) {
      await page.goto(route)
      await expect(page.locator('main h1').first()).toBeVisible()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        route,
      ).toBe(true)
    }
    expect(errors).toEqual([])
  })

test('Native vertical feed scroll and back navigation restore the reading position', async ({
  page,
}) => {
  await page.goto('/feed')
  await expect(page.locator('main h1')).toBeVisible()
  await page.evaluate(() => window.scrollTo(0, 600))
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(500)
  await page.getByRole('link', { name: 'Projects', exact: true }).click()
  await expect(page.locator('main h1')).toHaveText('Projects with purpose.')
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  await page.goBack()
  await expect(page.locator('main h1')).toHaveText('Your research circle.')
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(500)
})
