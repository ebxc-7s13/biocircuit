import { test, expect } from '@playwright/test'
test('desktop social navigation, publishing, save, reply and accepted-answer journey', async ({
  page,
}) => {
  await page.goto('/feed')
  await expect(
    page.getByRole('heading', { name: 'Your research circle.' }),
  ).toBeVisible()
  await expect(
    page.getByText('DEMO · synthetic research', { exact: false }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Questions', exact: true }).click()
  await expect(page.locator('.canvas, .dock')).toHaveCount(0)
  await expect(page).toHaveURL(/questions/)
  await expect(
    page.getByRole('heading', { name: 'Questions worth solving.' }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Ask a question', exact: true })
    .click()
  await page
    .getByLabel('Title', { exact: true })
    .fill('How do we test optical alignment repeatability?')
  await page
    .getByLabel('Context', { exact: true })
    .fill(
      'Using synthetic fluorescent targets, what repeated measurement protocol controls optical alignment across sessions?',
    )
  await page
    .getByLabel('Topics, separated by commas')
    .fill('Biomedical imaging')
  await page.getByRole('button', { name: 'Publish', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page
    .getByRole('link', {
      name: 'How do we test optical alignment repeatability?',
      exact: true,
    })
    .click()
  await expect(page).toHaveURL(/post\//)
  await expect(page.locator('main h1')).toHaveText(
    'How do we test optical alignment repeatability?',
  )
  await page.getByRole('button', { name: 'Save post', exact: true }).click()
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Unsave post', exact: true }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Demo researcher', exact: true })
    .click()
  await page
    .getByLabel('Demo participant')
    .selectOption('10000000-0000-4000-8000-000000000002')
  await page.getByRole('button', { name: 'Close dialog' }).click()
  await page
    .getByLabel('Write a reply')
    .fill(
      'Repeat a blinded alignment protocol using calibrated synthetic targets.',
    )
  await page.getByRole('button', { name: 'Add reply', exact: true }).click()
  await expect(
    page.getByText(
      'Repeat a blinded alignment protocol using calibrated synthetic targets.',
      { exact: true },
    ),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Demo optical engineer', exact: true })
    .click()
  await page
    .getByLabel('Demo participant')
    .selectOption('10000000-0000-4000-8000-000000000001')
  await page.getByRole('button', { name: 'Close dialog' }).click()
  await page.getByRole('button', { name: 'Accept answer', exact: true }).click()
  await expect(
    page.getByText('✓ Accepted answer', { exact: true }),
  ).toBeVisible()
  await page
    .getByRole('link', { name: 'Notifications', exact: false })
    .first()
    .click()
  await expect(page.getByText('New reply:', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Mark all as read' }).click()
  await expect(page.getByText('reply · Read', { exact: true })).toBeVisible()
})
test('project creation, private workspace, log and archive', async ({
  page,
}) => {
  await page.goto('/projects')
  await page
    .getByRole('button', { name: 'Start a project', exact: true })
    .first()
    .click()
  await page.getByLabel('Project title').fill('Repeatable optical bench study')
  await page
    .getByLabel('Problem statement')
    .fill(
      'Measure repeatability of an optical bench with synthetic data and controlled calibration.',
    )
  await page
    .getByLabel('Topics, separated by commas')
    .fill('Biomedical imaging')
  await page.getByLabel('Visibility', { exact: true }).selectOption('private')
  await page.getByRole('button', { name: 'Save project' }).click()
  await page
    .getByRole('link', { name: 'Repeatable optical bench study', exact: true })
    .click()
  await page.getByRole('button', { name: 'Add project log' }).click()
  await page
    .getByLabel('Title', { exact: true })
    .fill('Milestone: calibration baseline captured')
  await page
    .getByLabel('Context', { exact: true })
    .fill(
      'Recorded repeated baseline measurements with synthetic targets. Next step is comparing alignment across sessions.',
    )
  await page
    .getByLabel('Topics, separated by commas')
    .fill('Biomedical imaging')
  await page.getByRole('button', { name: 'Publish', exact: true }).click()
  await expect(
    page.getByRole('link', {
      name: 'Milestone: calibration baseline captured',
    }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Archive project', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: 'Restore project', exact: true }),
  ).toBeVisible()
})
for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440])
  test('responsive reflow and history at ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/feed')
    await expect(
      page.getByRole('heading', { name: 'Your research circle.' }),
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
    if (width < 768)
      await page.getByRole('button', { name: 'Open navigation' }).click()
    await page
      .getByRole('link', { name: 'Questions', exact: false })
      .first()
      .click()
    await expect(
      page.getByRole('heading', { name: 'Questions worth solving.' }),
    ).toBeVisible()
    await page.goBack()
    await expect(
      page.getByRole('heading', { name: 'Your research circle.' }),
    ).toBeVisible()
    await page.reload()
    await expect(
      page.getByRole('heading', { name: 'Your research circle.' }),
    ).toBeVisible()
  })
test('reduced motion, keyboard shortcuts, modal Escape and focus return', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/feed')
  await page.keyboard.press('/')
  await expect(
    page.getByLabel('Search community', { exact: true }),
  ).toBeFocused()
  await page.getByLabel('Search community', { exact: true }).fill('c')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByLabel('Search community', { exact: true }).fill('')
  await page.getByRole('button', { name: 'Keyboard shortcuts' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Keyboard shortcuts' }),
  ).toBeFocused()
  expect(
    await page
      .locator('.lab-field i')
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none')
})
test('trust console denied, provider failure honest and theme persists', async ({
  page,
}) => {
  await page.goto('/trust')
  await expect(page.getByText('Access denied.', { exact: false })).toBeVisible()
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
  await page.goto('/settings')
  await page.getByLabel('Theme', { exact: true }).selectOption('dark')
  await page.reload()
  await expect(page.getByLabel('Theme', { exact: true })).toHaveValue('dark')
  await page.getByLabel('Pause the living background').check()
  expect(
    await page
      .locator('.lab-field i')
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none')
})

test('member routes, follow state and persisted notification categories', async ({
  page,
}) => {
  await page.goto('/member/10000000-0000-4000-8000-000000000002')
  await expect(
    page.getByRole('heading', { name: 'Demo optical engineer.' }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Follow researcher', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: 'Unfollow', exact: true }),
  ).toBeVisible()
  await page.goto('/settings')
  await page.getByLabel('reply', { exact: true }).uncheck()
  await page.reload()
  await expect(page.getByLabel('reply', { exact: true })).not.toBeChecked()
})
test('local draft recovery and source selection never fabricate scholarly results', async ({
  page,
}) => {
  await page.goto('/feed')
  await page.getByRole('button', { name: 'Contribute', exact: true }).click()
  await page
    .getByLabel('Title', { exact: true })
    .fill('A recoverable synthetic research draft')
  await page.getByRole('button', { name: 'Close dialog' }).click()
  await page.getByRole('button', { name: 'Contribute', exact: true }).click()
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue(
    'A recoverable synthetic research draft',
  )
  await page.getByRole('button', { name: 'Close dialog' }).click()
  await page.goto('/journal')
  await page.getByLabel('Scholarly source').selectOption('PubMed')
  await page.getByLabel('Title, author, topic, DOI or PMID').fill('123456')
  await page.getByRole('button', { name: 'Search PubMed', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText(
    'configured backend proxy',
  )
  await expect(page.locator('.paper')).toHaveCount(0)
})
