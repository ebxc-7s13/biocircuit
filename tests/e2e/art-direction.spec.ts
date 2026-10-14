import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
const project = '/project/30000000-0000-4000-8000-000000000001'
test('dark first visit, self-hosted typography, glass and persistent motion control', async ({
  page,
}) => {
  await page.goto('/feed')
  await expect(page.locator('main h1')).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  expect(
    await page.evaluate(() => document.documentElement.dataset.theme),
  ).toBe('dark')
  expect(
    await page
      .locator('.sidebar')
      .evaluate((e) => getComputedStyle(e).backdropFilter),
  ).toContain('blur')
  expect(
    await page.evaluate(
      () =>
        document.fonts.check('600 30px "Barlow Condensed"') &&
        document.fonts.check('400 15px "Space Grotesk"'),
    ),
  ).toBe(true)
  await page.mouse.move(500, 300)
  await expect
    .poll(() =>
      page
        .locator('.pointer-light')
        .evaluate((e) => (e as HTMLElement).style.transform),
    )
    .toContain('500px')
  await page
    .getByRole('button', { name: 'Pause ambient motion', exact: true })
    .click()
  expect(
    await page
      .locator('.lab-field i')
      .first()
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe('none')
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Resume ambient motion', exact: true }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Resume ambient motion', exact: true })
    .click()
  expect(
    await page
      .locator('.lab-field i')
      .first()
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe('signal-drift')
})
test('blue project hover preserves geometry and animation phase, keyboard opens real workspace', async ({
  page,
}) => {
  await page.goto('/projects')
  const preview = page.locator('.project-preview').first()
  await expect(preview).toBeVisible()
  const before = await preview.boundingBox()
  await preview.hover()
  await expect
    .poll(() =>
      preview
        .locator('.preview-band')
        .evaluate((e) => getComputedStyle(e).transform),
    )
    .toBe('none')
  expect(
    await preview
      .locator('.preview-band')
      .evaluate((e) => getComputedStyle(e).backgroundColor),
  ).toBe('rgb(0, 0, 255)')
  await expect
    .poll(() =>
      preview
        .locator('.preview-marquee')
        .evaluate((e) => getComputedStyle(e).animationPlayState),
    )
    .toBe('running')
  const phase = await preview
    .locator('.preview-marquee')
    .evaluate((e) => Number(e.getAnimations()[0]?.currentTime))
  await page.mouse.move(250, 90)
  await expect
    .poll(() =>
      preview
        .locator('.preview-marquee')
        .evaluate((e) => getComputedStyle(e).animationPlayState),
    )
    .toBe('paused')
  await preview.hover()
  const phaseAfter = await preview
    .locator('.preview-marquee')
    .evaluate((e) => Number(e.getAnimations()[0]?.currentTime))
  expect(phaseAfter).toBeGreaterThanOrEqual(phase)
  expect((await preview.boundingBox())?.height).toBe(before?.height)
  await page.keyboard.press('Tab')
  await preview.focus()
  expect(
    await preview
      .locator('.preview-marquee')
      .evaluate((e) => getComputedStyle(e).animationPlayState),
  ).toBe('paused')
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([])
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(project)
  await expect(page.locator('main h1')).toContainText(
    'Modular fluorescence microscope',
  )
})
test('touch preview is static and a single tap navigates without horizontal overflow', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:5173/projects')
  const preview = page.locator('.project-preview').first()
  await expect(preview).toBeVisible()
  expect(
    await preview
      .locator('.preview-band')
      .evaluate((e) => getComputedStyle(e).transform),
  ).toBe('none')
  expect(
    await preview
      .locator('.preview-marquee')
      .evaluate((e) => getComputedStyle(e).animationPlayState),
  ).toBe('paused')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await preview.tap()
  await expect(page).toHaveURL(new RegExp(project))
  await context.close()
})
test('reduced motion and short-phone first content remain usable', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 320, height: 700 })
  await page.goto('/feed')
  await expect(page.locator('.post h2').first()).toBeVisible()
  const title = await page.locator('.post h2').first().boundingBox(),
    nav = await page.locator('.mobile-bottom').boundingBox()
  expect(title!.y + title!.height).toBeLessThan(nav!.y)
  expect(
    await page
      .locator('.lab-field i')
      .first()
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe('none')
  await page.goto('/projects')
  await expect(page.locator('.project-preview')).toBeVisible()
  expect(
    await page
      .locator('.preview-marquee')
      .first()
      .evaluate((e) => getComputedStyle(e).animationPlayState),
  ).toBe('paused')
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([])
})
test('light surfaces, scholarly error and composer preserve contrast and accessible controls', async ({
  page,
}) => {
  test.setTimeout(90000)
  await page.goto('/settings')
  await page.getByLabel('Theme', { exact: true }).selectOption('light')
  for (const route of [
    '/feed',
    '/explore',
    '/projects',
    '/journal',
    '/collaborators',
    '/profile',
    '/saved',
    '/notifications',
    '/trust',
    '/policies',
  ]) {
    await page.goto(route)
    await expect(page.locator('main h1').first()).toBeVisible()
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations,
      route,
    ).toEqual([])
  }
  await page.goto('/journal')
  await page
    .getByLabel('Title, author, topic, DOI or PMID')
    .fill('Optical microscopy')
  await page
    .getByRole('button', { name: 'Search Crossref', exact: true })
    .click()
  await expect(page.getByRole('alert')).toContainText(
    'configured backend proxy',
  )
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([])
  await page.goto('/feed')
  await page.getByRole('button', { name: 'Contribute', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([])
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})
