import { readFile } from 'node:fs/promises'
import { expect, finishWorkout, logReps, mainNav, test } from './fixtures.js'

test.describe('navigation and deep links', () => {
  test('every built-in workout has a working detail page', async ({ page }) => {
    await page.goto('/workouts')
    const links = page.locator('.library-results a[href^="/workouts/system-"]')
    await expect(links).toHaveCount(15)
    const hrefs = await links.evaluateAll((els) => els.map((el) => el.getAttribute('href')))
    for (const href of hrefs) {
      await page.goto(href)
      await expect(page.getByRole('button', { name: 'Start workout' })).toBeVisible()
    }
  })

  test('direct links, refresh, and back/forward work', async ({ page }) => {
    await page.goto('/workouts/system-kettlebell')
    await expect(page.getByRole('heading', { level: 1, name: 'Full Body — Kettlebell' })).toBeVisible()
    await page.reload()
    await expect(page.getByText('Goblet squat')).toBeVisible()
    await mainNav(page).getByRole('link', { name: 'History' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'History' })).toBeVisible()
    await page.goBack()
    await expect(page.getByRole('heading', { level: 1, name: 'Full Body — Kettlebell' })).toBeVisible()
    await page.goForward()
    await expect(page.getByRole('heading', { level: 1, name: 'History' })).toBeVisible()
  })

  test('unknown pages and records show a recoverable state', async ({ page }) => {
    await page.goto('/history/nope')
    await expect(page.getByRole('heading', { name: 'Session not found' })).toBeVisible()
    await page.goto('/totally/unknown')
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
    await page.getByRole('link', { name: 'Go home' }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('first run shows empty states with one next action', async ({ page }) => {
    await page.goto('/history')
    await expect(page.getByRole('heading', { name: 'No workouts yet' })).toBeVisible()
    await page.getByRole('link', { name: 'Explore workouts' }).click()
    await page.getByRole('searchbox').fill('unicorn press')
    await expect(page.getByRole('heading', { name: 'No results' })).toBeVisible()
    await page.getByRole('button', { name: 'Clear search', exact: true }).click()
    await expect(page.getByRole('link', { name: /Chest Focus/ })).toBeVisible()
  })

  test('there is no horizontal scrolling at this viewport', async ({ page }) => {
    for (const path of ['/', '/workouts', '/workouts/system-jump-rope', '/builder/new', '/history', '/account']) {
      await page.goto(path)
      await expect(page.locator('main h1').first()).toBeVisible()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, path).toBeLessThanOrEqual(0)
    }
  })
})

test.describe('settings and data', () => {
  test('switching units changes display, not recorded values', async ({ page }) => {
    await page.goto('/workouts/system-chest')
    await page.getByRole('button', { name: 'Start workout' }).click()
    await page.getByRole('button', { name: /Next/ }).click()
    await page.getByLabel('Set 1 weight in lb (optional)').fill('22')
    await logReps(page, 1, 10)
    await finishWorkout(page)
    const bench = page.locator('li', { hasText: 'Dumbbell bench press' }).locator('.log-table')
    await expect(bench).toContainText('22 lb')

    await mainNav(page).getByRole('link', { name: 'Account' }).click()
    await page.getByRole('radio', { name: 'kg' }).click()
    await page.goBack()
    await expect(bench).toContainText('10 kg')
    await mainNav(page).getByRole('link', { name: 'Account' }).click()
    await page.getByRole('radio', { name: 'lb' }).click()
    await page.goBack()
    await expect(bench).toContainText('22 lb')
  })

  test('export, delete everything, and import restore data', async ({ page }, testInfo) => {
    await page.goto('/workouts/system-core')
    await page.getByRole('button', { name: 'Start workout' }).click()
    await logReps(page, 1, 8)
    await finishWorkout(page)

    await page.goto('/account')
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: /Export data/ }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/^repxir-backup-\d{4}-\d{2}-\d{2}\.json$/)
    const file = testInfo.outputPath('backup.json')
    await download.saveAs(file)
    const backup = JSON.parse(await readFile(file, 'utf8'))
    expect(backup).toMatchObject({ app: 'repxir', schemaVersion: 1 })
    expect(backup.sessions).toHaveLength(1)

    await page.getByRole('button', { name: /Delete all data/ }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Delete everything' }).click()
    await expect(page.getByText('All data deleted from this device.')).toBeVisible()
    await page.goto('/history')
    await expect(page.getByRole('heading', { name: 'No workouts yet' })).toBeVisible()

    // A malformed file is rejected without changing anything.
    await page.goto('/account')
    await page.getByTestId('import-input').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"nope":true}') })
    await expect(page.getByText(/Import failed: This does not look like a REPXIR backup file/)).toBeVisible()

    await page.getByTestId('import-input').setInputFiles(file)
    const dialog = page.getByRole('dialog', { name: 'Import backup' })
    await expect(dialog).toContainText('0 workouts · 1 sessions')
    await dialog.getByRole('button', { name: 'Merge into this device' }).click()
    await page.goto('/history')
    await expect(page.getByRole('link', { name: /Core Focus/ })).toBeVisible()
  })
})
